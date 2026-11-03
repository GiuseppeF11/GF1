import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentSeason } from '../../hooks/useCurrentSeason';
import { useDriverStandings, useConstructorStandings } from '../../hooks/useStandings';
import { useSessionResults } from '../../hooks/useSessionResults';
import { useSeason } from '../../contexts/SeasonContext';
import { useSchedule, findRoundByDate } from '../../hooks/useSchedule';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useDriverPhotos } from '../../hooks/useDriverPhotos';
import { getSeasonWinners } from '../../services/jolpica';
import GPCarousel from '../../components/ui/GPCarousel';
import ResultsTable from '../../components/ui/ResultsTable';
import ProvisionalBadge from '../../components/ui/ProvisionalBadge';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { getFlagUrl } from '../../utils/flags';
import { getTeamColor, posColor } from '../../utils/teamColors';

const PREVIEW = 5;
const shortTeam = (name = '') => name.replace('F1 Team', '').replace(' F1', '').trim();

/* ─── Hero: season ended ──────────────────────────────────────── */
const SeasonEndHero = ({ lastRace, season }) => {
  const { standings } = useDriverStandings(season);
  const champion = standings[0];
  const d = champion?.Driver;
  const teamId = champion?.Constructors?.[0]?.constructorId ?? '';
  const teamColor = getTeamColor(teamId);
  const flagUrl = lastRace ? getFlagUrl(lastRace.Circuit.Location.country) : null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border"
      style={{ borderColor: teamColor + '60', boxShadow: `0 0 40px ${teamColor}15` }}
    >
      <div className="h-1" style={{ backgroundColor: teamColor }} />
      {flagUrl && (
        <>
          <div className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl opacity-20" style={{ backgroundImage: `url(${flagUrl})` }} />
          <div className="absolute inset-0 bg-f1-dark/80" />
        </>
      )}
      <div className="relative z-10 p-5 sm:p-8">
        <p className="mb-4 text-[10px] uppercase tracking-widest text-white/30">Stagione {season} · Conclusa</p>
        {champion ? (
          <div>
            <p className="mb-1 text-xs text-f1-muted">Campione del Mondo</p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {d?.givenName} <span style={{ color: teamColor }}>{d?.familyName}</span>
            </h2>
            <p className="mt-1 text-sm text-white/40">
              {shortTeam(champion.Constructors?.[0]?.name)} ·{' '}
              <span className="font-bold" style={{ color: teamColor }}>{champion.points} pt</span>
            </p>
          </div>
        ) : (
          <p className="text-white/40">Dati stagione non disponibili</p>
        )}
        <Link
          to="/results/drivers"
          className="mt-4 inline-flex items-center gap-1 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:text-white"
          style={{ borderColor: teamColor + '50', color: teamColor }}
        >
          Classifica finale →
        </Link>
      </div>
    </div>
  );
};

