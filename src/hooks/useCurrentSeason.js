import { useState, useEffect } from 'react';
import { getSessions } from '../services/openf1';
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

// Fetches all sessions for the year in one call (no getMeetings needed).
// Shows cached data immediately on subsequent loads — survives OpenF1 429s.
export const useCurrentSeason = (year = new Date().getFullYear()) => {
  const [lastSession, setLastSession] = useState(() => loadCache(year));
  const [loading, setLoading] = useState(() => loadCache(year) === null);

  useEffect(() => {
    let cancelled = false;
    if (loadCache(year) === null) setLoading(true);

    getSessions({ year })
      .then(sessions => {
        if (cancelled) return;
        const completed = sessions.filter(s => isPast(s.date_end));
        const session = completed[completed.length - 1] ?? null;
        setLastSession(session);
        if (session) saveCache(year, session);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [year]);

  return { lastSession, loading };
};
