import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../../contexts/SeasonContext';
import { useSchedule } from '../../hooks/useSchedule';
import { getFlagUrl } from '../../utils/flags';
import { toItalianDate, toItalianTime, isPast } from '../../utils/time';
import { SkeletonRows } from '../../components/ui/Skeleton';

const raceUtcOf = (race) => `${race.date}T${race.time || '00:00:00Z'}`;

/** First session of the weekend, so the card can show the full span. */
const weekendStartOf = (race) => {
  const first = race.FirstPractice ?? race.SprintQualifying ?? race.Qualifying;
  return first ? `${first.date}T${first.time}` : raceUtcOf(race);
};

/** Groups races into [{ key, label, races }] in calendar order. */
const groupByMonth = (races) => {
  const groups = [];
  for (const race of races) {
    const key = race.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.races.push(race);
    } else {
      groups.push({
        key,
        label: toItalianDate(raceUtcOf(race), 'MMMM'),
        races: [race],
      });
    }
  }
  return groups;
};

const RaceRow = ({ race, season, isNext, rowRef }) => {
  const flagUrl = getFlagUrl(race.Circuit.Location.country);
  const raceUtc = raceUtcOf(race);
  const past = isPast(raceUtc);
  const startUtc = weekendStartOf(race);
  const sameDay = startUtc.slice(0, 10) === race.date;

  return (
    <Link
      ref={rowRef}
      to={`/gp/${season}/${race.round}`}
      className={`group relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-f1-border/20 ${
        isNext ? 'bg-f1-red/[0.07]' : past ? 'opacity-55 hover:opacity-90' : ''
      }`}
    >
      {isNext && <span className="absolute inset-y-0 left-0 w-0.5 bg-f1-red" />}

      <span className="w-6 flex-shrink-0 text-right font-mono text-xs tabular-nums text-f1-muted">
        {race.round}
      </span>

      <img
        src={flagUrl}
        alt={race.Circuit.Location.country}
        className="h-5 w-8 flex-shrink-0 rounded-sm object-cover shadow-sm"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm font-semibold leading-tight transition-colors group-hover:text-f1-red ${
            past ? 'text-white/60' : 'text-white'
          }`}>
            {race.raceName.replace(' Grand Prix', ' GP')}
          </p>
          {isNext && (
            <span className="flex-shrink-0 rounded-full bg-f1-red px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Next
            </span>
          )}
          {race.Sprint && (
            <span className="flex-shrink-0 rounded border border-white/15 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-white/40">
              Sprint
            </span>
          )}
        </div>
        <p className="truncate text-[11px] text-f1-muted">
          {race.Circuit.circuitName} · {race.Circuit.Location.locality}
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className={`text-xs font-medium tabular-nums ${past ? 'text-white/30' : 'text-white/70'}`}>
          {sameDay
            ? toItalianDate(raceUtc, 'd MMM')
            : `${toItalianDate(startUtc, 'd')}–${toItalianDate(raceUtc, 'd MMM')}`}
        </p>
        <p className={`text-[10px] ${past ? 'text-white/20' : 'text-f1-muted'}`}>
          {past ? 'Terminato' : `Gara ${toItalianTime(raceUtc)}`}
        </p>
      </div>
    </Link>
  );
};

const Schedule = () => {
  const { season } = useSeason();
  const { races, nextRace, loading } = useSchedule(season);
  const nextRef = useRef(null);

  useEffect(() => {
    if (nextRef.current) {
      nextRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [nextRace?.round]);

  if (loading) {
    return (
      <div className="space-y-4 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-white">Calendario {season}</h1>
        <div className="overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
          <SkeletonRows rows={12} showAvatar={false} />
        </div>
      </div>
    );
  }

  const months = groupByMonth(races);
  const completed = races.filter(r => isPast(raceUtcOf(r))).length;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight text-white">Calendario {season}</h1>
        {races.length > 0 && (
          <p className="flex-shrink-0 text-xs text-f1-muted tabular-nums">
            {completed}/{races.length} disputati
          </p>
        )}
      </div>

      {races.length === 0 ? (
        <div className="rounded-2xl border border-f1-border bg-f1-surface py-12 text-center">
          <p className="text-sm text-f1-muted">Nessun dato disponibile per il {season}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {months.map(({ key, label, races: monthRaces }) => (
            <section key={key}>
              <h2 className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-f1-muted">
                {label}
              </h2>
              <div className="divide-y divide-f1-border/30 overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
                {monthRaces.map(race => {
                  const isNext = nextRace?.round === race.round;
                  return (
                    <RaceRow
                      key={race.round}
                      race={race}
                      season={season}
                      isNext={isNext}
                      rowRef={isNext ? nextRef : null}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedule;
