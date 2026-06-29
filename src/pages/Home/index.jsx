import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentSeason } from '../../hooks/useCurrentSeason';
import { useDriverStandings, useConstructorStandings } from '../../hooks/useStandings';
import { useSessionResults } from '../../hooks/useSessionResults';
import { useSeason } from '../../contexts/SeasonContext';
import { useSchedule } from '../../hooks/useSchedule';
import { useDriverPhotos } from '../../hooks/useDriverPhotos';
import CountdownTimer from '../../components/ui/CountdownTimer';
import ResultsTable from '../../components/ui/ResultsTable';
import Loader from '../../components/ui/Loader';
import { toItalianTime, toItalianDate, isPast } from '../../utils/time';
import { getFlagUrl } from '../../utils/flags';

const TEAM_COLORS = {
  'red_bull': '#3671C6', 'ferrari': '#E8002D', 'mercedes': '#27F4D2',
  'mclaren': '#FF8000', 'aston_martin': '#229971', 'alpine': '#FF87BC',
  'williams': '#64C4FF', 'haas': '#B6BABD', 'rb': '#6692FF',
  'kick_sauber': '#52E252', 'sauber': '#52E252',
};
const getTeamColor = (id) => TEAM_COLORS[id] ?? '#6b7280';

/* ─── Hero: Next GP ───────────────────────────────────────────── */
const NextGPHero = ({ race, season, totalRaces }) => {
  if (!race) return null;
  const raceUtc = `${race.date}T${race.time || '00:00:00Z'}`;
  const flagUrl = getFlagUrl(race.Circuit.Location.country);

  const sessions = [
    race.FirstPractice && { label: 'P1', utc: `${race.FirstPractice.date}T${race.FirstPractice.time}` },
    race.SecondPractice && { label: 'P2', utc: `${race.SecondPractice.date}T${race.SecondPractice.time}` },
    race.ThirdPractice && { label: 'P3', utc: `${race.ThirdPractice.date}T${race.ThirdPractice.time}` },
    race.SprintQualifying && { label: 'SQ', utc: `${race.SprintQualifying.date}T${race.SprintQualifying.time}` },
    race.Sprint && { label: 'Sprint', utc: `${race.Sprint.date}T${race.Sprint.time}` },
    race.Qualifying && { label: 'Q', utc: `${race.Qualifying.date}T${race.Qualifying.time}` },
    { label: 'Gara', utc: raceUtc },
  ].filter(Boolean);

  return (
    <Link to={`/gp/${season}/${race.round}`} className="block group">
      <div className="relative rounded-3xl overflow-hidden border border-f1-red/30 shadow-[0_0_60px_rgba(225,6,0,0.12)] group-hover:border-f1-red/60 transition-colors">
        {/* Blurred flag background */}
        <div
          className="absolute inset-0 scale-110 blur-2xl opacity-30 bg-cover bg-center"
          style={{ backgroundImage: `url(${flagUrl})` }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-f1-dark/75" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-f1-dark/60 to-transparent" />

        <div className="h-1 bg-f1-red relative z-10" />

        <div className="relative z-10 p-5 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="bg-f1-red text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Prossimo GP
            </span>
            <span className="text-white/30 text-xs">Round {race.round}{totalRaces ? ` di ${totalRaces}` : ''}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={flagUrl}
                  alt={race.Circuit.Location.country}
                  className="w-12 h-8 object-cover rounded-lg shadow-lg"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
                <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                  {race.raceName.replace(' Grand Prix', '')}
                  <span className="text-f1-red"> GP</span>
                </h1>
              </div>
              <p className="text-white/50 text-sm">{race.Circuit.circuitName}</p>
              <p className="text-white font-bold text-xl mt-2 leading-tight">
                {toItalianDate(raceUtc, 'EEE d MMMM yyyy')}
              </p>
              <p className="text-f1-red font-semibold text-sm mt-0.5">
                Ore {toItalianTime(raceUtc)}
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1.5">Manca</p>
              <CountdownTimer targetUtc={raceUtc} compact />
            </div>
          </div>

          {/* Session badges — horizontal scroll */}
          {sessions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10 flex gap-2 overflow-x-auto pb-1">
              {sessions.map(s => {
                const past = isPast(s.utc);
                return (
                  <div
                    key={s.label}
                    className={`rounded-xl px-3 py-2 text-center min-w-[52px] flex-shrink-0 border backdrop-blur-sm transition-opacity ${
                      past
                        ? 'border-f1-red/30 bg-f1-dark/70'
                        : 'border-white/10 bg-white/5 opacity-40'
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${past ? 'text-f1-red' : 'text-white/40'}`}>
                      {s.label}
                    </div>
                    <div className="text-white text-[10px] font-medium mt-0.5">
                      {toItalianTime(s.utc, 'EEE')}
                    </div>
                    <div className="text-white/70 text-xs font-semibold tabular-nums">
                      {toItalianTime(s.utc, 'HH:mm')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ─── Hero: Season ended ──────────────────────────────────────── */
const SeasonEndHero = ({ lastRace, season }) => {
  const { standings } = useDriverStandings(season);
  const champion = standings[0];
  const d = champion?.Driver;
  const teamId = champion?.Constructors?.[0]?.constructorId ?? '';
  const teamColor = getTeamColor(teamId);
  const flagUrl = lastRace ? getFlagUrl(lastRace.Circuit.Location.country) : null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden border"
      style={{ borderColor: teamColor + '60', boxShadow: `0 0 40px ${teamColor}15` }}
    >
      <div className="h-1" style={{ backgroundColor: teamColor }} />
      {flagUrl && (
        <>
          <div className="absolute inset-0 scale-110 blur-2xl opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${flagUrl})` }} />
          <div className="absolute inset-0 bg-f1-dark/80" />
        </>
      )}
      <div className="relative z-10 p-5 sm:p-8">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-4">Stagione {season} · Conclusa</p>
        {champion ? (
          <div>
            <p className="text-f1-muted text-xs mb-1">Campione del Mondo</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {d?.givenName} <span style={{ color: teamColor }}>{d?.familyName}</span>
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {champion.Constructors?.[0]?.name?.replace('F1 Team', '').trim()} ·{' '}
              <span className="font-bold" style={{ color: teamColor }}>{champion.points} pt</span>
            </p>
          </div>
        ) : (
          <p className="text-white/40">Dati stagione non disponibili</p>
        )}
        <Link
          to="/results/drivers"
          className="inline-flex items-center gap-1 mt-4 text-xs font-semibold px-4 py-2 rounded-full border transition-colors hover:text-white"
          style={{ borderColor: teamColor + '50', color: teamColor }}
        >
          Classifica finale →
        </Link>
      </div>
    </div>
  );
};

/* ─── Full standings table with driver photos ─────────────────── */
const StandingsSection = ({ season }) => {
  const { standings: drivers, loading: dLoad } = useDriverStandings(season);
  const { standings: constructors, loading: cLoad } = useConstructorStandings(season);
  const photoMap = useDriverPhotos();
  const [tab, setTab] = useState('pilots');
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 5;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-base">Classifiche {season}</h2>
        <Link to="/results/drivers" className="text-f1-red text-xs font-medium hover:underline">
          Vedi tutto →
        </Link>
      </div>

      <div className="flex gap-1 mb-3 bg-f1-surface rounded-xl p-1 w-fit">
        {[{ key: 'pilots', label: 'Piloti' }, { key: 'teams', label: 'Scuderie' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.key ? 'bg-f1-red text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
        {tab === 'pilots' ? (
          dLoad
            ? <div className="p-8 text-center text-f1-muted text-sm">Caricamento…</div>
            : drivers.length === 0
            ? <div className="p-8 text-center text-f1-muted text-sm">Nessun dato disponibile</div>
            : (
              <table className="w-full text-sm">
                <thead className="bg-f1-surface">
                  <tr className="text-f1-muted text-[10px] uppercase tracking-wider border-b border-f1-border">
                    <th className="text-left px-3 py-2 w-8">P</th>
                    <th className="text-left px-3 py-2">Pilota</th>
                    <th className="text-right px-3 py-2">Pt</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded ? drivers : drivers.slice(0, PREVIEW)).map(entry => {
                    const d = entry.Driver;
                    const teamId = entry.Constructors?.[0]?.constructorId ?? '';
                    const teamColor = getTeamColor(teamId);
                    const photo = photoMap.get(d.code);
                    return (
                      <tr key={d.driverId} className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors">
                        <td className={`px-3 py-2 font-black text-sm tabular-nums ${
                          entry.position === '1' ? 'text-yellow-400' :
                          entry.position === '2' ? 'text-gray-300' :
                          entry.position === '3' ? 'text-amber-600' : 'text-white/50'
                        }`}>{entry.position}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                            {photo?.headshot_url ? (
                              <img
                                src={photo.headshot_url}
                                alt={d.familyName}
                                className="w-8 h-8 rounded-full object-cover object-top bg-f1-border flex-shrink-0"
                                onError={e => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ backgroundColor: teamColor + '40' }}
                              >
                                {d.code?.slice(0, 3)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                to={`/driver/${d.driverId}`}
                                className="text-white font-semibold text-xs hover:text-f1-red transition-colors leading-tight block"
                              >
                                {d.givenName} {d.familyName}
                              </Link>
                              <span className="text-f1-muted text-[10px]">
                                {entry.Constructors?.[0]?.name?.replace('F1 Team', '').replace(' F1', '').trim()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-white tabular-nums text-sm">{entry.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
        ) : (
          cLoad
            ? <div className="p-8 text-center text-f1-muted text-sm">Caricamento…</div>
            : constructors.length === 0
            ? <div className="p-8 text-center text-f1-muted text-sm">Nessun dato disponibile</div>
            : (
              <table className="w-full text-sm">
                <thead className="bg-f1-surface">
                  <tr className="text-f1-muted text-[10px] uppercase tracking-wider border-b border-f1-border">
                    <th className="text-left px-3 py-2 w-8">P</th>
                    <th className="text-left px-3 py-2">Scuderia</th>
                    <th className="text-right px-3 py-2">Pt</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded ? constructors : constructors.slice(0, PREVIEW)).map(entry => {
                    const c = entry.Constructor;
                    const teamColor = getTeamColor(c.constructorId);
                    return (
                      <tr key={c.constructorId} className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors">
                        <td className={`px-3 py-2 font-black text-sm tabular-nums ${
                          entry.position === '1' ? 'text-yellow-400' :
                          entry.position === '2' ? 'text-gray-300' :
                          entry.position === '3' ? 'text-amber-600' : 'text-white/50'
                        }`}>{entry.position}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                            <span className="text-white font-semibold text-xs">
                              {c.name.replace('F1 Team', '').replace(' F1', '').trim()}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-white tabular-nums text-sm">{entry.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
        )}
        {(tab === 'pilots' ? drivers : constructors).length > PREVIEW && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full py-2.5 text-xs font-semibold text-f1-red hover:text-white transition-colors border-t border-f1-border/30"
          >
            {expanded ? 'Mostra meno ↑' : 'Mostra tutti →'}
          </button>
        )}
      </div>
    </section>
  );
};

/* ─── Upcoming races sidebar ──────────────────────────────────── */
const UpcomingCalendar = ({ races, season }) => {
  const now = new Date();
  const upcoming = races.filter(r => new Date(`${r.date}T${r.time || '00:00:00Z'}`) > now);
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 4;
  const visible = expanded ? upcoming : upcoming.slice(0, PREVIEW);

  return (
    <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">Prossimi GP</h2>
        <Link to="/schedule" className="text-f1-red text-xs font-medium hover:underline">
          Calendario →
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-f1-muted text-sm text-center py-8">Stagione conclusa</p>
      ) : (
        <>
          <div className="divide-y divide-f1-border/30">
            {visible.map(race => {
              const flagUrl = getFlagUrl(race.Circuit.Location.country);
              const raceUtc = `${race.date}T${race.time || '00:00:00Z'}`;
              return (
                <Link
                  key={race.round}
                  to={`/gp/${season}/${race.round}`}
                  className="px-4 py-3 hover:bg-f1-border/20 transition-colors flex items-center gap-3 group"
                >
                  <img
                    src={flagUrl}
                    alt={race.Circuit.Location.country}
                    className="w-8 h-5 object-cover rounded-sm flex-shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold leading-tight truncate group-hover:text-f1-red transition-colors">
                      {race.raceName.replace(' Grand Prix', ' GP')}
                    </p>
                    <p className="text-f1-muted text-[10px]">{race.Circuit.Location.locality}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/70 text-xs tabular-nums font-medium">
                      {toItalianDate(raceUtc, 'd MMM')}
                    </p>
                    <p className="text-f1-muted text-[10px]">{toItalianTime(raceUtc)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          {upcoming.length > PREVIEW && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full py-2.5 text-xs font-semibold text-f1-red hover:text-white transition-colors border-t border-f1-border/30"
            >
              {expanded ? 'Mostra meno ↑' : `+${upcoming.length - PREVIEW} altri GP →`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Last session results ────────────────────────────────────── */
const LastSessionWidget = ({ session, season }) => {
  // OpenF1 sessions don't have meeting_name — use country_name to find the round via findRound
  const nameHint = session?.country_name ?? session?.location ?? null;
  const { results, loading } = useSessionResults(
    session?.session_key,
    session?.session_name,
    nameHint,
    season
  );

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
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-bold text-base">Ultima sessione</h2>
          <p className="text-f1-muted text-xs">
            {sessionLabel} · {meetingLabel}
          </p>
        </div>
        <Link to="/results/races" className="text-f1-red text-xs font-medium hover:underline">
          Risultati →
        </Link>
      </div>
      <div className="bg-f1-surface border border-f1-border rounded-2xl p-4">
        {loading ? (
          <Loader size="inline" />
        ) : results.length > 0 ? (
          <>
            <ResultsTable results={results.slice(0, 5)} sessionType={session.session_name} compact />
            {results.length > 5 && (
              <Link
                to="/results/races"
                className="block text-center text-f1-red text-xs font-medium mt-3 hover:underline"
              >
                Mostra tutti i {results.length} →
              </Link>
            )}
          </>
        ) : (
          <p className="text-center text-f1-muted text-sm py-6">Nessun dato disponibile</p>
        )}
      </div>
    </section>
  );
};

/* ─── Home page ───────────────────────────────────────────────── */
const Home = () => {
  const { season } = useSeason();
  const { races, nextRace, lastRace } = useSchedule(season);
  const { lastSession, loading: sessionLoading } = useCurrentSeason(season);

  return (
    <div className="space-y-6 pb-4">
      {/* Hero — full width */}
      {nextRace ? (
        <NextGPHero race={nextRace} season={season} totalRaces={races.length} />
      ) : (
        <SeasonEndHero lastRace={lastRace} season={season} />
      )}

      {/* Last session — full width on all viewports */}
      {!sessionLoading && (
        <LastSessionWidget session={lastSession} season={season} />
      )}

      {/* 2-column grid */}
      <div className="grid md:grid-cols-7 gap-6">
        {/* LEFT: standings */}
        <div className="md:col-span-4">
          <StandingsSection season={season} />
        </div>

        {/* RIGHT: upcoming calendar */}
        <div className="md:col-span-3">
          <UpcomingCalendar races={races} season={season} />
        </div>
      </div>
    </div>
  );
};

export default Home;
