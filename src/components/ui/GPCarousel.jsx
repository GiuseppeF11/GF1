import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { getFlagUrl } from '../../utils/flags';
import { getTeamColor } from '../../utils/teamColors';
import { toItalianDate, toItalianTime, isPast } from '../../utils/time';

const raceUtcOf = (race) => `${race.date}T${race.time || '00:00:00Z'}`;

const weekendStartOf = (race) => {
  const first = race.FirstPractice ?? race.SprintQualifying ?? race.Qualifying;
  return first ? `${first.date}T${first.time}` : raceUtcOf(race);
};

const sessionsOf = (race) => [
  race.FirstPractice && { label: 'P1', utc: `${race.FirstPractice.date}T${race.FirstPractice.time}` },
  race.SecondPractice && { label: 'P2', utc: `${race.SecondPractice.date}T${race.SecondPractice.time}` },
  race.ThirdPractice && { label: 'P3', utc: `${race.ThirdPractice.date}T${race.ThirdPractice.time}` },
  race.SprintQualifying && { label: 'SQ', utc: `${race.SprintQualifying.date}T${race.SprintQualifying.time}` },
  race.Sprint && { label: 'Sprint', utc: `${race.Sprint.date}T${race.Sprint.time}` },
  race.Qualifying && { label: 'Q', utc: `${race.Qualifying.date}T${race.Qualifying.time}` },
  { label: 'Gara', utc: raceUtcOf(race) },
].filter(Boolean);

/** past | live | next | future — drives what the card shows in its body slot. */
const stateOf = (race, isNext, liveRound) => {
  if (String(liveRound) === String(race.round)) return 'live';
  if (isNext) return 'next';
  return isPast(raceUtcOf(race)) ? 'past' : 'future';
};

const STATE_BADGE = {
  live: { label: 'In corso', className: 'bg-f1-red text-white' },
  next: { label: 'Prossimo GP', className: 'bg-f1-red text-white' },
  past: { label: 'Disputato', className: 'bg-white/10 text-white/50' },
  future: { label: 'In programma', className: 'bg-white/5 text-white/35' },
};

