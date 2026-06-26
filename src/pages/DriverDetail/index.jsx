import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLatestDrivers } from '../../services/openf1';
import { getDriverInfo, getDriverSeasonResults, getDriverCareerStats } from '../../services/jolpica';
import { useSeason } from '../../contexts/SeasonContext';
import Loader from '../../components/ui/Loader';

const TEAM_COLORS = {
  'red_bull': '#3671C6', 'ferrari': '#E8002D', 'mercedes': '#27F4D2',
  'mclaren': '#FF8000', 'aston_martin': '#229971', 'alpine': '#FF87BC',
  'williams': '#64C4FF', 'haas': '#B6BABD', 'rb': '#6692FF',
  'kick_sauber': '#52E252', 'sauber': '#52E252',
};

const StatCard = ({ label, value, sub }) => (
  <div className="bg-f1-dark border border-f1-border rounded-2xl p-4 text-center">
    <div className="text-2xl font-black text-white tabular-nums leading-none">{value ?? '—'}</div>
    {sub && <div className="text-f1-red text-xs font-bold mt-1">{sub}</div>}
    <div className="text-f1-muted text-[10px] mt-1 uppercase tracking-widest">{label}</div>
  </div>
);

const DriverDetail = () => {
  const { driverNumber } = useParams();
  const { season } = useSeason();
  const [openF1Driver, setOpenF1Driver] = useState(null);
  const [jolpikaDriver, setJolpikaDriver] = useState(null);
  const [seasonResults, setSeasonResults] = useState([]);
  const [titles, setTitles] = useState(0);
  const [loading, setLoading] = useState(true);

  // driverNumber can be: "norris" (jolpika id), "4" (driver number), "NOR" (acronym)
  const isNumeric = /^\d+$/.test(driverNumber);
  const jolpikaId = isNumeric ? null : driverNumber;

  useEffect(() => {
    setLoading(true);

    // Always fetch latest OpenF1 drivers for photos/colors
    const p1 = getLatestDrivers().then(drivers => {
      if (isNumeric) {
        return drivers.find(d => String(d.driver_number) === driverNumber) ?? null;
      }
      // Match by jolpika ID via last name or code lookup
      const jolpikaToName = {
        'norris': 'NOR', 'max_verstappen': 'VER', 'piastri': 'PIA',
        'russell': 'RUS', 'leclerc': 'LEC', 'hamilton': 'HAM',
        'antonelli': 'ANT', 'albon': 'ALB', 'sainz': 'SAI',
        'alonso': 'ALO', 'stroll': 'STR', 'gasly': 'GAS',
        'doohan': 'DOO', 'tsunoda': 'TSU', 'lawson': 'LAW',
        'hulkenberg': 'HUL', 'bearman': 'BEA', 'bortoleto': 'BOR',
        'ocon': 'OCO', 'hadjar': 'HAD', 'colapinto': 'COL',
      };
      const acronym = jolpikaToName[driverNumber];
      return acronym
        ? (drivers.find(d => d.name_acronym === acronym) ?? null)
        : null;
    });

    const tryId = jolpikaId;

    Promise.allSettled([
      p1,
      tryId ? getDriverInfo(tryId) : Promise.resolve(null),
      tryId ? getDriverSeasonResults(season, tryId) : Promise.resolve([]),
      tryId ? getDriverCareerStats(tryId) : Promise.resolve([]),
    ]).then(([r1, r2, r3, r4]) => {
      setOpenF1Driver(r1.status === 'fulfilled' ? r1.value : null);

      const jolpika = r2.status === 'fulfilled' ? r2.value : null;
      setJolpikaDriver(jolpika);

      const races = r3.status === 'fulfilled' ? r3.value : [];
      setSeasonResults(races);

      const career = r4.status === 'fulfilled' ? r4.value : [];
      const champTitles = career.filter(s =>
        s.DriverStandings?.[0]?.position === '1'
      ).length;
      setTitles(champTitles);
    }).finally(() => setLoading(false));
  }, [driverNumber, season]);

  if (loading) return <Loader />;

  const displayName = jolpikaDriver
    ? `${jolpikaDriver.givenName} ${jolpikaDriver.familyName}`
    : openF1Driver
    ? openF1Driver.full_name
    : driverNumber;

  const teamColor = openF1Driver?.team_colour
    ? `#${openF1Driver.team_colour}`
    : '#6b7280';

  const teamName = openF1Driver?.team_name
    ?? jolpikaDriver?.permanentNumber ? null : null;

  const wins2025 = seasonResults.filter(r => r.Results?.[0]?.position === '1').length;
  const points2025 = seasonResults.reduce((a, r) => a + parseFloat(r.Results?.[0]?.points ?? 0), 0);

  return (
    <div className="pb-4 space-y-4">
      {/* Back */}
      <Link to="/results/drivers" className="inline-flex items-center gap-1 text-f1-muted text-xs hover:text-white transition-colors">
        ← Classifica Piloti
      </Link>

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden border"
        style={{ borderColor: teamColor + '50' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${teamColor}20 0%, transparent 60%)` }}
        />
        <div className="h-0.5" style={{ backgroundColor: teamColor }} />

        <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="shrink-0">
            {openF1Driver?.headshot_url ? (
              <img
                src={openF1Driver.headshot_url}
                alt={displayName}
                className="w-28 h-28 rounded-2xl object-cover object-top border-2 border-f1-border shadow-xl"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white border-2"
                style={{ backgroundColor: teamColor + '30', borderColor: teamColor }}
              >
                {openF1Driver?.name_acronym ?? driverNumber.toUpperCase().slice(0, 3)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {(jolpikaDriver?.permanentNumber || openF1Driver?.driver_number) && (
              <span
                className="text-3xl font-black leading-none block mb-1"
                style={{ color: teamColor }}
              >
                #{jolpikaDriver?.permanentNumber ?? openF1Driver?.driver_number}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {displayName}
            </h1>
            {openF1Driver?.team_name && (
              <p className="text-white/50 text-sm mt-1">{openF1Driver.team_name}</p>
            )}
            {jolpikaDriver?.nationality && (
              <p className="text-white/30 text-xs mt-0.5">{jolpikaDriver.nationality}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Titoli" value={titles || '0'} />
        <StatCard label={`Vittorie ${season}`} value={wins2025} />
        <StatCard label={`Punti ${season}`} value={Math.round(points2025)} sub={points2025 > 0 ? 'PT' : null} />
        <StatCard label="GP Stagione" value={seasonResults.length} />
      </div>

      {/* Season results table */}
      {seasonResults.length > 0 ? (
        <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-f1-border">
            <h2 className="text-white font-bold text-sm">Risultati {season}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-f1-muted text-[10px] uppercase tracking-wider border-b border-f1-border">
                  <th className="text-left px-4 py-2">GP</th>
                  <th className="text-center px-2 py-2">Griglia</th>
                  <th className="text-center px-2 py-2">Pos</th>
                  <th className="text-right px-4 py-2">Pt</th>
                </tr>
              </thead>
              <tbody>
                {seasonResults.map(race => {
                  const r = race.Results?.[0];
                  const pos = r?.position;
                  const isDNF = r?.status && r.status !== 'Finished' && !r.status.startsWith('+');
                  return (
                    <tr key={race.round} className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="text-white text-xs font-medium leading-tight">
                          {race.raceName.replace(' Grand Prix', ' GP')}
                        </div>
                        <div className="text-f1-muted text-[10px]">{race.date}</div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-white/40 text-xs tabular-nums">
                        {r?.grid ?? '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`font-black text-sm tabular-nums ${
                          pos === '1' ? 'text-yellow-400' :
                          pos === '2' ? 'text-gray-300' :
                          pos === '3' ? 'text-amber-600' : 'text-white/70'
                        }`}>
                          {isDNF ? <span className="text-f1-muted text-xs">DNF</span> : (pos ?? '—')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-xs tabular-nums font-semibold ${
                          parseFloat(r?.points ?? 0) > 0 ? 'text-f1-red' : 'text-white/20'
                        }`}>
                          {r?.points ?? '0'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-f1-surface border border-f1-border rounded-2xl p-8 text-center">
          <p className="text-f1-muted text-sm">Nessun dato disponibile per questa stagione</p>
        </div>
      )}
    </div>
  );
};

export default DriverDetail;
