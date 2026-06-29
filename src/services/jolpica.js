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

// Career summary for a driver using position-filtered endpoints.
// Each call fetches limit=1 — we only need MRData.total, not the actual records.
// Titles are fetched separately via getDriverTitles (year-by-year, required by Jolpica).
export const getDriverCareerSummary = async (driverId) => {
  const total = (d) => parseInt(d.MRData?.total ?? '0');
  const [races, wins, p2, p3, poles] = await Promise.all([
    get(`/drivers/${driverId}/results.json?limit=1`).then(total).catch(() => 0),
    get(`/drivers/${driverId}/results/1.json?limit=1`).then(total).catch(() => 0),
    get(`/drivers/${driverId}/results/2.json?limit=1`).then(total).catch(() => 0),
    get(`/drivers/${driverId}/results/3.json?limit=1`).then(total).catch(() => 0),
    get(`/drivers/${driverId}/qualifying/1.json?limit=1`).then(total).catch(() => 0),
  ]);
  return { races, wins, podiums: wins + p2 + p3, poles };
};

// Titles: Jolpica requires season_year for driverStandings — check each year in parallel.
// Range 2000–(currentYear-1) covers all titles any active F1 driver could have won.
export const getDriverTitles = async (driverId) => {
  const lastYear = new Date().getFullYear() - 1;
  const years = Array.from({ length: lastYear - 1999 }, (_, i) => 2000 + i);
  const standings = await Promise.all(
    years.map(y =>
      get(`/${y}/drivers/${driverId}/driverStandings.json`)
        .then(d => d.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings?.[0]?.position ?? null)
        .catch(() => null)
    )
  );
  return standings.filter(pos => pos === '1').length;
};