const GPCard = ({ race, season, state, winner, winnersLoaded, cardRef }) => {
  const raceUtc = raceUtcOf(race);
  const flagUrl = getFlagUrl(race.Circuit.Location.country);
  const startUtc = weekendStartOf(race);
  const accent = state === 'past' || state === 'future' ? null : '#E10600';
  const badge = STATE_BADGE[state];

  // Card width stays under 100% so neighbouring cards peek on both sides — that edge
  // is the only cue that the strip also scrolls back into past races.
  return (
    <Link
      ref={cardRef}
      to={`/gp/${season}/${race.round}`}
      className={`group relative flex w-[78%] flex-shrink-0 snap-center flex-col overflow-hidden rounded-3xl border transition-colors sm:w-[46%] lg:w-[31.5%] ${
        accent
          ? 'border-f1-red/30 hover:border-f1-red/60'
          : 'border-f1-border hover:border-white/25'
      }`}
    >
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl opacity-25"
        style={{ backgroundImage: `url(${flagUrl})` }}
      />
      <div className={`absolute inset-0 ${state === 'past' ? 'bg-f1-dark/90' : 'bg-f1-dark/80'}`} />
      <div className={`relative z-10 h-1 ${accent ? 'bg-f1-red' : 'bg-f1-border'}`} />

      <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${badge.className}`}>
            {badge.label}
          </span>
          <span className="text-[11px] text-white/30 tabular-nums">Round {race.round}</span>
        </div>

        <div className="mb-1 flex items-center gap-2.5">
          <img
            src={flagUrl}
            alt={race.Circuit.Location.country}
            className="h-6 w-9 flex-shrink-0 rounded object-cover shadow"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          <h3 className={`truncate text-lg font-black leading-tight tracking-tight sm:text-xl ${
            state === 'past' ? 'text-white/75' : 'text-white'
          }`}>
            {race.raceName.replace(' Grand Prix', '')}
            <span className={accent ? 'text-f1-red' : 'text-white/30'}> GP</span>
          </h3>
        </div>
        <p className="truncate text-[11px] text-white/40">{race.Circuit.Location.locality}</p>

        {/* Body slot — same space in every state */}
        <div className="mt-4 flex min-h-[86px] flex-1 flex-col justify-end">
          {state === 'past' ? (
            winner ? (
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-0.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: getTeamColor(winner.constructorId) }}
                />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest text-white/30">Vincitore</p>
                  <p className="truncate text-sm font-bold text-white">
                    {winner.givenName} {winner.familyName}
                  </p>
                  <p className="truncate text-[11px] text-white/40">
                    {winner.constructorName.replace('F1 Team', '').trim()}
                  </p>
                </div>
              </div>
            ) : winnersLoaded ? (
              <p className="text-xs text-white/25">Vincitore non disponibile</p>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-0.5 flex-shrink-0 rounded-full bg-white/10" />
                <div className="space-y-1.5">
                  <div className="h-2 w-12 rounded bg-white/[0.07]" />
                  <div className="h-3 w-28 rounded bg-white/10" />
                  <div className="h-2 w-16 rounded bg-white/[0.07]" />
                </div>
              </div>
            )
          ) : state === 'future' ? (
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/30">Weekend</p>
              <p className="text-sm font-bold text-white">
                {toItalianDate(startUtc, 'd')}–{toItalianDate(raceUtc, 'd MMM')}
              </p>
              <p className="text-[11px] text-white/40">Gara ore {toItalianTime(raceUtc)}</p>
            </div>
          ) : (
            <div>
              <p className="mb-1 text-[9px] uppercase tracking-widest text-white/30">
                {state === 'live' ? 'Weekend in corso' : 'Manca'}
              </p>
              {state === 'next' && <CountdownTimer targetUtc={raceUtc} compact />}
              <div className="mt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
                {sessionsOf(race).map(s => (
                  <div
                    key={s.label}
                    className={`flex-shrink-0 rounded-lg border px-2 py-1 text-center ${
                      isPast(s.utc)
                        ? 'border-f1-red/30 bg-f1-red/5'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className={`text-[9px] font-bold uppercase ${
                      isPast(s.utc) ? 'text-f1-red' : 'text-white/40'
                    }`}>
                      {s.label}
                    </div>
                    <div className="text-[10px] font-semibold text-white/70 tabular-nums">
                      {toItalianTime(s.utc, 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className={`mt-3 border-t pt-2.5 text-[11px] ${
          accent ? 'border-f1-red/15 text-white/60' : 'border-white/[0.07] text-white/35'
        }`}>
          {toItalianDate(raceUtc, 'EEE d MMMM')}
        </p>
      </div>
    </Link>
  );
};

const ArrowButton = ({ dir, onClick }) => (
  <button
    onClick={onClick}
    aria-label={dir === 'left' ? 'Gare precedenti' : 'Gare successive'}
    className="hidden h-8 w-8 items-center justify-center rounded-full border border-f1-border bg-f1-surface text-white/50 transition-colors hover:border-f1-red/40 hover:text-white sm:flex"
  >
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  </button>
);

/**
 * Season calendar as a horizontal strip centred on the current or next GP.
 * Scrolling left walks back through finished races, right through upcoming ones.
 */
const GPCarousel = ({ races, season, nextRace, liveRound, winners, winnersLoaded }) => {
  const trackRef = useRef(null);
  const activeRef = useRef(null);

  // Jump to the focal card without animating on first paint, so the strip opens
  // already centred rather than visibly scrolling there.
  useEffect(() => {
    const track = trackRef.current;
    const card = activeRef.current;
    if (!track || !card) return;
    track.scrollLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
  }, [nextRace?.round, races.length]);

  if (races.length === 0) return null;

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    const card = activeRef.current;
    if (!track) return;
    const step = (card?.clientWidth ?? track.clientWidth * 0.5) + 16;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Stagione {season}</h2>
        <div className="flex items-center gap-2">
          <Link to="/schedule" className="text-xs font-medium text-f1-red hover:underline">
            Calendario →
          </Link>
          <ArrowButton dir="left" onClick={() => scrollByCard(-1)} />
          <ArrowButton dir="right" onClick={() => scrollByCard(1)} />
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
      >
        {races.map(race => {
          const isNext = nextRace?.round === race.round;
          const state = stateOf(race, isNext, liveRound);
          const isFocal = state === 'live' || state === 'next';
          return (
            <GPCard
              key={race.round}
              race={race}
              season={season}
              state={state}
              winner={winners.get(String(race.round))}
              winnersLoaded={winnersLoaded}
              cardRef={isFocal ? activeRef : null}
            />
          );
        })}
      </div>
    </section>
  );
};

export default GPCarousel;
