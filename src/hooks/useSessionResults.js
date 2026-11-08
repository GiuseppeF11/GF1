import { useState, useEffect } from 'react';
import { getFinalPositions, getDrivers, getIntervals } from '../services/openf1';
import { getSeasonSchedule, getRaceResults, getQualifyingResults } from '../services/jolpica';
import { DRIVER_STATICS_2026 } from '../utils/driverStatics2026';

// Module-level cache: stores the Promise directly to avoid concurrent duplicate fetches
const scheduleCache = {};

const getScheduleCached = (year) => {
  if (!scheduleCache[year]) {
    scheduleCache[year] = getSeasonSchedule(year);
  }
  return scheduleCache[year];
};

const findRound = (schedule, meetingName) => {
  if (!meetingName) return null;
  const needle = meetingName.replace(' Grand Prix', '').toLowerCase().trim();
  const match = schedule.find(r => {
    const raceName = r.raceName.replace(' Grand Prix', '').toLowerCase();
    const country = r.Circuit.Location.country.toLowerCase();
    const locality = r.Circuit.Location.locality.toLowerCase();
    return (
      raceName.includes(needle) || needle.includes(raceName) ||
      country.includes(needle) || needle.includes(country) ||
      locality.includes(needle) || needle.includes(locality)
    );
  });
  return match?.round ?? null;
};

// Jolpica mirrors the official FIA classification, which lands anywhere from ~20min
// to several hours after the chequered flag. Until then OpenF1 timing data is the only
// source, so we serve that as provisional and keep retrying Jolpica for this long.
const OFFICIAL_WAIT_MS = 6 * 60 * 60 * 1000;
const POLL_LIVE_MS = 15_000;
const POLL_MIN_MS = 20_000;
const POLL_MAX_MS = 120_000;
const MAX_BLIND_POLLS = 20;

const buildDriverMap = (openF1Drivers) => {
  const acronymMap = new Map(DRIVER_STATICS_2026);
  return new Map(
    openF1Drivers.map(d => [d.driver_number, { ...acronymMap.get(d.name_acronym), ...d }])
  );
};

/**
 * Classification derived from OpenF1 timing data. Available as soon as a session
 * ends, so it fills the gap before the official classification is published.
 */
const buildFromOpenF1 = async (sessionKey) => {
  const [positions, drivers, intervals] = await Promise.all([
    getFinalPositions(sessionKey),
    getDrivers(sessionKey).catch(() => []),
    getIntervals(sessionKey).catch(() => []),
  ]);

  const driverMap = buildDriverMap(drivers);

  const lastIntervalMap = new Map();
  for (const iv of intervals) {
    lastIntervalMap.set(iv.driver_number, iv);
  }

  return positions.map(p => {
    const iv = lastIntervalMap.get(p.driver_number);
    const gapRaw = iv?.gap_to_leader;
    const gap = p.position === 1 || gapRaw == null ? null : String(gapRaw);
    return {
      position: p.position,
      driver_number: p.driver_number,
      driver: driverMap.get(p.driver_number) ?? null,
      gap,
      points: null,
      status: null,
    };
  });
};

/** Official classification from Jolpica — includes points, DNF status and real gaps. */
const buildFromJolpica = async ({ sessionKey, isRace, round, year }) => {
  const [raceData, openF1Drivers] = await Promise.all([
    isRace ? getRaceResults(year, round) : getQualifyingResults(year, round),
    getDrivers(sessionKey).catch(() => []),
  ]);

  if (!raceData) return [];

  const rawResults = isRace ? (raceData.Results ?? []) : (raceData.QualifyingResults ?? []);
  if (rawResults.length === 0) return [];

  const driverPhotoMap = new Map(DRIVER_STATICS_2026);
  for (const d of openF1Drivers) {
    driverPhotoMap.set(d.name_acronym, { ...driverPhotoMap.get(d.name_acronym), ...d });
  }

  return rawResults.map((r, idx) => {
    const code = r.Driver?.code;
    const photo = driverPhotoMap.get(code);
    return {
      position: parseInt(r.position ?? idx + 1),
      driver_number: parseInt(r.Driver?.permanentNumber ?? 0),
      driver_id: r.Driver?.driverId ?? null,
      driver: {
        full_name: `${r.Driver?.givenName ?? ''} ${r.Driver?.familyName ?? ''}`.trim(),
        name_acronym: code,
        team_name: r.Constructor?.name ?? '',
        team_colour: photo?.team_colour ?? null,
        headshot_url: photo?.headshot_url ?? null,
      },
      gap: isRace
        ? (r.Time?.time ?? (r.status !== 'Finished' ? r.status : null))
        // Jolpica sends "" for a segment the driver did not reach, so take the last
        // one they actually set: ?? would stop at the empty Q3 of a Q2 elimination.
        : ([r.Q3, r.Q2, r.Q1].find(t => t) ?? null),
      points: r.points ?? null,
      status: r.status ?? null,
    };
  });
};

