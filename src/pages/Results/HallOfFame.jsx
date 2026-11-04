import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverPhotos } from '../../hooks/useDriverPhotos';
import { useClinchedChampionEntry } from '../../hooks/useChampion';
import { WORLD_CHAMPIONS } from '../../utils/champions';
import { getTeamColor, posColor } from '../../utils/teamColors';
import { getFlagUrlByNationality } from '../../utils/flags';

const CURRENT_YEAR = new Date().getFullYear();
const shortTeam = (name = '') => name.replace('F1 Team', '').replace(' F1', '').trim();

/** One row per driver, titles collected, ranked by how many they won. */
const buildHallOfFame = (seasons) => {
  const byDriver = new Map();

  for (const row of seasons) {
    let entry = byDriver.get(row.driverId);
    if (!entry) {
      entry = {
        driverId: row.driverId,
        code: row.code,
        givenName: row.givenName,
        familyName: row.familyName,
        nationality: row.nationality,
        titles: [],
      };
      byDriver.set(row.driverId, entry);
    }
    entry.titles.push({
      season: row.season,
      constructorId: row.constructorId,
      constructorName: row.constructorName,
    });
  }

  const list = [...byDriver.values()];
  for (const e of list) e.titles.sort((a, b) => a.season - b.season);

  // Most titles first; between drivers on equal titles, the most recent champion leads.
  list.sort((a, b) =>
    b.titles.length - a.titles.length ||
    b.titles[b.titles.length - 1].season - a.titles[a.titles.length - 1].season
  );

  // Standard competition ranking: drivers on equal titles share a position.
  let rank = 0;
  let previous = null;
  return list.map((e, i) => {
    if (e.titles.length !== previous) { rank = i + 1; previous = e.titles.length; }
    return { ...e, rank };
  });
};

const HallOfFame = () => {
  const navigate = useNavigate();
  const photoMap = useDriverPhotos();
  const [query, setQuery] = useState('');

  // The static file covers completed seasons. The running one is added as soon as
  // the title is mathematically settled, so the list is never a year out of date.
  const running = useClinchedChampionEntry(CURRENT_YEAR);
  const seasons = [...WORLD_CHAMPIONS];
  if (running && !seasons.some(s => s.season === CURRENT_YEAR)) {
    const d = running.Driver;
    seasons.push({
      season: CURRENT_YEAR,
      driverId: d.driverId,
      code: d.code ?? null,
      givenName: d.givenName,
      familyName: d.familyName,
      nationality: d.nationality,
      constructorId: running.Constructors?.[0]?.constructorId ?? '',
      constructorName: running.Constructors?.[0]?.name ?? '',
    });
  }

  const champions = buildHallOfFame(seasons);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? champions.filter(c =>
        `${c.givenName} ${c.familyName}`.toLowerCase().includes(needle) ||
        c.nationality.toLowerCase().includes(needle) ||
        c.titles.some(t =>
          String(t.season).includes(needle) ||
          t.constructorName.toLowerCase().includes(needle)
        ))
    : champions;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Albo d'oro</h1>
          <p className="text-xs text-f1-muted">
            {champions.length} piloti · {seasons.length} titoli dal {seasons[0].season}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cerca pilota, anno o scuderia…"
          className="rounded-xl border border-f1-border bg-f1-surface px-3 py-2 text-xs text-white transition-colors placeholder:text-f1-muted focus:border-f1-red/60 focus:outline-none sm:max-w-[240px]"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-f1-border bg-f1-surface">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-f1-muted">
            Nessun campione corrisponde a "{query}"
          </p>
        ) : (
          <div className="divide-y divide-f1-border/30">
            {visible.map(c => {
              const lastTitle = c.titles[c.titles.length - 1];
              const teamColor = getTeamColor(lastTitle.constructorId);
              const photo = c.code ? photoMap.get(c.code) : null;
              const flagUrl = getFlagUrlByNationality(c.nationality);

              return (
                <div
                  key={c.driverId}
                  onClick={() => navigate(`/driver/${c.driverId}`)}
                  className="flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-f1-border/20 sm:px-4"
                >
                  <span className={`w-6 flex-shrink-0 text-right text-base font-black tabular-nums ${posColor(c.rank)}`}>
                    {c.rank}
                  </span>

                  <div className="h-9 w-0.5 flex-shrink-0 rounded-full" style={{ backgroundColor: teamColor }} />

                  {photo?.headshot_url ? (
                    <img
                      src={photo.headshot_url}
                      alt={c.familyName}
                      className="h-9 w-9 flex-shrink-0 rounded-full bg-f1-border object-cover object-top"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: teamColor + '40' }}
                    >
                      {c.givenName[0]}{c.familyName[0]}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {flagUrl && (
                        <img
                          src={flagUrl}
                          alt={c.nationality}
                          title={c.nationality}
                          className="h-3 w-5 flex-shrink-0 rounded-sm object-cover"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <span className="truncate text-sm font-semibold text-white">
                        {c.givenName} {c.familyName}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.titles.map(t => (
                        <span
                          key={t.season}
                          title={t.constructorName}
                          className={`rounded px-1.5 py-px text-[10px] font-semibold tabular-nums ${
                            t.season === CURRENT_YEAR
                              ? 'bg-f1-red/15 text-f1-red'
                              : 'bg-white/[0.06] text-white/45'
                          }`}
                        >
                          {t.season}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-black leading-none text-white tabular-nums">
                      {c.titles.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-f1-muted">
                      {c.titles.length === 1 ? 'titolo' : 'titoli'}
                    </div>
                    <div className="mt-0.5 hidden max-w-[110px] truncate text-[10px] text-white/30 sm:block">
                      {shortTeam(lastTitle.constructorName)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HallOfFame;
