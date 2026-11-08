import { useState, useEffect } from 'react';
import { getSeasonSchedule } from '../services/jolpica';
import { findLiveSession } from './useSchedule';

const scheduleCache = {};
const getScheduleCached = (year) => {
  if (!scheduleCache[year]) scheduleCache[year] = getSeasonSchedule(year);
  return scheduleCache[year];
};

const TICK_MS = 30_000;

/**
 * Whether a session is running right now, derived from the Jolpica calendar.
 *
 * This deliberately does not ask OpenF1. OpenF1 answers 401 to unauthenticated
 * clients for as long as a session is live — exactly the window this hook exists to
 * detect — so depending on it meant the live badge could never light up.
 */
export const useLiveSession = () => {
  const [state, setState] = useState({ isLive: false, liveSession: null, year: null, round: null });

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const check = async () => {
      const year = new Date().getFullYear();
      try {
        const schedule = await getScheduleCached(year);
        if (cancelled) return;

        const now = new Date();
        for (const race of schedule) {
          const session = findLiveSession(race, now);
          if (session) {
            setState({ isLive: true, liveSession: session, year, round: race.round });
            return;
          }
        }
        setState({ isLive: false, liveSession: null, year: null, round: null });
      } catch {
        // Leave the previous state rather than claiming nothing is running.
      }
    };

    check();
    timer = setInterval(check, TICK_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return state;
};
