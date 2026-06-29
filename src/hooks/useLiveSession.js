import { useState, useEffect } from 'react';
import { getSessions } from '../services/openf1';
import { getSeasonSchedule } from '../services/jolpica';

const scheduleCache = {};
const getScheduleCached = (year) => {
  if (!scheduleCache[year]) scheduleCache[year] = getSeasonSchedule(year);
  return scheduleCache[year];
};

export const useLiveSession = () => {
  const [state, setState] = useState({ isLive: false, liveSession: null, year: null, round: null });

  const check = async () => {
    const year = new Date().getFullYear();
    const now = new Date();

    try {
      const schedule = await getScheduleCached(year);

      // Pre-check: only call OpenF1 if we're within a race weekend
      const currentRace = schedule.find(r => {
        const fp1 = r.FirstPractice;
        const weekendStart = fp1
          ? new Date(`${fp1.date}T${fp1.time}`)
          : new Date(`${r.date}T${r.time || '00:00:00Z'}`);
        const raceEnd = new Date(`${r.date}T${r.time || '00:00:00Z'}`);
        raceEnd.setHours(raceEnd.getHours() + 4); // 4h buffer post-race
        return weekendStart <= now && now <= raceEnd;
      });

      if (!currentRace) {
        setState({ isLive: false, liveSession: null, year: null, round: null });
        return;
      }

      const sessions = await getSessions({ year });
      const active = sessions.find(s => {
        const start = new Date(s.date_start);
        const end = new Date(s.date_end);
        return start <= now && now <= end;
      });

      setState({
        isLive: !!active,
        liveSession: active ?? null,
        year: active ? year : null,
        round: active ? currentRace.round : null,
      });
    } catch {
      // silent fail — don't show stale live state
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  return state;
};
