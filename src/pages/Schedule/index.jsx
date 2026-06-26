import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../../contexts/SeasonContext';
import { useSchedule } from '../../hooks/useSchedule';
import { getFlagUrl } from '../../utils/flags';
import { toItalianDate, toItalianTime, isPast } from '../../utils/time';
import Loader from '../../components/ui/Loader';

const Schedule = () => {
  const { season } = useSeason();
  const { races, nextRace, loading } = useSchedule(season);
  const nextRef = useRef(null);

  useEffect(() => {
    if (nextRef.current) {
      nextRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [nextRace?.round]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-white font-black text-2xl tracking-tight">Calendario {season}</h1>

      <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
        {races.length === 0 ? (
          <p className="text-f1-muted text-sm text-center py-12">
            Nessun dato disponibile per il {season}
          </p>
        ) : (
          races.map(race => {
            const isNext = nextRace?.round === race.round;
            const flagUrl = getFlagUrl(race.Circuit.Location.country);
            const raceUtc = `${race.date}T${race.time || '00:00:00Z'}`;
            const past = isPast(raceUtc);

            return (
              <div
                key={race.round}
                ref={isNext ? nextRef : null}
                className={isNext ? 'border-l-2 border-l-f1-red' : ''}
              >
                <Link
                  to={`/gp/${season}/${race.round}`}
                  className={`flex items-center gap-3 px-4 py-3.5 border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors group ${
                    isNext ? 'bg-f1-red/5' : past ? 'opacity-50 hover:opacity-80' : ''
                  }`}
                >
                  {/* Round number */}
                  <span className="text-f1-muted text-xs font-mono w-5 text-right flex-shrink-0 tabular-nums">
                    {race.round}
                  </span>

                  {/* Flag */}
                  <img
                    src={flagUrl}
                    alt={race.Circuit.Location.country}
                    className="w-8 h-5 object-cover rounded-sm flex-shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold leading-tight truncate transition-colors group-hover:text-f1-red ${
                        past ? 'text-white/60' : 'text-white'
                      }`}>
                        {race.raceName.replace(' Grand Prix', ' GP')}
                      </p>
                      {isNext && (
                        <span className="bg-f1-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                          Next
                        </span>
                      )}
                    </div>
                    <p className="text-f1-muted text-[11px]">{race.Circuit.Location.locality}</p>
                  </div>

                  {/* Date */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-medium tabular-nums ${past ? 'text-white/30' : 'text-white/70'}`}>
                      {toItalianDate(raceUtc, 'd MMM')}
                    </p>
                    {!past ? (
                      <p className="text-f1-muted text-[10px]">{toItalianTime(raceUtc)}</p>
                    ) : (
                      <p className="text-white/20 text-[10px]">Terminato</p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Schedule;
