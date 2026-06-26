import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../../contexts/SeasonContext';
import { useSchedule, getRaceSessions } from '../../hooks/useSchedule';
import { getMeetings, getSessions } from '../../services/openf1';
import { useSessionResults } from '../../hooks/useSessionResults';
import { isPast, formatSessionName } from '../../utils/time';
import { getFlagUrl } from '../../utils/flags';
import Loader from '../../components/ui/Loader';

const posColor = (pos) => {
  if (pos === 1) return 'text-yellow-400';
  if (pos === 2) return 'text-gray-300';
  if (pos === 3) return 'text-amber-600';
  return 'text-white/60';
};

const RaceResultsTable = ({ results, sessionType }) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-10 text-f1-muted text-sm">
        Nessun risultato disponibile
      </div>
    );
  }

  const isPractice = sessionType?.startsWith('Practice');
  const isQual = sessionType === 'Qualifying' || sessionType === 'Sprint Qualifying';
  const isRace = sessionType === 'Race' || sessionType === 'Sprint';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-f1-border text-f1-muted text-xs uppercase tracking-wider">
            <th className="text-left pb-2 pr-3 w-8">Pos</th>
            <th className="text-left pb-2 pr-3">Pilota</th>
            <th className="text-left pb-2 pr-3 hidden sm:table-cell">Scuderia</th>
            <th className="text-right pb-2 pr-3">Tempo</th>
            {isRace && <th className="text-right pb-2 pl-3">Pt</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => {
            const driver = r.driver;
            const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#6b7280';
            const pos = r.position ?? idx + 1;
            const isDNF = r.status && r.status !== 'Finished' && r.status !== '+1 Lap' && !r.status.startsWith('+');

            return (
              <tr key={r.driver_number ?? idx} className="border-b border-f1-border/30 hover:bg-f1-surface/50 transition-colors">
                <td className={`py-2.5 pr-3 font-black text-base tabular-nums w-8 ${posColor(pos)}`}>
                  {pos}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                    {driver?.headshot_url ? (
                      <img
                        src={driver.headshot_url}
                        alt={driver.full_name}
                        className="w-7 h-7 rounded-full object-cover object-top bg-f1-border flex-shrink-0"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: teamColor + '40' }}
                      >
                        {driver?.name_acronym ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        to={`/driver/${r.driver_id ?? driver?.name_acronym?.toLowerCase() ?? r.driver_number}`}
                        className="font-semibold text-white hover:text-f1-red transition-colors leading-tight block truncate"
                      >
                        {driver?.full_name ?? `#${r.driver_number}`}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3 hidden sm:table-cell">
                  <span className="text-f1-muted text-xs">{driver?.team_name ?? '—'}</span>
                </td>
                <td className="py-2.5 text-right pr-3">
                  {isRace ? (
                    isDNF ? (
                      <span className="text-f1-muted text-xs">{r.status}</span>
                    ) : r.gap ? (
                      <span className="text-white/70 text-xs font-mono tabular-nums">
                        {typeof r.gap === 'string' && !r.gap.startsWith('+') && pos !== 1 ? '+' : ''}{r.gap}
                      </span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )
                  ) : r.gap ? (
                    <span className="text-white/70 text-xs font-mono tabular-nums">{r.gap}</span>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </td>
                {isRace && (
                  <td className="py-2.5 text-right pl-3">
                    {r.points && r.points !== '0' ? (
                      <span className="text-f1-red font-bold text-sm tabular-nums">{r.points}</span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ResultsRaces = () => {
  const { season } = useSeason();
  const { races, lastRace, loading: scheduleLoading } = useSchedule(season);

  // OpenF1 meetings fetched once — used to resolve meeting_key for sessions
  const [openF1Meetings, setOpenF1Meetings] = useState([]);
  const openF1Tried = useRef(false);
  useEffect(() => {
    if (openF1Tried.current) return;
    openF1Tried.current = true;
    getMeetings(season).then(setOpenF1Meetings).catch(() => {});
  }, [season]);

  const now = new Date();
  const pastRaces = races.filter(r => new Date(`${r.date}T${r.time || '00:00:00Z'}`) <= now);

  const [selectedRace, setSelectedRace] = useState(null);
  useEffect(() => {
    if (!selectedRace && lastRace) setSelectedRace(lastRace);
  }, [lastRace?.round]);

  // Fetch OpenF1 sessions when we know the meeting_key
  const [openF1Sessions, setOpenF1Sessions] = useState([]);
  useEffect(() => {
    if (!selectedRace || openF1Meetings.length === 0) { setOpenF1Sessions([]); return; }
    const raceTitle = selectedRace.raceName.replace(' Grand Prix', '').toLowerCase();
    const m = openF1Meetings.find(m =>
      m.meeting_name.toLowerCase().includes(raceTitle) ||
      m.date_start?.startsWith(selectedRace.date)
    );
    if (!m?.meeting_key) { setOpenF1Sessions([]); return; }
    let cancelled = false;
    getSessions({ meeting_key: m.meeting_key })
      .then(data => { if (!cancelled) setOpenF1Sessions(data); })
      .catch(() => { if (!cancelled) setOpenF1Sessions([]); });
    return () => { cancelled = true; };
  }, [selectedRace?.round, openF1Meetings.length]);

  // Prefer OpenF1 sessions (have real session_key); fall back to Jolpica-derived
  const jolpikaSessions = selectedRace ? getRaceSessions(selectedRace) : [];
  const displaySessions = openF1Sessions.length > 0 ? openF1Sessions : jolpikaSessions;
  const completedSessions = displaySessions.filter(s => isPast(s.date_end ?? s.date_start));

  const [selectedSession, setSelectedSession] = useState(null);
  useEffect(() => {
    const last = completedSessions[completedSessions.length - 1];
    setSelectedSession(last ?? null);
  }, [selectedRace?.round, openF1Sessions.length]);

  const { results, loading: loadingResults } = useSessionResults(
    selectedSession?.session_key,
    selectedSession?.session_name,
    selectedRace?.raceName,
    season
  );

  if (scheduleLoading) return <Loader />;

  const flagUrl = selectedRace ? getFlagUrl(selectedRace.Circuit.Location.country) : null;

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-white font-black text-2xl tracking-tight">Risultati Gare {season}</h1>

      {/* Pickers */}
      <div className="bg-f1-surface border border-f1-border rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="block text-f1-muted text-xs uppercase tracking-wider mb-1">Gran Premio</label>
            <select
              value={selectedRace?.round ?? ''}
              onChange={e => {
                const r = pastRaces.find(r => String(r.round) === e.target.value);
                if (r) { setSelectedRace(r); setSelectedSession(null); }
              }}
              className="w-full bg-f1-surface border border-f1-border rounded-xl px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-f1-red/60 transition-colors"
            >
              {pastRaces.length === 0 ? (
                <option>Nessun GP disponibile</option>
              ) : (
                [...pastRaces].reverse().map(r => (
                  <option key={r.round} value={r.round}>
                    Round {r.round} · {r.raceName.replace(' Grand Prix', ' GP')}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex-1 sm:max-w-[200px]">
            <label className="block text-f1-muted text-xs uppercase tracking-wider mb-1">Sessione</label>
            <select
              value={selectedSession?.session_key ?? selectedSession?.session_name ?? ''}
              onChange={e => {
                const val = e.target.value;
                const s = completedSessions.find(s =>
                  String(s.session_key ?? s.session_name) === val
                );
                if (s) setSelectedSession(s);
              }}
              disabled={completedSessions.length === 0}
              className="w-full bg-f1-surface border border-f1-border rounded-xl px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-f1-red/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {completedSessions.length === 0 ? (
                <option>Nessuna sessione</option>
              ) : (
                completedSessions.map(s => (
                  <option key={s.session_key ?? s.session_name} value={s.session_key ?? s.session_name}>
                    {formatSessionName(s.session_name)}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Results card */}
      <div className="bg-f1-surface border border-f1-border rounded-2xl p-4">
        {selectedSession && selectedRace && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-f1-border">
            <div>
              <h2 className="text-white font-bold text-sm">
                {formatSessionName(selectedSession.session_name)}
              </h2>
              <p className="text-f1-muted text-xs mt-0.5">
                {selectedRace.raceName.replace(' Grand Prix', ' GP')} · {selectedRace.Circuit.Location.locality}
              </p>
            </div>
            {flagUrl && (
              <img
                src={flagUrl}
                alt={selectedRace.Circuit.Location.country}
                className="w-8 h-5 object-cover rounded-sm"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
        )}

        {!selectedSession ? (
          <p className="text-f1-muted text-sm text-center py-8">
            Seleziona una sessione per vedere i risultati
          </p>
        ) : loadingResults ? (
          <Loader size="inline" />
        ) : (
          <RaceResultsTable results={results} sessionType={selectedSession.session_name} />
        )}
      </div>
    </div>
  );
};

export default ResultsRaces;
