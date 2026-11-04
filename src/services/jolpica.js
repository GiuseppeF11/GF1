import axios from 'axios';

const BASE = 'https://api.jolpi.ca/ergast/f1';
const CURRENT_YEAR = new Date().getFullYear();

// Jolpica throttles anonymous clients at roughly 4 requests/second. A driver page alone
// fans out to 20+ calls, so without pacing they burst straight into 429s — and because
// callers degrade a failed request to 0, that surfaced as wrong career stats rather than
// as an error. Every request goes through this queue instead.
const RATE_MS = 260;
const MAX_CONCURRENT = 2;
const MAX_RETRIES = 3;

let active = 0;
let nextSlot = 0;
const queue = [];

const pump = () => {
  if (queue.length === 0 || active >= MAX_CONCURRENT) return;
  const now = Date.now();
  const startAt = Math.max(now, nextSlot);
  nextSlot = startAt + RATE_MS;

  const job = queue.shift();
  active++;
  setTimeout(() => {
    job.run()
      .then(job.resolve, job.reject)
      .finally(() => { active--; pump(); });
  }, startAt - now);

  pump();
};

const enqueue = (run) =>
  new Promise((resolve, reject) => {
    queue.push({ run, resolve, reject });
    pump();
  });

// A 429 from Jolpica arrives without CORS headers, so the browser reports it as a
// network failure with no status — both cases are retried.
const isRetryable = (err) => {
  const status = err?.response?.status;
  return status === 429 || status === 503 || status == null;
};

const request = (path, attempt = 0) =>
  enqueue(() => axios.get(`${BASE}${path}`).then(r => r.data)).catch(err => {
    if (attempt < MAX_RETRIES && isRetryable(err)) {
      const backoff = 700 * 2 ** attempt + Math.random() * 300;
      return new Promise(r => setTimeout(r, backoff)).then(() => request(path, attempt + 1));
    }
    throw err;
  });

// Collapses duplicate concurrent requests for the same path — several hooks ask for
// the schedule and the same driver's data at once.
const inFlight = new Map();

const get = (path) => {
  const pending = inFlight.get(path);
  if (pending) return pending;
  const p = request(path).finally(() => inFlight.delete(path));
  inFlight.set(path, p);
  return p;
};

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

// Winner of every race in the season in a single request, keyed by round.
// Filtering to position 1 keeps this to ~24 rows instead of the full results set.
export const getSeasonWinners = (year = CURRENT_YEAR) =>
  get(`/${year}/results/1.json?limit=40`).then(d => {
    const map = new Map();
    for (const race of d.MRData.RaceTable.Races ?? []) {
      const r = race.Results?.[0];
      if (!r) continue;
      map.set(String(race.round), {
        code: r.Driver?.code ?? null,
        driverId: r.Driver?.driverId ?? null,
        givenName: r.Driver?.givenName ?? '',
        familyName: r.Driver?.familyName ?? '',
        constructorId: r.Constructor?.constructorId ?? '',
        constructorName: r.Constructor?.name ?? '',
      });
    }
    return map;
  });

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

export const getConstructorSeasonResults = (year = CURRENT_YEAR, constructorId) =>
  get(`/${year}/constructors/${constructorId}/results.json?limit=500`).then(
    d => d.MRData.RaceTable.Races ?? []
  );

// Every race a driver ever entered. Jolpica caps limit at 100, so a long career
// takes a few pages — but this one paginated call replaces the per-position count
// requests and the per-season results request, and it carries grid, status and
// constructor, which is everything the driver page needs apart from poles.
const RESULTS_PAGE = 100;
const MAX_RESULT_PAGES = 12;

export const getDriverCareerResults = async (driverId) => {
  const races = [];
  for (let page = 0; page < MAX_RESULT_PAGES; page++) {
    const d = await get(
      `/drivers/${driverId}/results.json?limit=${RESULTS_PAGE}&offset=${page * RESULTS_PAGE}`
    );
    const batch = d.MRData.RaceTable.Races ?? [];
    races.push(...batch);
    if (batch.length < RESULTS_PAGE) break;
  }
  return races;
};
