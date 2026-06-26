import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDriverStandings } from '../../hooks/useStandings';
import { useSeason } from '../../contexts/SeasonContext';
import { useDriverPhotos } from '../../hooks/useDriverPhotos';
import { getDriverSeasonResults } from '../../services/jolpica';
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

const flagEmoji = (nationality) => {
  const map = {
    'Dutch': '🇳🇱', 'British': '🇬🇧', 'Monegasque': '🇲🇨', 'Australian': '🇦🇺',
    'Spanish': '🇪🇸', 'Mexican': '🇲🇽', 'Canadian': '🇨🇦', 'German': '🇩🇪',
    'Finnish': '🇫🇮', 'French': '🇫🇷', 'Thai': '🇹🇭', 'Japanese': '🇯🇵',
    'Chinese': '🇨🇳', 'Danish': '🇩🇰', 'American': '🇺🇸', 'Italian': '🇮🇹',
    'Argentine': '🇦🇷', 'New Zealander': '🇳🇿', 'Brazilian': '🇧🇷',
  };
  return map[nationality] ?? '🏁';
};

/* ─── Driver detail season results ──────────────────────────────── */
const DriverSeasonResults = ({ driverId, season }) => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRaces([]);
    setLoading(true);
    getDriverSeasonResults(season, driverId)
      .then(setRaces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [driverId, season]);

  if (loading) return <Loader size="inline" />;

  const totalPoints = races.reduce((acc, race) => {
    const result = race.Results?.[0];
    return acc + (result ? parseFloat(result.points ?? 0) : 0);
  }, 0);

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
              <th className="text-center px-2 py-2">Pos</th>
              <th className="text-right px-4 py-2">Punti</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => {
              const result = race.Results?.[0];
              const pos = result?.position;
              return (
                <tr key={race.round} className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="text-white text-xs font-medium">{race.raceName.replace(' Grand Prix', ' GP')}</div>
                    <div className="text-f1-muted text-[10px]">{race.date}</div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`font-bold tabular-nums ${
                      pos === '1' ? 'text-yellow-400' :
                      pos === '2' ? 'text-gray-300' :
                      pos === '3' ? 'text-amber-600' :
                      'text-white/60'
                    }`}>
                      {result?.status === 'Retired' ? 'DNF' : pos ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-white/60 text-xs tabular-nums">
                    {result?.points ?? '0'}
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

/* ─── Drivers page ───────────────────────────────────────────────── */
const ResultsDrivers = () => {
  const { season } = useSeason();
  const { standings, loading } = useDriverStandings(season);
  const photoMap = useDriverPhotos();
  const [selectedDriver, setSelectedDriver] = useState(null);

  if (loading) return <Loader />;

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-black text-2xl tracking-tight">Piloti {season}</h1>

        {/* Driver filter */}
        {standings.length > 0 && (
          <select
            value={selectedDriver ?? ''}
            onChange={e => setSelectedDriver(e.target.value || null)}
            className="bg-f1-surface border border-f1-border rounded-xl px-3 py-2 text-white text-xs appearance-none cursor-pointer focus:outline-none focus:border-f1-red/60 max-w-[160px] truncate"
          >
            <option value="">Tutti i piloti</option>
            {standings.map(s => (
              <option key={s.Driver.driverId} value={s.Driver.driverId}>
                {s.Driver.familyName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Standings table */}
      {!selectedDriver ? (
        <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
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
              {standings.map((entry) => {
                const d = entry.Driver;
                const teamId = entry.Constructors?.[0]?.constructorId ?? '';
                const teamColor = getTeamColor(teamId);

                return (
                  <tr
                    key={d.driverId}
                    className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors"
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
                      <div className="flex items-center gap-2.5">
                        <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                        {(() => {
                          const photo = photoMap.get(d.code);
                          return photo?.headshot_url ? (
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
                          );
                        })()}
                        <div className="min-w-0">
                          <Link
                            to={`/driver/${d.driverId}`}
                            className="font-semibold text-white hover:text-f1-red transition-colors block leading-tight"
                          >
                            {d.givenName} {d.familyName}
                          </Link>
                          <span className="text-f1-muted text-xs">
                            {entry.Constructors?.[0]?.name?.replace('F1 Team', '').trim()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 hidden sm:table-cell text-white/50 text-sm">
                      {flagEmoji(d.nationality)}
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
        /* Single driver view */
        (() => {
          const entry = standings.find(s => s.Driver.driverId === selectedDriver);
          if (!entry) return null;
          const d = entry.Driver;
          const teamId = entry.Constructors?.[0]?.constructorId ?? '';
          const teamColor = getTeamColor(teamId);

          return (
            <div className="space-y-4">
              {/* Driver header */}
              <div
                className="rounded-2xl p-5 border border-f1-border"
                style={{ borderLeftColor: teamColor, borderLeftWidth: 4, backgroundColor: teamColor + '10' }}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-white font-black text-xl">
                      {d.givenName} {d.familyName}
                    </h2>
                    <p className="text-f1-muted text-sm">
                      {entry.Constructors?.[0]?.name} · {flagEmoji(d.nationality)} {d.nationality}
                    </p>
                    <p className="text-f1-red font-bold mt-1">{entry.points} punti · P{entry.position}</p>
                  </div>
                </div>
              </div>

              <DriverSeasonResults driverId={selectedDriver} season={season} />

              <Link
                to={`/driver/${selectedDriver}`}
                className="block text-center bg-f1-red text-white py-3 rounded-xl font-semibold text-sm hover:bg-f1-red/90 transition-colors"
              >
                Scheda completa pilota →
              </Link>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default ResultsDrivers;
