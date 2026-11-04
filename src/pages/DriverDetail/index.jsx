import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getLatestDrivers } from '../../services/openf1';
import { getDriverInfo, getDriverCareerResults } from '../../services/jolpica';
import { useSeason } from '../../contexts/SeasonContext';
import { useClinchedChampion } from '../../hooks/useChampion';
import { DRIVER_STATICS_2026 } from '../../utils/driverStatics2026';
import { WORLD_CHAMPIONS } from '../../utils/champions';
import { posColor } from '../../utils/teamColors';
import { summariseCareer, racesInSeason, isRetirement } from '../../utils/driverCareer';
import Skeleton, { SkeletonRows } from '../../components/ui/Skeleton';

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
  <div className="overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
    {accentColor && <div className="h-0.5" style={{ backgroundColor: accentColor }} />}
    <div className="flex divide-x divide-f1-border/50">
      {stats.map(({ label, value, gold }) => (
        <div key={label} className="min-w-0 flex-1 px-1 py-3 text-center">
          <div className={`text-xl font-black leading-none tabular-nums ${gold ? 'text-yellow-400' : 'text-white'}`}>
            {value ?? '—'}
          </div>
          <div className="mt-1 px-1 text-[9px] uppercase leading-tight tracking-wider text-f1-muted">
            {label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="mb-2 text-[10px] uppercase tracking-widest text-f1-muted">{children}</p>
);

/** Race-by-race table for a single season. */
const SeasonRaces = ({ races, season }) => (
  <div className="overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
    <div className="max-h-80 overflow-y-auto overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-f1-surface">
          <tr className="border-b border-f1-border text-[10px] uppercase tracking-wider text-f1-muted">
            <th className="px-4 py-2 text-left">GP</th>
            <th className="px-2 py-2 text-center">Griglia</th>
            <th className="px-2 py-2 text-center">Pos</th>
            <th className="px-4 py-2 text-right">Pt</th>
          </tr>
        </thead>
        <tbody>
          {races.map(race => {
            const r = race.Results?.[0];
            const pos = r?.position;
            return (
              <tr key={race.round} className="border-b border-f1-border/30 transition-colors hover:bg-f1-border/20">
                <td className="px-4 py-2.5">
                  <Link
                    to={`/gp/${season}/${race.round}`}
                    className="text-xs font-medium leading-tight text-white transition-colors hover:text-f1-red"
                  >
                    {race.raceName.replace(' Grand Prix', ' GP')}
                  </Link>
                  <div className="text-[10px] text-f1-muted">{race.date}</div>
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-white/40 tabular-nums">
                  {r?.grid === '0' ? 'PL' : (r?.grid ?? '—')}
                </td>
                <td className="px-2 py-2.5 text-center">
                  {isRetirement(r) ? (
                    <span className="text-xs font-semibold text-f1-muted">DNF</span>
                  ) : (
                    <span className={`text-sm font-black tabular-nums ${posColor(pos)}`}>{pos ?? '—'}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs font-semibold tabular-nums ${
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
);

/** One row per season raced — the only history a retired driver has on this page. */
const CareerSeasons = ({ seasons, highlight }) => (
  <div className="overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
    <div className="max-h-[26rem] overflow-y-auto overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-f1-surface">
          <tr className="border-b border-f1-border text-[10px] uppercase tracking-wider text-f1-muted">
            <th className="px-3 py-2 text-left sm:px-4">Anno</th>
            <th className="px-2 py-2 text-left">Scuderia</th>
            <th className="px-2 py-2 text-center">GP</th>
            <th className="px-2 py-2 text-center">Vitt.</th>
            {/* Podiums give way to points when the row cannot fit both */}
            <th className="hidden px-2 py-2 text-center xs:table-cell">Podi</th>
            <th className="px-3 py-2 text-right sm:px-4">Punti</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map(s => (
            <tr
              key={s.season}
              className={`border-b border-f1-border/30 transition-colors hover:bg-f1-border/20 ${
                s.season === highlight ? 'bg-f1-red/[0.07]' : ''
              }`}
            >
              <td className="px-3 py-2.5 text-xs font-bold text-white tabular-nums sm:px-4">{s.season}</td>
              <td className="max-w-[92px] truncate px-2 py-2.5 text-xs text-white/60 sm:max-w-[160px]">
                {s.teams.join(' / ')}
              </td>
              <td className="px-2 py-2.5 text-center text-xs text-white/60 tabular-nums">{s.races}</td>
              <td className="px-2 py-2.5 text-center">
                <span className={`text-xs font-bold tabular-nums ${s.wins > 0 ? 'text-yellow-400' : 'text-white/20'}`}>
                  {s.wins || '—'}
                </span>
              </td>
              <td className="hidden px-2 py-2.5 text-center xs:table-cell">
                <span className={`text-xs font-semibold tabular-nums ${s.podiums > 0 ? 'text-white/70' : 'text-white/20'}`}>
                  {s.podiums || '—'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right sm:px-4">
                <span className={`text-xs font-semibold tabular-nums ${s.points > 0 ? 'text-f1-red' : 'text-white/20'}`}>
                  {s.points}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DriverDetail = () => {
  const { driverNumber } = useParams();
  const { season } = useSeason();
  const navigate = useNavigate();
  // 'default' means this is the first entry in the history stack (deep link),
  // so there is nothing to go back to.
  const canGoBack = useLocation().key !== 'default';

  const [openF1Driver, setOpenF1Driver] = useState(null);
  const [jolpikaDriver, setJolpikaDriver] = useState(null);
  const [careerRaces, setCareerRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const isNumeric = /^\d+$/.test(driverNumber);
  const jolpikaId = isNumeric ? null : driverNumber;

  useEffect(() => {
    let cancelled = false;
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
      jolpikaId ? getDriverCareerResults(jolpikaId) : Promise.resolve([]),
    ]).then(([r1, r2, r3]) => {
      if (cancelled) return;
      setOpenF1Driver(r1.status === 'fulfilled' ? r1.value : null);
      setJolpikaDriver(r2.status === 'fulfilled' ? r2.value : null);
      setCareerRaces(r3.status === 'fulfilled' ? r3.value : []);
    }).finally(() => { if (!cancelled) setLoading(false); });

    // The career feed does not depend on the selected season — refetching it on every
    // season change would re-download a 400-race history to show a different slice.
    return () => { cancelled = true; };
  }, [driverNumber]);

  // Titles come from the static champions list rather than the API: Jolpica needs
  // one driverStandings request per season raced, which made this the page's heaviest
  // user of the rate limit and left the count showing a dash whenever it got throttled.
  const historicTitles = WORLD_CHAMPIONS.filter(c => c.driverId === jolpikaId).length;

  // That list only covers completed seasons, since mid-season the standings leader is
  // not champion yet. Add the running one once the title is mathematically decided.
  const clinchedChampionId = useClinchedChampion(season);
  const wonRunningSeason =
    season === new Date().getFullYear() &&
    clinchedChampionId != null &&
    clinchedChampionId === jolpikaId;
  const totalTitles = historicTitles + (wonRunningSeason ? 1 : 0);

  if (loading) {
    return (
      <div className="space-y-6 pb-4">
        <Skeleton className="h-3 w-20" />
        <div className="overflow-hidden rounded-3xl border border-f1-border bg-f1-surface/60">
          <div className="flex flex-col items-start gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <Skeleton className="h-28 w-28 flex-shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex divide-x divide-white/10 border-t border-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2 py-3">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-2 w-10" />
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
          <SkeletonRows rows={6} showAvatar={false} />
        </div>
      </div>
    );
  }

  const acronym = !isNumeric ? (JOLPIKA_ID_MAP[driverNumber] ?? null) : (openF1Driver?.name_acronym ?? null);
  const staticData = acronym ? DRIVER_STATICS_2026.get(acronym) : null;

  const displayName = jolpikaDriver
    ? `${jolpikaDriver.givenName} ${jolpikaDriver.familyName}`
    : openF1Driver?.full_name ?? staticData?.full_name ?? driverNumber;

  const headshotUrl = staticData?.headshot_url ?? openF1Driver?.headshot_url ?? null;
  const teamColorHex = openF1Driver?.team_colour ?? staticData?.team_colour ?? null;
  const teamColor = teamColorHex ? `#${teamColorHex}` : '#6b7280';

  const { seasons, totals } = summariseCareer(careerRaces);
  const selectedRaces = racesInSeason(careerRaces, season);
  // A driver only gets the race-by-race block for a season they actually raced, so a
  // 1980 champion no longer opens on an empty "Risultati 2026" table.
  const racedSelectedSeason = selectedRaces.length > 0;
  const selectedSummary = seasons.find(s => s.season === Number(season));

  return (
    <div className="space-y-6 pb-4">
      {canGoBack ? (
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-f1-muted transition-colors hover:text-white"
        >
          ← Indietro
        </button>
      ) : (
        <Link to="/results/drivers" className="inline-flex items-center gap-1 text-xs text-f1-muted transition-colors hover:text-white">
          ← Classifica Piloti
        </Link>
      )}

      <div className="relative overflow-hidden rounded-3xl border" style={{ borderColor: teamColor + '50' }}>
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${teamColor}20 0%, transparent 60%)` }}
        />
        <div className="h-0.5" style={{ backgroundColor: teamColor }} />

        <div className="relative z-10 flex flex-col items-start gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="shrink-0">
            {headshotUrl ? (
              <img
                src={headshotUrl}
                alt={displayName}
                className="h-28 w-28 rounded-2xl border-2 border-f1-border object-cover object-top shadow-xl"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 text-3xl font-black text-white"
                style={{ backgroundColor: teamColor + '30', borderColor: teamColor }}
              >
                {acronym ?? driverNumber.toUpperCase().slice(0, 3)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {(jolpikaDriver?.permanentNumber || openF1Driver?.driver_number) && (
              <span className="mb-1 block text-3xl font-black leading-none" style={{ color: teamColor }}>
                #{jolpikaDriver?.permanentNumber ?? openF1Driver?.driver_number}
              </span>
            )}
            <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              {displayName}
            </h1>
            {openF1Driver?.team_name && (
              <p className="mt-1 text-sm text-white/50">{openF1Driver.team_name}</p>
            )}
            {jolpikaDriver?.nationality && (
              <p className="mt-0.5 text-xs text-white/30">{jolpikaDriver.nationality}</p>
            )}
            {seasons.length > 0 && (
              <p className="mt-1 text-xs text-white/30 tabular-nums">
                {seasons[seasons.length - 1].season}–{seasons[0].season} · {seasons.length}{' '}
                {seasons.length === 1 ? 'stagione' : 'stagioni'}
              </p>
            )}
          </div>
        </div>

        {totals.races > 0 && (
          <div className="relative z-10 flex divide-x divide-white/10 border-t border-white/10">
            {[
              { label: 'Titoli', value: totalTitles, gold: totalTitles > 0 },
              { label: 'GP', value: totals.races },
              { label: 'Vittorie', value: totals.wins },
              { label: 'Podi', value: totals.podiums },
              { label: 'Pole', value: totals.poles },
            ].map(({ label, value, gold }) => (
              <div key={label} className="min-w-0 flex-1 px-1 py-3 text-center">
                <div className={`text-xl font-black leading-none tabular-nums ${gold ? 'text-yellow-400' : 'text-white'}`}>
                  {value ?? '—'}
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-wider text-white/35">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {racedSelectedSeason && (
        <>
          <section>
            <SectionLabel>Stagione {season}</SectionLabel>
            <StatStrip
              stats={[
                { label: 'GP', value: selectedSummary.races },
                { label: 'Vittorie', value: selectedSummary.wins },
                { label: 'Podi', value: selectedSummary.podiums },
                { label: 'Pole', value: selectedSummary.poles },
                { label: 'Punti', value: Math.round(selectedSummary.points) },
              ]}
            />
          </section>

          <section>
            <SectionLabel>Risultati {season}</SectionLabel>
            <SeasonRaces races={selectedRaces} season={season} />
          </section>
        </>
      )}

      <section>
        <SectionLabel>
          {racedSelectedSeason ? 'Tutte le stagioni' : 'Stagioni in carriera'}
        </SectionLabel>
        {seasons.length > 0 ? (
          <CareerSeasons seasons={seasons} highlight={racedSelectedSeason ? Number(season) : null} />
        ) : (
          <div className="rounded-2xl border border-f1-border bg-f1-surface p-8 text-center">
            <p className="text-sm text-f1-muted">Nessun dato di carriera disponibile</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DriverDetail;
