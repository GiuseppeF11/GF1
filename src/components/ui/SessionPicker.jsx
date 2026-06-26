import { formatSessionName, isPast } from '../../utils/time';

const SessionPicker = ({ meetings, selectedMeeting, onMeetingChange, sessions, selectedSession, onSessionChange }) => {
  const pastMeetings = meetings.filter(m => isPast(m.date_end));
  const completedSessions = sessions.filter(s => isPast(s.date_end));

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* GP selector */}
      <div className="flex-1">
        <label className="block text-f1-muted text-xs uppercase tracking-wider mb-1">Gran Premio</label>
        <select
          value={selectedMeeting?.meeting_key ?? ''}
          onChange={e => {
            const m = meetings.find(m => String(m.meeting_key) === e.target.value);
            if (m) onMeetingChange(m);
          }}
          className="w-full bg-f1-surface border border-f1-border rounded-xl px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-f1-red/60 transition-colors"
        >
          {pastMeetings.map(m => (
            <option key={m.meeting_key} value={m.meeting_key}>
              {m.meeting_name.replace(' Grand Prix', ' GP')} · {m.location}
            </option>
          ))}
        </select>
      </div>

      {/* Session selector */}
      <div className="flex-1 sm:max-w-[200px]">
        <label className="block text-f1-muted text-xs uppercase tracking-wider mb-1">Sessione</label>
        <select
          value={selectedSession?.session_key ?? ''}
          onChange={e => {
            const s = sessions.find(s => String(s.session_key) === e.target.value);
            if (s) onSessionChange(s);
          }}
          disabled={completedSessions.length === 0}
          className="w-full bg-f1-surface border border-f1-border rounded-xl px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-f1-red/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {completedSessions.length === 0 ? (
            <option>Nessuna sessione</option>
          ) : (
            completedSessions.map(s => (
              <option key={s.session_key} value={s.session_key}>
                {formatSessionName(s.session_name)}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};

export default SessionPicker;