/**
 * Session classification, resilient to the delay in official data.
 *
 * Race / qualifying resolve to Jolpica when the official classification exists, and
 * fall back to OpenF1 timing data (flagged `provisional`) when it does not yet.
 * Polling continues after the session ends until the official data lands, so the page
 * upgrades itself instead of needing a manual reload.
 *
 * @param {object}  opts
 * @param {number}  opts.sessionKey   OpenF1 session_key
 * @param {string}  opts.sessionType  OpenF1 session_name ('Race', 'Qualifying', 'Practice 1'…)
 * @param {number}  [opts.round]      Jolpica round — skips the ambiguous name lookup
 * @param {string}  [opts.meetingName] Fallback when round is unknown
 * @param {number}  opts.year
 * @param {boolean} [opts.isLive]
 * @param {string}  [opts.sessionEnd] UTC end — bounds how long we chase official data
 */
export const useSessionResults = ({
  sessionKey,
  sessionType,
  round = null,
  meetingName = null,
  year = new Date().getFullYear(),
  isLive = false,
  sessionEnd = null,
}) => {
  const [results, setResults] = useState([]);
  const [provisional, setProvisional] = useState(false);
  const [awaitingTimes, setAwaitingTimes] = useState(false);
  const [timingUnavailable, setTimingUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionKey) {
      setResults([]);
      setProvisional(false);
      return;
    }

    let cancelled = false;
    let timer = null;
    let delay = POLL_MIN_MS;
    let attempts = 0;

    const isRace = sessionType === 'Race' || sessionType === 'Sprint';
    const isQualifying = sessionType === 'Qualifying' || sessionType === 'Sprint Qualifying';

    const endedAt = sessionEnd ? new Date(sessionEnd).getTime() : null;
    // Without a known end time there is nothing to bound the wait, so cap the attempts
    // instead — otherwise a session that never publishes would poll forever.
    const withinWaitWindow = () =>
      endedAt == null
        ? attempts < MAX_BLIND_POLLS
        : Date.now() - endedAt < OFFICIAL_WAIT_MS;

    // Sessions taken from the calendar carry their name as the key; only a real
    // OpenF1 session_key is numeric, and only that can be used for timing data.
    const hasTimingKey = Number.isFinite(Number(sessionKey));

    // OpenF1 returns 401 to unauthenticated clients for as long as any session is
    // live, so a failure here is expected rather than exceptional.
    const tryTiming = async () => {
      if (!hasTimingKey) return null;
      try {
        return await buildFromOpenF1(sessionKey);
      } catch {
        return null;
      }
    };

    const buildResults = async () => {
      if (!isRace && !isQualifying) return { data: [], isProvisional: false };

      // A live session has no official classification yet by definition.
      if (!isLive) {
        let resolvedRound = round;
        if (!resolvedRound) {
          const schedule = await getScheduleCached(year);
          resolvedRound = findRound(schedule, meetingName);
        }
        if (resolvedRound) {
          const official = await buildFromJolpica({
            sessionKey,
            isRace,
            round: resolvedRound,
            year,
          });
          if (official.length > 0) {
            // Jolpica publishes the order before the lap times and backfills them
            // later, so a classification where nobody has a time is not final yet.
            // Without this the poll would stop and the times would never appear.
            const noTimes = official.every(r => r.gap == null);
            return { data: official, isProvisional: false, partial: noTimes };
          }
        }
      }

      // Official data not published yet — serve OpenF1 timing data meanwhile.
      const data = await tryTiming();
      return data == null
        ? { data: [], isProvisional: false, unavailable: true }
        : { data, isProvisional: true };
    };

    const schedule = (ms) => {
      timer = setTimeout(() => run(false), ms);
    };

    const run = async (isInitial) => {
      if (cancelled) return;
      attempts++;
      if (isInitial) {
        setLoading(true);
        setError(null);
        setResults([]);
        setProvisional(false);
        setAwaitingTimes(false);
        setTimingUnavailable(false);
      }

      try {
        const { data, isProvisional, unavailable, partial } = await buildResults();
        if (cancelled) return;
        setResults(data);
        setProvisional(isProvisional);
        setAwaitingTimes(!!partial);
        setTimingUnavailable(!!unavailable);

        if (isLive) {
          schedule(POLL_LIVE_MS);
        } else if ((isProvisional || partial || data.length === 0) && withinWaitWindow()) {
          schedule(delay);
          delay = Math.min(delay * 1.5, POLL_MAX_MS);
        }
      } catch (err) {
        if (cancelled) return;
        if (isInitial) setError(err);
        if (isLive || withinWaitWindow()) {
          schedule(delay);
          delay = Math.min(delay * 2, POLL_MAX_MS);
        }
      } finally {
        if (!cancelled && isInitial) setLoading(false);
      }
    };

    run(true);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionKey, sessionType, round, meetingName, year, isLive, sessionEnd]);

  return { results, provisional, awaitingTimes, timingUnavailable, loading, error };
};
