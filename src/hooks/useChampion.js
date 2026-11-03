import { useDriverStandings } from './useStandings';
import { useSchedule } from './useSchedule';
import { clinchedChampion } from '../utils/championship';

/**
 * driverId of the season's champion once the title is mathematically settled,
 * otherwise null. Returns a result while the season is still running, which is
 * what distinguishes it from simply reading the final standings.
 */
export const useClinchedChampion = (season) => {
  const { standings } = useDriverStandings(season);
  const { races } = useSchedule(season);

  return clinchedChampion(standings, races)?.Driver?.driverId ?? null;
};
