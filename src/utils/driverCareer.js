const shortTeam = (name = '') => name.replace('F1 Team', '').replace(' F1', '').trim();

/** True when a result is a retirement rather than a classified finish. */
export const isRetirement = (result) =>
  !!result?.status && result.status !== 'Finished' && !result.status.startsWith('+');

/**
 * Folds a driver's career race entries into per-season rows and overall totals.
 * Everything here comes from the single results feed, so no extra requests are
 * needed to describe a season the driver raced decades ago.
 */
export const summariseCareer = (races) => {
  const bySeason = new Map();
  const totals = { races: 0, wins: 0, podiums: 0, poles: 0, points: 0 };

  for (const race of races) {
    const r = race.Results?.[0];
    if (!r) continue;

    const season = Number(race.season);
    let row = bySeason.get(season);
    if (!row) {
      row = { season, teams: [], races: 0, wins: 0, podiums: 0, poles: 0, points: 0 };
      bySeason.set(season, row);
    }

    const team = shortTeam(r.Constructor?.name);
    if (team && !row.teams.includes(team)) row.teams.push(team);

    const position = parseInt(r.position ?? '99');
    const points = parseFloat(r.points ?? 0);

    row.races += 1;
    totals.races += 1;
    if (position === 1) { row.wins += 1; totals.wins += 1; }
    if (position <= 3) { row.podiums += 1; totals.podiums += 1; }
    // Poles are counted as starts from the front row slot, not from the qualifying
    // feed: Ergast only has qualifying from 1994, so asking it would report zero
    // poles for every driver of the first forty years of the championship.
    if (r.grid === '1') { row.poles += 1; totals.poles += 1; }
    row.points += points;
    totals.points += points;
  }

  const seasons = [...bySeason.values()].sort((a, b) => b.season - a.season);
  for (const s of seasons) s.points = Math.round(s.points * 100) / 100;
  totals.points = Math.round(totals.points * 100) / 100;

  return { seasons, totals };
};

/** Race entries for one season, in calendar order. */
export const racesInSeason = (races, season) =>
  races
    .filter(r => Number(r.season) === Number(season))
    .sort((a, b) => Number(a.round) - Number(b.round));
