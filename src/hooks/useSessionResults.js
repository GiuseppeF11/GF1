import { useState, useEffect } from 'react';
import { getFinalPositions, getDrivers, getLaps, getIntervals } from '../services/openf1';
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

export const useSessionResults = (sessionKey, sessionType, meetingName, year = 2025, isLive = false) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionKey) return;

    let cancelled = false;

    const isPractice = sessionType?.startsWith('Practice');
    const isRace = sessionType === 'Race' || sessionType === 'Sprint';
    const isQualifying = sessionType === 'Qualifying' || sessionType === 'Sprint Qualifying';

    const buildResults = async () => {
      // Live race/qualifying: use OpenF1 position + intervals (Jolpica has no results yet)
      if (isLive && (isRace || isQualifying)) {
        const [positions, drivers, intervals] = await Promise.all([
          getFinalPositions(sessionKey),
          getDrivers(sessionKey).catch(() => []),
          getIntervals(sessionKey).catch(() => []),
        ]);

        const lastIntervalMap = new Map();
        for (const iv of intervals) {
          lastIntervalMap.set(iv.driver_number, iv);
        }

        const acronymMap = new Map(DRIVER_STATICS_2026);
        const driverMap = new Map(
          drivers.map(d => [d.driver_number, { ...acronymMap.get(d.name_acronym), ...d }])
        );

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
      }

      if (isPractice) {
        const [positions, drivers, laps] = await Promise.all([
          getFinalPositions(sessionKey),
          getDrivers(sessionKey).catch(() => []),
          getLaps(sessionKey).catch(() => []),
        ]);

        const bestLapMap = new Map();
        for (const lap of laps) {
          if (lap.is_pit_out_lap || !lap.lap_duration) continue;
          const prev = bestLapMap.get(lap.driver_number);
          if (!prev || lap.lap_duration < prev) bestLapMap.set(lap.driver_number, lap.lap_duration);
        }

        const formatLapTime = (secs) => {
          const m = Math.floor(secs / 60);
          const s = (secs % 60).toFixed(3).padStart(6, '0');
          return `${m}:${s}`;
        };

        const acronymMap = new Map(DRIVER_STATICS_2026);
        const driverMap = new Map(drivers.map(d => ({
          ...acronymMap.get(d.name_acronym),
          ...d,
        })).map(d => [d.driver_number, d]));

        return positions.map(p => ({
          position: p.position,
          driver_number: p.driver_number,
          driver: driverMap.get(p.driver_number) ?? null,
          gap: bestLapMap.has(p.driver_number) ? formatLapTime(bestLapMap.get(p.driver_number)) : null,
          points: null,
          status: null,
        }));
      }

      if (isRace || isQualifying) {
        const [schedule, openF1Drivers] = await Promise.all([
          getScheduleCached(year),
          getDrivers(sessionKey).catch(() => []),
        ]);

        const driverPhotoMap = new Map(DRIVER_STATICS_2026);
        for (const d of openF1Drivers) {
          driverPhotoMap.set(d.name_acronym, { ...driverPhotoMap.get(d.name_acronym), ...d });
        }
        const round = findRound(schedule, meetingName);
        if (!round) return [];

        const jolpikaRace = isRace
          ? await getRaceResults(year, round)
          : await getQualifyingResults(year, round);

        if (!jolpikaRace) return [];

        const rawResults = isRace
          ? (jolpikaRace.Results ?? [])
          : (jolpikaRace.QualifyingResults ?? []);

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
              : (r.Q3 ?? r.Q2 ?? r.Q1 ?? null),
            points: r.points ?? null,
            status: r.status ?? null,
          };
        });
      }

      return [];
    };

    // Initial fetch — shows loading spinner
    const initial = async () => {
      setLoading(true);
      setError(null);
      setResults([]);
      try {
        const data = await buildResults();
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Subsequent polls — silent update, no spinner flicker
    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await buildResults();
        if (!cancelled) setResults(data);
      } catch {
        // silent
      }
    };

    initial();

    if (!isLive) return () => { cancelled = true; };

    const timer = setInterval(poll, 15_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [sessionKey, sessionType, meetingName, year, isLive]);

  return { results, loading, error };
};
