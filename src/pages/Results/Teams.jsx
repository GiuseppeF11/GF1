import { useState, useEffect } from 'react';
import { useConstructorStandings } from '../../hooks/useStandings';
import { useSeason } from '../../contexts/SeasonContext';
import { getConstructorSeasonResults } from '../../services/jolpica';
import Loader from '../../components/ui/Loader';

const TEAM_COLORS = {
  'red_bull': '#3671C6',
  'ferrari': '#E8002D',
  'mercedes': '#27F4D2',
  'mclaren': '#FF8000',
  'aston_martin': '#229971',
  'alpine': '#FF87BC',
  'williams': '#64C4FF',
  'haas': '#B6BABD',
  'rb': '#6692FF',
  'kick_sauber': '#52E252',
  'sauber': '#52E252',
};
const getTeamColor = (id) => TEAM_COLORS[id] ?? '#6b7280';

const TeamSeasonResults = ({ constructorId, season }) => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRaces([]);
    setLoading(true);
    getConstructorSeasonResults(season, constructorId)
      .then(setRaces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [constructorId, season]);

  if (loading) return <Loader size="inline" />;

  // Group results by round
  const byRound = {};
  races.forEach(race => {
    const round = race.round;
    if (!byRound[round]) byRound[round] = { race, results: [] };
    byRound[round].results.push(...(race.Results ?? []));
  });

  const totalPoints = Object.values(byRound).reduce((acc, { results }) =>
    acc + results.reduce((a, r) => a + parseFloat(r.points ?? 0), 0), 0);

  return (
    <div className="mt-4 bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex justify-between items-center">
        <span className="text-white font-semibold text-sm">Risultati {season}</span>
        <span className="text-f1-red font-bold text-sm">{totalPoints} pt totali</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-f1-muted text-xs uppercase tracking-wider border-b border-f1-border">
              <th className="text-left px-4 py-2">GP</th>
              <th className="text-center px-2 py-2 hidden sm:table-cell">Pilota 1</th>
              <th className="text-center px-2 py-2 hidden sm:table-cell">Pilota 2</th>
              <th className="text-right px-4 py-2">Punti GP</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(byRound).map(({ race, results }) => {
              const gpPoints = results.reduce((a, r) => a + parseFloat(r.points ?? 0), 0);
              const sorted = [...results].sort((a, b) => parseInt(a.position) - parseInt(b.position));

              return (
                <tr key={race.round} className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="text-white text-xs font-medium">{race.raceName.replace(' Grand Prix', ' GP')}</div>
                    <div className="text-f1-muted text-[10px]">{race.date}</div>
                  </td>
                  <td className="px-2 py-2.5 text-center hidden sm:table-cell">
                    {sorted[0] && (
                      <span className={`text-xs font-semibold ${
                        sorted[0].position === '1' ? 'text-yellow-400' : 'text-white/70'
                      }`}>
                        P{sorted[0].position} {sorted[0].Driver?.code}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center hidden sm:table-cell">
                    {sorted[1] && (
                      <span className={`text-xs font-semibold ${
                        sorted[1].position === '1' ? 'text-yellow-400' : 'text-white/70'
                      }`}>
                        P{sorted[1].position} {sorted[1].Driver?.code}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-white font-bold tabular-nums text-sm">{gpPoints}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ResultsTeams = () => {
  const { season } = useSeason();
  const { standings, loading } = useConstructorStandings(season);
  const [selectedTeam, setSelectedTeam] = useState(null);

  if (loading) return <Loader />;

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-black text-2xl tracking-tight">Scuderie {season}</h1>

        {standings.length > 0 && (
          <select
            value={selectedTeam ?? ''}
            onChange={e => setSelectedTeam(e.target.value || null)}
            className="bg-f1-surface border border-f1-border rounded-xl px-3 py-2 text-white text-xs appearance-none cursor-pointer focus:outline-none focus:border-f1-red/60 max-w-[160px] truncate"
          >
            <option value="">Tutte le scuderie</option>
            {standings.map(s => (
              <option key={s.Constructor.constructorId} value={s.Constructor.constructorId}>
                {s.Constructor.name.replace('F1 Team', '').trim()}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedTeam ? (
        <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-f1-muted text-xs uppercase tracking-wider border-b border-f1-border">
                <th className="text-left px-4 py-3 w-8">Pos</th>
                <th className="text-left px-4 py-3">Scuderia</th>
                <th className="text-right px-4 py-3">Punti</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry) => {
                const c = entry.Constructor;
                const teamColor = getTeamColor(c.constructorId);

                return (
                  <tr
                    key={c.constructorId}
                    onClick={() => setSelectedTeam(c.constructorId)}
                    className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className={`font-black text-base tabular-nums ${
                        entry.position === '1' ? 'text-yellow-400' :
                        entry.position === '2' ? 'text-gray-300' :
                        entry.position === '3' ? 'text-amber-600' : 'text-white/60'
                      }`}>
                        {entry.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-0.5 h-8 rounded-full" style={{ backgroundColor: teamColor }} />
                        <div>
                          <div className="text-white font-semibold text-sm">
                            {c.name.replace('F1 Team', '').replace(' F1', '').trim()}
                          </div>
                          <div className="text-f1-muted text-xs">{c.nationality}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white font-bold tabular-nums">{entry.points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        (() => {
          const entry = standings.find(s => s.Constructor.constructorId === selectedTeam);
          if (!entry) return null;
          const c = entry.Constructor;
          const teamColor = getTeamColor(c.constructorId);

          return (
            <div className="space-y-4">
              <div
                className="rounded-2xl p-5 border border-f1-border"
                style={{ borderLeftColor: teamColor, borderLeftWidth: 4, backgroundColor: teamColor + '10' }}
              >
                <h2 className="text-white font-black text-xl">
                  {c.name.replace('F1 Team', '').replace(' F1', '').trim()}
                </h2>
                <p className="text-f1-muted text-sm mt-0.5">{c.nationality}</p>
                <p className="text-f1-red font-bold mt-1">{entry.points} punti · P{entry.position}</p>
              </div>

              <TeamSeasonResults constructorId={selectedTeam} season={season} />
            </div>
          );
        })()
      )}
    </div>
  );
};

export default ResultsTeams;