/* ─── Standings ───────────────────────────────────────────────── */
const StandingsPanel = ({ title, linkTo, loading, rows, renderRow, columns, avatars }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, PREVIEW);

  return (
    <div className="overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
      <div className="flex items-center justify-between border-b border-f1-border px-4 py-2.5">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <Link to={linkTo} className="text-xs font-medium text-f1-red hover:underline">
          Vedi tutto →
        </Link>
      </div>

      {loading ? (
        <SkeletonRows rows={PREVIEW} showAvatar={avatars} />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-f1-muted">Nessun dato disponibile</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1-border text-[10px] uppercase tracking-wider text-f1-muted">
                <th className="w-8 px-3 py-2 text-left">P</th>
                <th className="px-3 py-2 text-left">{columns}</th>
                <th className="px-3 py-2 text-right">Pt</th>
              </tr>
            </thead>
            <tbody>{visible.map(renderRow)}</tbody>
          </table>
          {rows.length > PREVIEW && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full border-t border-f1-border/30 py-2.5 text-xs font-semibold text-f1-red transition-colors hover:text-white"
            >
              {expanded ? 'Mostra meno ↑' : 'Mostra tutti →'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

const StandingsSection = ({ season }) => {
  const { standings: drivers, loading: dLoad } = useDriverStandings(season);
  const { standings: constructors, loading: cLoad } = useConstructorStandings(season);
  const photoMap = useDriverPhotos();
  const [tab, setTab] = useState('pilots');

  const driverRow = (entry) => {
    const d = entry.Driver;
    const teamColor = getTeamColor(entry.Constructors?.[0]?.constructorId ?? '');
    const photo = photoMap.get(d.code);
    return (
      <tr key={d.driverId} className="border-b border-f1-border/30 transition-colors hover:bg-f1-border/20">
        <td className={`px-3 py-2 text-sm font-black tabular-nums ${posColor(entry.position)}`}>
          {entry.position}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-0.5 flex-shrink-0 rounded-full" style={{ backgroundColor: teamColor }} />
            {photo?.headshot_url ? (
              <img
                src={photo.headshot_url}
                alt={d.familyName}
                className="h-8 w-8 flex-shrink-0 rounded-full bg-f1-border object-cover object-top"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: teamColor + '40' }}
              >
                {d.code?.slice(0, 3)}
              </div>
            )}
            <div className="min-w-0">
              <Link
                to={`/driver/${d.driverId}`}
                className="block truncate text-xs font-semibold leading-tight text-white transition-colors hover:text-f1-red"
              >
                {d.givenName} {d.familyName}
              </Link>
              <span className="text-[10px] text-f1-muted">
                {shortTeam(entry.Constructors?.[0]?.name)}
              </span>
            </div>
          </div>
        </td>
        <td className="px-3 py-2 text-right text-sm font-bold text-white tabular-nums">{entry.points}</td>
      </tr>
    );
  };

  const constructorRow = (entry) => {
    const c = entry.Constructor;
    const teamColor = getTeamColor(c.constructorId);
    return (
      <tr key={c.constructorId} className="border-b border-f1-border/30 transition-colors hover:bg-f1-border/20">
        <td className={`px-3 py-2 text-sm font-black tabular-nums ${posColor(entry.position)}`}>
          {entry.position}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-0.5 flex-shrink-0 rounded-full" style={{ backgroundColor: teamColor }} />
            <span className="truncate text-xs font-semibold text-white">{shortTeam(c.name)}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-right text-sm font-bold text-white tabular-nums">{entry.points}</td>
      </tr>
    );
  };

  const pilotsPanel = (
    <StandingsPanel
      title="Piloti"
      linkTo="/results/drivers"
      loading={dLoad}
      rows={drivers}
      renderRow={driverRow}
      columns="Pilota"
      avatars
    />
  );

  const teamsPanel = (
    <StandingsPanel
      title="Scuderie"
      linkTo="/results/teams"
      loading={cLoad}
      rows={constructors}
      renderRow={constructorRow}
      columns="Scuderia"
    />
  );

  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-white">Classifiche {season}</h2>

      {/* Desktop: both tables side by side, using the width freed by the carousel */}
      <div className="hidden gap-4 md:grid md:grid-cols-2">
        {pilotsPanel}
        {teamsPanel}
      </div>

      {/* Mobile: one at a time */}
      <div className="md:hidden">
        <div className="mb-3 flex w-fit gap-1 rounded-xl bg-f1-surface p-1">
          {[{ key: 'pilots', label: 'Piloti' }, { key: 'teams', label: 'Scuderie' }].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key ? 'bg-f1-red text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'pilots' ? pilotsPanel : teamsPanel}
      </div>
    </section>
  );
};

/* ─── Last session ────────────────────────────────────────────── */
const LastSessionWidget = ({ session, season, races }) => {
  // OpenF1 sessions carry no round — resolve it from the session date, falling back
  // to the country name only when the schedule has not loaded yet.
  const round = findRoundByDate(races, session?.date_start);
  const { results, provisional, loading } = useSessionResults({
    sessionKey: session?.session_key,
    sessionType: session?.session_name,
    round,
    meetingName: session?.country_name ?? session?.location ?? null,
    year: season,
    sessionEnd: session?.date_end ?? null,
  });

  if (!session) return null;

  const sessionLabel =
    session.session_name === 'Race' ? 'Gara' :
    session.session_name === 'Qualifying' ? 'Qualifiche' :
    session.session_name === 'Sprint' ? 'Sprint' :
    session.session_name;

  const meetingLabel = session.country_name
    ? `${session.country_name} GP`
    : (session.location ?? '');

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Ultima sessione</h2>
            {provisional && results.length > 0 && <ProvisionalBadge />}
          </div>
          <p className="text-xs text-f1-muted">{sessionLabel} · {meetingLabel}</p>
        </div>
        <Link to="/results/races" className="text-xs font-medium text-f1-red hover:underline">
          Risultati →
        </Link>
      </div>
      <div className="rounded-2xl border border-f1-border bg-f1-surface p-4">
        {loading ? (
          <SkeletonRows rows={5} />
        ) : results.length > 0 ? (
          <>
            <ResultsTable results={results.slice(0, 5)} sessionType={session.session_name} compact />
            {results.length > 5 && (
              <Link
                to="/results/races"
                className="mt-3 block text-center text-xs font-medium text-f1-red hover:underline"
              >
                Mostra tutti i {results.length} →
              </Link>
            )}
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-f1-muted">Classifica in elaborazione</p>
            <p className="mt-1 text-xs text-white/25">
              I dati compaiono appena vengono pubblicati, senza ricaricare
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

/* ─── Home page ───────────────────────────────────────────────── */
const Home = () => {
  const { season } = useSeason();
  const { races, nextRace, lastRace, loading: scheduleLoading } = useSchedule(season);
  const { lastSession, loading: sessionLoading } = useCurrentSeason(season);
  const { isLive, round: liveRound } = useLiveSession();
  // `loaded` keeps a card from claiming the winner is unavailable while still fetching.
  const [winners, setWinners] = useState({ map: new Map(), loaded: false });

  useEffect(() => {
    let cancelled = false;
    setWinners({ map: new Map(), loaded: false });
    getSeasonWinners(season)
      .then(map => { if (!cancelled) setWinners({ map, loaded: true }); })
      .catch(() => { if (!cancelled) setWinners({ map: new Map(), loaded: true }); });
    return () => { cancelled = true; };
  }, [season]);

  return (
    <div className="space-y-6 pb-4">
      {/* Waits for the schedule: an empty races list also yields no nextRace, which
          would briefly announce the champion on every mount of a running season. */}
      {!scheduleLoading && !nextRace && <SeasonEndHero lastRace={lastRace} season={season} />}

      <GPCarousel
        races={races}
        season={season}
        nextRace={nextRace}
        liveRound={isLive ? liveRound : null}
        winners={winners.map}
        winnersLoaded={winners.loaded}
      />

      {!sessionLoading && (
        <LastSessionWidget session={lastSession} season={season} races={races} />
      )}

      <StandingsSection season={season} />
    </div>
  );
};

export default Home;
