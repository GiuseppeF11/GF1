import { Link } from 'react-router-dom';

const posColor = (pos) => {
  if (pos === 1) return 'text-yellow-400';
  if (pos === 2) return 'text-gray-300';
  if (pos === 3) return 'text-amber-600';
  return 'text-white/60';
};

const ResultsTable = ({ results, sessionType = 'Race', compact = false }) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-10 text-f1-muted text-sm">
        Nessun risultato disponibile
      </div>
    );
  }

  const isRace = sessionType === 'Race' || sessionType === 'Sprint';

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-f1-border text-f1-muted text-xs uppercase tracking-wider">
            <th className="text-left pb-2 pr-3 w-8">Pos</th>
            <th className="text-left pb-2 pr-3">Pilota</th>
            {!compact && <th className="text-left pb-2 pr-3 hidden sm:table-cell">Scuderia</th>}
            {isRace && <th className="text-right pb-2">Gap</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => {
            const driver = r.driver;
            const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#6b7280';
            const pos = r.position ?? idx + 1;
            const isDNF = r.status && r.status !== 'Finished' && !r.status.startsWith('+');
            const driverLink = r.driver_id ?? r.driver_number;

            return (
              <tr
                key={r.driver_number ?? idx}
                className="border-b border-f1-border/30 hover:bg-f1-surface/50 transition-colors"
              >
                <td className={`py-2.5 pr-3 font-bold text-base tabular-nums w-8 ${posColor(pos)}`}>
                  {pos}
                </td>

                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-0.5 h-7 rounded-full flex-shrink-0"
                      style={{ backgroundColor: teamColor }}
                    />
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
                    <div>
                      {driver ? (
                        <Link
                          to={`/driver/${driverLink}`}
                          className="font-semibold text-white hover:text-f1-red transition-colors leading-tight block"
                        >
                          {driver.full_name ?? `Pilota ${r.driver_number}`}
                        </Link>
                      ) : (
                        <span className="font-semibold text-white/60">#{r.driver_number}</span>
                      )}
                      {compact && driver?.team_name && (
                        <span className="text-f1-muted text-xs block">{driver.team_name}</span>
                      )}
                    </div>
                  </div>
                </td>

                {!compact && (
                  <td className="py-2.5 pr-3 hidden sm:table-cell">
                    <span className="text-f1-muted text-xs">{driver?.team_name ?? '—'}</span>
                  </td>
                )}

                {isRace && (
                  <td className="py-2.5 text-right">
                    {pos === 1 ? (
                      <span className="text-f1-red font-semibold text-xs">Leader</span>
                    ) : isDNF ? (
                      <span className="text-f1-muted text-xs">{r.status}</span>
                    ) : r.gap ? (
                      <span className="text-white/60 text-xs tabular-nums">
                        {typeof r.gap === 'string' && !r.gap.startsWith('+') ? '+' : ''}{r.gap}
                      </span>
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

export default ResultsTable;
