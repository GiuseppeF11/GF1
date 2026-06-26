import { useState, useEffect } from 'react';
import { getMeetings, getSessions } from '../services/openf1';
import { isPast, isFuture } from '../utils/time';

export const useCurrentSeason = (year = new Date().getFullYear()) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setMeetings([]);
    setLoading(true);
    setError(null);
    getMeetings(year)
      .then(data => { if (!cancelled) setMeetings(data); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  const nextMeeting = meetings.find(m => isFuture(m.date_end));
  const pastMeetings = meetings.filter(m => isPast(m.date_end));
  const lastMeeting = pastMeetings[pastMeetings.length - 1] ?? null;

  return { meetings, nextMeeting, lastMeeting, loading, error };
};

export const useMeetingSessions = (meetingKey) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meetingKey) return;
    setLoading(true);
    getSessions({ meeting_key: meetingKey })
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [meetingKey]);

  const completedSessions = sessions.filter(s => isPast(s.date_end));
  const lastSession = completedSessions[completedSessions.length - 1] ?? null;

  return { sessions, completedSessions, lastSession, loading };
};
