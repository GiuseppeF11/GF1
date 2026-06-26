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
  const getRaceDate = (r) => new Date(`${r.date}T${r.time || '00:00:00Z'}`);

  const nextRace = races.find(r => getRaceDate(r) > now);
  const pastRaces = races.filter(r => getRaceDate(r) <= now);
  const lastRace = pastRaces[pastRaces.length - 1] ?? null;
  const upcomingRaces = races.filter(r => getRaceDate(r) > now);

  return { races, nextRace, lastRace, upcomingRaces, loading };
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
