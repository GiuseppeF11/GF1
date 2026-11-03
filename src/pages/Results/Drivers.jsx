import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverStandings } from '../../hooks/useStandings';
import { useSeason } from '../../contexts/SeasonContext';
import { useDriverPhotos } from '../../hooks/useDriverPhotos';
import { getTeamColor, posColor } from '../../utils/teamColors';
import { getFlagUrlByNationality } from '../../utils/flags';
import { SkeletonRows } from '../../components/ui/Skeleton';

const ResultsDrivers = () => {
  const { season } = useSeason();
  const { standings, loading } = useDriverStandings(season);
  const photoMap = useDriverPhotos();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  if (loading) {
    return (
      <div className="space-y-5 pb-4">
        <h1 className="text-white font-black text-2xl tracking-tight">Piloti {season}</h1>
        <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
          <SkeletonRows rows={10} />
        </div>
      </div>
    );
  }

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? standings.filter(s => {
        const d = s.Driver;
        const team = s.Constructors?.[0]?.name ?? '';
        return (
          `${d.givenName} ${d.familyName}`.toLowerCase().includes(needle) ||
          (d.code ?? '').toLowerCase().includes(needle) ||
          team.toLowerCase().includes(needle)
        );
      })
    : standings;

  return (
    <div className="space-y-5 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-white font-black text-2xl tracking-tight">Piloti {season}</h1>

        {standings.length > 0 && (
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca pilota o scuderia…"
            className="bg-f1-surface border border-f1-border rounded-xl px-3 py-2 text-white text-xs placeholder:text-f1-muted focus:outline-none focus:border-f1-red/60 transition-colors sm:max-w-[220px]"
          />
        )}
      </div>

      <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
        {visible.length === 0 ? (
          <p className="text-f1-muted text-sm text-center py-12">
            Nessun pilota corrisponde a "{query}"
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-f1-muted text-xs uppercase tracking-wider border-b border-f1-border">
                <th className="text-left px-4 py-3 w-8">Pos</th>
                <th className="text-left px-4 py-3">Pilota</th>
                <th className="text-left px-2 py-3 hidden sm:table-cell">Nazione</th>
                <th className="text-right px-4 py-3">Punti</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => {
                const d = entry.Driver;
                const teamId = entry.Constructors?.[0]?.constructorId ?? '';
                const teamColor = getTeamColor(teamId);
                const photo = photoMap.get(d.code);
                const flagUrl = getFlagUrlByNationality(d.nationality);

                return (
                  <tr
                    key={d.driverId}
                    onClick={() => navigate(`/driver/${d.driverId}`)}
                    className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className={`font-black text-base tabular-nums ${posColor(entry.position)}`}>
                        {entry.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
                          <span className="font-semibold text-white block leading-tight">
                            {d.givenName} {d.familyName}
                          </span>
                          <span className="text-f1-muted text-xs">
                            {entry.Constructors?.[0]?.name?.replace('F1 Team', '').trim()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 hidden sm:table-cell">
                      {flagUrl ? (
                        <img
                          src={flagUrl}
                          alt={d.nationality}
                          title={d.nationality}
                          className="w-7 h-[18px] object-cover rounded-sm"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-f1-muted text-xs">{d.nationality}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white font-bold tabular-nums">{entry.points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResultsDrivers;
