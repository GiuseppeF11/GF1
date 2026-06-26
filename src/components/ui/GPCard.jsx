import { Link } from 'react-router-dom';
import { formatGPWeekend, toItalianTime, toItalianDate, isPast, isFuture } from '../../utils/time';

const GPCard = ({ meeting, sessions = [], isNext = false, compact = false }) => {
  const raceSessions = sessions.filter(s => s.session_name === 'Race' || s.session_name === 'Sprint');
  const raceSession = sessions.find(s => s.session_name === 'Race');
  const past = isPast(meeting.date_end);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${
        isNext
          ? 'border-f1-red/60 bg-f1-surface shadow-[0_0_30px_rgba(225,6,0,0.15)]'
          : past
          ? 'border-f1-border/30 bg-f1-surface/40 opacity-50'
          : 'border-f1-border bg-f1-surface hover:border-f1-red/40'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Country flag background */}
      {meeting.country_flag && (
        <div
          className="absolute inset-0 opacity-[0.04] bg-cover bg-center"
          style={{ backgroundImage: `url(${meeting.country_flag})` }}
        />
      )}

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {meeting.country_flag && (
              <img
                src={meeting.country_flag}
                alt={meeting.country_name}
                className="w-7 h-5 object-cover rounded-sm flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                {meeting.meeting_name.replace(' Grand Prix', ' GP')}
              </p>
              <p className="text-f1-muted text-xs">{meeting.location}</p>
            </div>
          </div>

          {isNext && (
            <span className="flex-shrink-0 bg-f1-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Next
            </span>
          )}
          {past && (
            <span className="flex-shrink-0 text-white/20 text-[10px] font-medium uppercase tracking-wide">
              Terminato
            </span>
          )}
        </div>

        {/* Date row */}
        <div className="flex items-center justify-between text-xs text-f1-muted">
          <span>{formatGPWeekend(meeting.date_start, meeting.date_end)}</span>
          {raceSession && !past && (
            <span className="text-white/60">
              Gara {toItalianTime(raceSession.date_start)}
            </span>
          )}
        </div>

        {/* Sessions list (non-compact) */}
        {!compact && sessions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sessions.map(s => (
              <span
                key={s.session_key}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isPast(s.date_end)
                    ? 'bg-f1-border text-white/40'
                    : 'bg-f1-red/10 text-f1-red border border-f1-red/20'
                }`}
              >
                {s.session_name === 'Race'
                  ? 'Gara'
                  : s.session_name === 'Qualifying'
                  ? 'Q'
                  : s.session_name === 'Sprint'
                  ? 'Sprint'
                  : s.session_name === 'Sprint Qualifying'
                  ? 'SQ'
                  : s.session_name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GPCard;
