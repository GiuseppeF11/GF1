import axios from 'axios';

const BASE = 'https://api.jolpi.ca/ergast/f1';
const CURRENT_YEAR = new Date().getFullYear();

const get = (path) =>
  axios.get(`${BASE}${path}`).then(r => r.data);

export const getDriverStandings = (year = CURRENT_YEAR) =>
  get(`/${year}/driverStandings.json`).then(
    d => d.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []
  );

export const getConstructorStandings = (year = CURRENT_YEAR) =>
  get(`/${year}/constructorStandings.json`).then(
    d => d.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []
  );

export const getRaceResults = (year = CURRENT_YEAR, round) =>
  get(`/${year}/${round}/results.json`).then(
    d => d.MRData.RaceTable.Races[0] ?? null
  );

export const getAllRaceResults = (year = CURRENT_YEAR) =>
  get(`/${year}/results.json?limit=600`).then(
    d => d.MRData.RaceTable.Races ?? []
  );

export const getSeasonSchedule = (year = CURRENT_YEAR) =>
  get(`/${year}.json`).then(
    d => d.MRData.RaceTable.Races ?? []
  );

export const getQualifyingResults = (year = CURRENT_YEAR, round) =>
  get(`/${year}/${round}/qualifying.json`).then(
    d => d.MRData.RaceTable.Races[0] ?? null
  );

export const getDriverInfo = (driverId) =>
  get(`/drivers/${driverId}.json`).then(
    d => d.MRData.DriverTable.Drivers[0] ?? null
  );

export const getDriverSeasonResults = (year = CURRENT_YEAR, driverId) =>
  get(`/${year}/drivers/${driverId}/results.json?limit=30`).then(
    d => d.MRData.RaceTable.Races ?? []
  );

const getWithRetry = (path, retries = 2, delayMs = 600) =>
  get(path).catch(async (err) => {
    if (retries > 0 && err?.response?.status === 429) {
      await new Promise(res => setTimeout(res, delayMs));
      return getWithRetry(path, retries - 1, delayMs * 2);
    }
    throw err;
  });

export const getDriverCareerStats = async (driverId) => {
  // Hybrid era 2014-2025 covers all currently active drivers' championship years
  const years = Array.from({ length: 12 }, (_, i) => 2014 + i);
  const lists = await Promise.all(
    years.map(y =>
      getWithRetry(`/${y}/drivers/${driverId}/driverStandings.json`)
        .then(d => d.MRData.StandingsTable.StandingsLists?.[0] ?? null)
        .catch(() => null)
    )
  );
  return lists.filter(Boolean);
};

export const getConstructorSeasonResults = (year = CURRENT_YEAR, constructorId) =>
  get(`/${year}/constructors/${constructorId}/results.json?limit=500`).then(
    d => d.MRData.RaceTable.Races ?? []
  );
