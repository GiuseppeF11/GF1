import { useState, useEffect } from 'react';
import { getSeasonSchedule } from '../services/jolpica';
import { getFlagUrl } from '../utils/flags';

export const useSchedule = (year = new Date().getFullYear()) => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setRaces([]);
    setLoading(true);
    getSeasonSchedule(year)
      .then(data => { if (!cancelled) setRaces(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const getRaceDate = (r) => new Date(`${r.date}T${r.time || '00:00:00Z'}`);

  // Show current GP for the whole race day; switch to next one the day after
  const nextRace = races.find(r => r.date >= todayStr);
  const pastRaces = races.filter(r => r.date < todayStr);
  const lastRace = pastRaces[pastRaces.length - 1] ?? null;
  const upcomingRaces = races.filter(r => getRaceDate(r) > now);

  return { races, nextRace, lastRace, upcomingRaces, loading };
};

/**
 * Resolve the Jolpica round whose race weekend contains the given UTC instant.
 * Matching on the date is unambiguous, unlike matching on country or race name —
 * Italy, the USA and others host more than one GP per season.
 */
export const findRoundByDate = (races, utcStr) => {
  if (!utcStr || races.length === 0) return null;
  const t = new Date(utcStr).getTime();
  if (Number.isNaN(t)) return null;

  const HOUR = 60 * 60 * 1000;
  const match = races.find(r => {
    const fp1 = r.FirstPractice;
    const start = fp1
      ? new Date(`${fp1.date}T${fp1.time}`).getTime()
      : new Date(`${r.date}T${r.time || '00:00:00Z'}`).getTime();
    const end = new Date(`${r.date}T${r.time || '00:00:00Z'}`).getTime() + 4 * HOUR;
    return t >= start - HOUR && t <= end;
  });

  return match?.round ? Number(match.round) : null;
};

/** Convert Jolpica race to pseudo-sessions for GPCard */
export const getRaceSessions = (race) => {
  if (!race) return [];
  const sessions = [];
  const push = (name, d) => d && sessions.push({
    session_key: name,
    session_name: name,
    date_start: `${d.date}T${d.time}`,
    date_end: `${d.date}T${d.time}`,
  });
  push('Practice 1', race.FirstPractice);
  push('Practice 2', race.SecondPractice);
  push('Practice 3', race.ThirdPractice);
  push('Sprint Qualifying', race.SprintQualifying);
  push('Sprint', race.Sprint);
  push('Qualifying', race.Qualifying);
  sessions.push({
    session_key: 'race',
    session_name: 'Race',
    date_start: `${race.date}T${race.time || '00:00:00Z'}`,
    date_end: `${race.date}T${race.time || '00:00:00Z'}`,
  });
  return sessions;
};

/** Normalize a Jolpica race to an OpenF1-compatible meeting shape for GPCard */
export const raceToMeeting = (race) => ({
  meeting_key: null,
  meeting_name: race.raceName,
  location: race.Circuit.Location.locality,
  country_name: race.Circuit.Location.country,
  country_flag: getFlagUrl(race.Circuit.Location.country),
  circuit_short_name: race.Circuit.circuitName,
  date_start: race.FirstPractice
    ? `${race.FirstPractice.date}T${race.FirstPractice.time}`
    : `${race.date}T${race.time || '00:00:00Z'}`,
  date_end: `${race.date}T${race.time || '00:00:00Z'}`,
  round: race.round,
});
