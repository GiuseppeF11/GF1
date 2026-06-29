import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSeasonSchedule } from '../../services/jolpica';
import { getMeetings, getSessions } from '../../services/openf1';
import { useSessionResults } from '../../hooks/useSessionResults';
import { getRaceSessions } from '../../hooks/useSchedule';
import { getFlagUrl } from '../../utils/flags';
import { isPast, toItalianTime, toItalianDate, formatGPWeekend } from '../../utils/time';
import ResultsTable from '../../components/ui/ResultsTable';
import Loader from '../../components/ui/Loader';

const SESSION_LABELS = {
  'Practice 1': 'P1', 'Practice 2': 'P2', 'Practice 3': 'P3',
  'Qualifying': 'Q', 'Sprint Qualifying': 'SQ', 'Sprint': 'Sprint', 'Race': 'Gara',
};

const LiveDot = () => (
  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-red opacity-75" />
    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-f1-red" />
  </span>
);

const GPDetail = () => {
  const { year, round } = useParams();
  const [race, setRace] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [openF1Sessions, setOpenF1Sessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRace(null);
    setMeeting(null);
    setOpenF1Sessions([]);
    setSelectedSession(null);

    Promise.all([
      getSeasonSchedule(Number(year)),
      getMeetings(Number(year)).catch(() => []),
    ]).then(([races, meetings]) => {
      if (cancelled) return;
      const r = races.find(race => String(race.round) === String(round));
      setRace(r ?? null);

      if (r && meetings.length > 0) {
        const raceTitle = r.raceName.replace(' Grand Prix', '').toLowerCase();
        const m = meetings.find(m =>
          m.meeting_name.toLowerCase().includes(raceTitle) ||
          (r.date && m.date_start?.startsWith(r.date))
        );
        setMeeting(m ?? null);
      }
    }).catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [year, round]);

  useEffect(() => {
    if (!meeting?.meeting_key) return;
    setSessionsLoading(true);
    getSessions({ meeting_key: meeting.meeting_key })
      .then(data => {
        setOpenF1Sessions(data);
        const now = new Date();
        const active = data.find(s =>
          new Date(s.date_start) <= now && now <= new Date(s.date_end)
        );
        const completed = data.filter(s => isPast(s.date_end));
        setSelectedSession(active ?? completed[completed.length - 1] ?? null);
      })
      .catch(console.error)
      .finally(() => setSessionsLoading(false));
  }, [meeting?.meeting_key]);

  // Determine if selected session is currently live
  const isSessionLive = selectedSession
    ? (() => {
        const now = new Date();
        return new Date(selectedSession.date_start) <= now && now <= new Date(selectedSession.date_end);
      })()
    : false;

  const { results, loading: resultsLoading } = useSessionResults(
    selectedSession?.session_key,
    selectedSession?.session_name,
    race?.raceName,
    Number(year),
    isSessionLive
  );

  if (loading) return <Loader />;
  if (!race) return (
    <div className="text-center py-16">
      <p className="text-f1-muted">GP non trovato</p>
      <Link to="/schedule" className="text-f1-red text-sm mt-4 inline-block hover:underline">← Torna al calendario</Link>
    </div>
  );

  const flagUrl = getFlagUrl(race.Circuit.Location.country);
  const raceUtc = `${race.date}T${race.time || '00:00:00Z'}`;
  const startUtc = race.FirstPractice
    ? `${race.FirstPractice.date}T${race.FirstPractice.time}`
    : raceUtc;

  const jolpikaSessions = getRaceSessions(race);
  const displaySessions = openF1Sessions.length > 0 ? openF1Sessions : jolpikaSessions;

  return (
    <div className="space-y-5 pb-4">
      {/* Back */}
      <Link to="/schedule" className="inline-flex items-center gap-1 text-f1-muted text-xs hover:text-white transition-colors">
        ← Calendario
      </Link>

      {/* Race header */}
      <div className="relative rounded-3xl overflow-hidden border border-f1-red/20">
        <div
          className="absolute inset-0 scale-110 blur-2xl opacity-25 bg-cover bg-center"
          style={{ backgroundImage: `url(${flagUrl})` }}
        />
        <div className="absolute inset-0 bg-f1-dark/80" />
        <div className="h-1 bg-f1-red" />
        <div className="relative z-10 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <img
              src={flagUrl}
              alt={race.Circuit.Location.country}
              className="w-14 h-10 object-cover rounded-lg flex-shrink-0 mt-1 shadow-lg"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
                Round {race.round} · {year}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {race.raceName.replace(' Grand Prix', '')}
                <span className="text-f1-red"> GP</span>
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {race.Circuit.circuitName} · {race.Circuit.Location.locality}
              </p>
              <p className="text-white/30 text-xs mt-0.5">
                {formatGPWeekend(startUtc, raceUtc)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions carousel */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {displaySessions.map(s => {
          const label = SESSION_LABELS[s.session_name] ?? s.session_name;
          const past = isPast(s.date_end ?? s.date_start);
          const isActive = isPast(s.date_start) && !isPast(s.date_end);
          const isSelected = selectedSession?.session_key === s.session_key || selectedSession?.session_name === s.session_name;
          const hasOpenF1 = openF1Sessions.length > 0;
          const isClickable = hasOpenF1 && (past || isActive);

          return (
            <button
              key={s.session_key ?? s.session_name}
              onClick={() => isClickable && setSelectedSession(s)}
              disabled={!isClickable}
              className={`rounded-xl px-3 py-2 text-center min-w-[58px] flex-shrink-0 border backdrop-blur-sm transition-all ${
                isSelected
                  ? 'border-f1-red bg-f1-red/10'
                  : isActive
                  ? 'border-f1-red/40 bg-f1-red/5 cursor-pointer'
                  : past
                  ? 'border-f1-border bg-f1-surface hover:border-f1-red/40 cursor-pointer'
                  : 'border-f1-border/30 bg-f1-surface/50 opacity-40 cursor-default'
              }`}
            >
              <div className={`text-[11px] font-black uppercase tracking-wide ${
                isSelected || isActive ? 'text-f1-red' : past ? 'text-white' : 'text-white/40'
              }`}>
                {label}
              </div>
              <div className="text-white text-[10px] font-medium mt-0.5">
                {toItalianDate(s.date_start, 'EEE')}
              </div>
              <div className="text-white/70 text-xs font-semibold tabular-nums">
                {toItalianTime(s.date_start, 'HH:mm')}
              </div>
              {isActive && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <LiveDot />
                  <span className="text-[9px] text-f1-red font-bold uppercase tracking-wide">Live</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Results panel */}
      {selectedSession && (
        <div className="bg-f1-surface border border-f1-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-f1-border">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-sm">
                {SESSION_LABELS[selectedSession.session_name] ?? selectedSession.session_name}
                {selectedSession.session_name !== 'Race' && ` — ${selectedSession.session_name}`}
              </h2>
              {isSessionLive && (
                <span className="flex items-center gap-1 bg-f1-red/10 border border-f1-red/30 rounded-full px-2 py-0.5">
                  <LiveDot />
                  <span className="text-f1-red text-[9px] font-bold uppercase tracking-widest">Live</span>
                </span>
              )}
            </div>
            <span className="text-f1-muted text-xs">
              {toItalianDate(selectedSession.date_start, 'EEE d MMM · HH:mm')}
            </span>
          </div>
          {resultsLoading ? (
            <Loader size="inline" />
          ) : (
            <div className="overflow-y-auto max-h-80">
              <ResultsTable results={results} sessionType={selectedSession.session_name} />
            </div>
          )}
        </div>
      )}

      {!selectedSession && !sessionsLoading && (
        <div className="bg-f1-surface border border-f1-border rounded-2xl p-8 text-center">
          <p className="text-f1-muted text-sm">
            {isPast(raceUtc)
              ? 'Risultati non disponibili per questo GP'
              : 'I risultati saranno disponibili dopo ogni sessione'}
          </p>
        </div>
      )}
    </div>
  );
};

export default GPDetail;
