import axios from 'axios';

const BASE = 'https://api.openf1.org/v1';

const get = (path, params = {}) =>
  axios.get(`${BASE}${path}`, { params }).then(r => r.data);

export const getMeetings = (year = 2025) =>
  get('/meetings', { year });

export const getSessions = (params) =>
  get('/sessions', params);

export const getDrivers = (session_key) =>
  get('/drivers', { session_key });

export const getPositions = (session_key) =>
  get('/position', { session_key });

export const getIntervals = (session_key) =>
  get('/intervals', { session_key });

export const getStints = (session_key) =>
  get('/stints', { session_key });

export const getPitStops = (session_key) =>
  get('/pit', { session_key });

export const getLatestDrivers = async () => {
  const year = new Date().getFullYear();
  const sessions = await get('/sessions', { year, session_name: 'Race' });
  const completed = sessions
    .filter(s => s.date_end && new Date(s.date_end) < new Date())
    .sort((a, b) => new Date(b.date_end) - new Date(a.date_end));
  const key = completed.length > 0 ? completed[0].session_key : 'latest';
  return get('/drivers', { session_key: key });
};

/** Returns final positions for a session (last recorded position per driver) */
export const getFinalPositions = async (session_key) => {
  const positions = await getPositions(session_key);
  const map = new Map();
  for (const p of positions) {
    map.set(p.driver_number, p);
  }
  return Array.from(map.values()).sort((a, b) => a.position - b.position);
};
