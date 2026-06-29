import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLatestDrivers } from '../../services/openf1';
import {
  getDriverInfo,
  getDriverSeasonResults,
  getDriverCareerSummary,
  getDriverTitles,
} from '../../services/jolpica';
import { useSeason } from '../../contexts/SeasonContext';
import { DRIVER_STATICS_2026 } from '../../utils/driverStatics2026';
import Loader from '../../components/ui/Loader';

const JOLPIKA_ID_MAP = {
  'norris': 'NOR', 'max_verstappen': 'VER', 'piastri': 'PIA',
  'russell': 'RUS', 'leclerc': 'LEC', 'hamilton': 'HAM',
  'antonelli': 'ANT', 'albon': 'ALB', 'sainz': 'SAI',
  'alonso': 'ALO', 'stroll': 'STR', 'gasly': 'GAS',
  'doohan': 'DOO', 'tsunoda': 'TSU', 'lawson': 'LAW',
  'hulkenberg': 'HUL', 'bearman': 'BEA', 'bortoleto': 'BOR',
  'ocon': 'OCO', 'hadjar': 'HAD', 'colapinto': 'COL',
};

const StatStrip = ({ stats, accentColor }) => (
  <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
    {accentColor && <div className="h-0.5" style={{ backgroundColor: accentColor }} />}
    <div className="flex divide-x divide-f1-border/50">
      {stats.map(({ label, value, gold }) => (
        <div key={label} className="flex-1 py-3 px-1 text-center min-w-0">
          <div className={`text-xl font-black tabular-nums leading-none ${gold ? 'text-yellow-400' : 'text-white'}`}>
            {value ?? '—'}
          </div>
          <div className="text-f1-muted text-[9px] mt-1 uppercase tracking-wider leading-tight px-1">
            {label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const posColor = p => p === '1' ? 'text-yellow-400' : p === '2' ? 'text-gray-300' : p === '3' ? 'text-amber-600' : 'text-white/70';

const DriverDetail = () => {
  const { driverNumber } = useParams();
  const { season } = useSeason();
  const [openF1Driver, setOpenF1Driver] = useState(null);
  const [jolpikaDriver, setJolpikaDriver] = useState(null);
  const [seasonResults, setSeasonResults] = useState([]);
  const [career, setCareer] = useState(null);
  const [titles, setTitles] = useState(null);
  const [loading, setLoading] = useState(true);

  const isNumeric = /^\d+$/.test(driverNumber);
  const jolpikaId = isNumeric ? null : driverNumber;

  useEffect(() => {
    setLoading(true);

    const p1 = getLatestDrivers().then(drivers => {
      if (isNumeric) {
        return drivers.find(d => String(d.driver_number) === driverNumber) ?? null;
      }
      const acronym = JOLPIKA_ID_MAP[driverNumber];
      return acronym ? (drivers.find(d => d.name_acronym === acronym) ?? null) : null;
    });

    Promise.allSettled([
      p1,
      jolpikaId ? getDriverInfo(jolpikaId) : Promise.resolve(null),
      jolpikaId ? getDriverSeasonResults(season, jolpikaId) : Promise.resolve([]),
      jolpikaId ? getDriverCareerSummary(jolpikaId) : Promise.resolve(null),
      jolpikaId ? getDriverTitles(jolpikaId) : Promise.resolve(0),
    ]).then(([r1, r2, r3, r4, r5]) => {
      setOpenF1Driver(r1.status === 'fulfilled' ? r1.value : null);
      setJolpikaDriver(r2.status === 'fulfilled' ? r2.value : null);
      setSeasonResults(r3.status === 'fulfilled' ? r3.value : []);
      setCareer(r4.status === 'fulfilled' ? r4.value : null);
      setTitles(r5.status === 'fulfilled' ? r5.value : 0);
    }).finally(() => setLoading(false));
  }, [driverNumber, season]);

  if (loading) return <Loader />;

  // Static fallback for photo/color when OpenF1 is rate-limited
  const acronym = !isNumeric ? (JOLPIKA_ID_MAP[driverNumber] ?? null) : (openF1Driver?.name_acronym ?? null);
  const staticData = acronym ? DRIVER_STATICS_2026.get(acronym) : null;

  const displayName = jolpikaDriver
    ? `${jolpikaDriver.givenName} ${jolpikaDriver.familyName}`
    : openF1Driver?.full_name ?? staticData?.full_name ?? driverNumber;

  const headshotUrl = openF1Driver?.headshot_url ?? staticData?.headshot_url ?? null;
  const teamColorHex = openF1Driver?.team_colour ?? staticData?.team_colour ?? null;
  const teamColor = teamColorHex ? `#${teamColorHex}` : '#6b7280';

  // Career stats — from getDriverCareerSummary (MRData.total counts, no pagination needed)
  const careerRaces = career?.races ?? 0;
  const careerWins = career?.wins ?? 0;
  const careerPodiums = career?.podiums ?? 0;
  const careerPoles = career?.poles ?? 0;

  // Season stats
  const seasonRaces = seasonResults.length;
  const seasonWins = seasonResults.filter(r => r.Results?.[0]?.position === '1').length;
  const seasonPodiums = seasonResults.filter(r => parseInt(r.Results?.[0]?.position ?? 99) <= 3).length;
  const seasonPoles = seasonResults.filter(r => r.Results?.[0]?.grid === '1').length;
  const seasonPoints = Math.round(seasonResults.reduce((a, r) => a + parseFloat(r.Results?.[0]?.points ?? 0), 0));

  return (
    <div className="pb-4 space-y-6">
      {/* Back */}
      <Link to="/results/drivers" className="inline-flex items-center gap-1 text-f1-muted text-xs hover:text-white transition-colors">
        ← Classifica Piloti
      </Link>

      {/* Hero + career stats */}
      <div className="relative rounded-3xl overflow-hidden border" style={{ borderColor: teamColor + '50' }}>
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${teamColor}20 0%, transparent 60%)` }}
        />
        <div className="h-0.5" style={{ backgroundColor: teamColor }} />

        {/* Identity row */}
        <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="shrink-0">
            {headshotUrl ? (
              <img
                src={headshotUrl}
                alt={displayName}
                className="w-28 h-28 rounded-2xl object-cover object-top border-2 border-f1-border shadow-xl"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white border-2"
                style={{ backgroundColor: teamColor + '30', borderColor: teamColor }}
              >
                {acronym ?? driverNumber.toUpperCase().slice(0, 3)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {(jolpikaDriver?.permanentNumber || openF1Driver?.driver_number) && (
              <span className="text-3xl font-black leading-none block mb-1" style={{ color: teamColor }}>
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

        {/* Career stats — inside hero, below identity */}
        {careerRaces > 0 && (
          <div className="relative z-10 border-t border-white/10 flex divide-x divide-white/10">
            {[
              { label: 'Titoli', value: titles ?? '…', gold: (titles ?? 0) > 0 },
              { label: 'GP', value: careerRaces },
              { label: 'Vittorie', value: careerWins },
              { label: 'Podi', value: careerPodiums },
              { label: 'Pole', value: careerPoles },
            ].map(({ label, value, gold }) => (
              <div key={label} className="flex-1 py-3 px-1 text-center min-w-0">
                <div className={`text-xl font-black tabular-nums leading-none ${gold ? 'text-yellow-400' : 'text-white'}`}>
                  {value}
                </div>
                <div className="text-white/35 text-[9px] mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Season stats */}
      {seasonRaces > 0 && (
        <section>
          <p className="text-f1-muted text-[10px] uppercase tracking-widest mb-2">Stagione {season}</p>
          <StatStrip
            stats={[
              { label: 'GP', value: seasonRaces },
              { label: 'Vittorie', value: seasonWins },
              { label: 'Podi', value: seasonPodiums },
              { label: 'Pole', value: seasonPoles },
              { label: 'Punti', value: seasonPoints },
            ]}
          />
        </section>
      )}

      {/* Season results table */}
      <section>
        <p className="text-f1-muted text-[10px] uppercase tracking-widest mb-2">Risultati {season}</p>
        {seasonResults.length > 0 ? (
          <div className="bg-f1-surface border border-f1-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-80">
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
                      <tr
                        key={race.round}
                        className="border-b border-f1-border/30 hover:bg-f1-border/20 transition-colors cursor-pointer"
                        onClick={() => {}}
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/gp/${season}/${race.round}`}
                            className="text-white text-xs font-medium leading-tight hover:text-f1-red transition-colors"
                          >
                            {race.raceName.replace(' Grand Prix', ' GP')}
                          </Link>
                          <div className="text-f1-muted text-[10px]">{race.date}</div>
                        </td>
                        <td className="px-2 py-2.5 text-center text-white/40 text-xs tabular-nums">
                          {r?.grid === '0' ? 'PL' : (r?.grid ?? '—')}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          {isDNF ? (
                            <span className="text-f1-muted text-xs font-semibold">DNF</span>
                          ) : (
                            <span className={`font-black text-sm tabular-nums ${posColor(pos)}`}>
                              {pos ?? '—'}
                            </span>
                          )}
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
      </section>
    </div>
  );
};

export default DriverDetail;
