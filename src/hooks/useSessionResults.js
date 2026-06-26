import { useState, useEffect } from 'react';
import { getFinalPositions, getDrivers, getLaps } from '../services/openf1';
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
    const haystack = r.raceName.replace(' Grand Prix', '').toLowerCase().trim();
    return haystack.includes(needle) || needle.includes(haystack);
  });
  return match?.round ?? null;
};

export const useSessionResults = (sessionKey, sessionType, meetingName, year = 2025) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionKey) return;

    let cancelled = false;

    setLoading(true);
    setError(null);
    setResults([]);

    const isPractice = sessionType?.startsWith('Practice');
    const isRace = sessionType === 'Race' || sessionType === 'Sprint';
    const isQualifying = sessionType === 'Qualifying' || sessionType === 'Sprint Qualifying';

    const run = async () => {
      if (isPractice) {
        const [positions, drivers, laps] = await Promise.all([
          getFinalPositions(sessionKey),
          getDrivers(sessionKey).catch(() => []),
          getLaps(sessionKey).catch(() => []),
        ]);
        if (cancelled) return;

        // Best lap per driver (exclude pit-out laps and null durations)
        const bestLapMap = new Map();
        for (const lap of laps) {
          if (lap.is_pit_out_lap || !lap.lap_duration) continue;
          const prev = bestLapMap.get(lap.driver_number);
          if (!prev || lap.lap_duration < prev) bestLapMap.set(lap.driver_number, lap.lap_duration);
        }

        // Format seconds → "M:SS.mmm"
        const formatLapTime = (secs) => {
          const m = Math.floor(secs / 60);
          const s = (secs % 60).toFixed(3).padStart(6, '0');
          return `${m}:${s}`;
        };

        // Build by driver_number; enrich with static photo data keyed by acronym
        const acronymMap = new Map(DRIVER_STATICS_2026);
        const driverMap = new Map(drivers.map(d => ({
          ...acronymMap.get(d.name_acronym),
          ...d,
        })).map(d => [d.driver_number, d]));
        setResults(positions.map(p => ({
          position: p.position,
          driver_number: p.driver_number,
          driver: driverMap.get(p.driver_number) ?? null,
          gap: bestLapMap.has(p.driver_number) ? formatLapTime(bestLapMap.get(p.driver_number)) : null,
          points: null,
          status: null,
        })));

      } else if (isRace || isQualifying) {
        const [schedule, openF1Drivers] = await Promise.all([
          getScheduleCached(year),
          getDrivers(sessionKey).catch(() => []),
        ]);
        if (cancelled) return;

        // Start from static map, overlay with live OpenF1 data if available
        const driverPhotoMap = new Map(DRIVER_STATICS_2026);
        for (const d of openF1Drivers) {
          driverPhotoMap.set(d.name_acronym, { ...driverPhotoMap.get(d.name_acronym), ...d });
        }
        const round = findRound(schedule, meetingName);
        if (!round) { setResults([]); return; }

        const jolpikaRace = isRace
          ? await getRaceResults(year, round)
          : await getQualifyingResults(year, round);
        if (cancelled) return;

        if (!jolpikaRace) { setResults([]); return; }

        const rawResults = isRace
          ? (jolpikaRace.Results ?? [])
          : (jolpikaRace.QualifyingResults ?? []);

        setResults(rawResults.map((r, idx) => {
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
        }));
      }
    };

    run()
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [sessionKey, sessionType, meetingName, year]);

  return { results, loading, error };
};
