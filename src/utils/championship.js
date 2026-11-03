// 2026 scoring: 25 for a race win, 8 for a sprint win. The fastest-lap point was
// dropped after 2024, so a weekend is worth at most 25, or 33 with a sprint.
const POINTS_RACE_WIN = 25;
const POINTS_SPRINT_WIN = 8;

const raceUtcOf = (race) => `${race.date}T${race.time || '00:00:00Z'}`;

/**
 * Maximum points a driver could still score across the races not yet run.
 * A sprint already held earlier in a future race's weekend is still counted, which
 * only overestimates what is left — the title is never declared early as a result.
 */
export const maxPointsRemaining = (races, now = new Date()) =>
  races.reduce((total, race) => {
    if (new Date(raceUtcOf(race)) <= now) return total;
    return total + POINTS_RACE_WIN + (race.Sprint ? POINTS_SPRINT_WIN : 0);
  }, 0);

/**
 * The standings entry of the champion once the title is mathematically settled —
 * the leader's gap to second exceeds everything still on the table — otherwise null.
 * A decided title counts even with races left to run.
 */
export const clinchedChampion = (standings, races, now = new Date()) => {
  if (standings.length === 0 || races.length === 0) return null;

  const leader = standings[0];
  const runnerUp = standings[1];
  if (!runnerUp) return leader;

  const gap = parseFloat(leader.points ?? 0) - parseFloat(runnerUp.points ?? 0);
  return gap > maxPointsRemaining(races, now) ? leader : null;
};
