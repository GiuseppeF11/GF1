import { useState, useEffect } from 'react';
import { getSessions } from '../services/openf1';
import { getSeasonSchedule } from '../services/jolpica';
import { getRaceSessions } from './useSchedule';
import { isPast } from '../utils/time';

const CACHE_KEY = 'gf1_last_session_v1';

const loadCache = (year) => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return cached?.year === year ? cached.session : null;
  } catch {
    return null;
  }
};

const saveCache = (year, session) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ year, session }));
  } catch {}
};

const lastCompleted = (sessions) => {
  const done = sessions.filter(s => isPast(s.date_end));
  return done[done.length - 1] ?? null;
};

/**
 * The most recently finished session of the season.
 *
 * OpenF1 is preferred because it carries real session keys and end times, but it
 * answers 401 to unauthenticated clients while any session is live — so the Jolpica
 * calendar stands in, which is enough to identify the session and fetch its official
 * classification. Cached so a later visit shows something immediately.
 */
export const useCurrentSeason = (year = new Date().getFullYear()) => {
  const [lastSession, setLastSession] = useState(() => loadCache(year));
  const [loading, setLoading] = useState(() => loadCache(year) === null);

  useEffect(() => {
    let cancelled = false;
    if (loadCache(year) === null) setLoading(true);

    const fromTiming = () =>
      getSessions({ year }).then(sessions => lastCompleted(sessions ?? []));

    const fromSchedule = () =>
      getSeasonSchedule(year).then(races =>
        lastCompleted(races.flatMap(getRaceSessions))
      );

    fromTiming()
      .catch(() => null)
      .then(session => session ?? fromSchedule())
      .then(session => {
        if (cancelled || !session) return;
        setLastSession(session);
        saveCache(year, session);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [year]);

  return { lastSession, loading };
};
