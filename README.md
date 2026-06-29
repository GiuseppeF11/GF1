# GF1

> Ultimo aggiornamento: 29 giugno 2026

---

## Stack tecnico

| Tecnologia | Versione |
|---|---|
| React | 18 |
| Vite | 5 |
| Tailwind CSS | 3 |
| React Router DOM | 6 |
| Axios | — |

---

## Fonti dati

### OpenF1 — `https://api.openf1.org/v1/`
Usata per dati in tempo reale: sessioni, posizioni, lap times, foto piloti, colori team.
**Nota critica:** soggetta a rate-limit 429, specialmente a freddo. Tutti i componenti gestiscono `.catch(() => [])` come fallback.

Endpoint attivi:
- `/meetings?year=` — calendario GP
- `/sessions?meeting_key=` — sessioni per meeting (P1/P2/P3/Q/Sprint/Race)
- `/sessions?year=` — tutte le sessioni dell'anno (usato da `useLiveSession`)
- `/drivers?session_key=` — foto e colori team
- `/position?session_key=` — posizioni finali sessione
- `/intervals?session_key=` — gap tra piloti in tempo reale (usato in live mode)
- `/laps?session_key=` — giri per calcolo best lap (practice)

### Jolpica-F1 — `https://api.jolpi.ca/ergast/f1/`
Usata per dati ufficiali e storico: standings, risultati gara, carriera piloti.
Affidabile, nessun rate-limit rilevato.

Endpoint attivi:
- `/{year}/driverStandings.json`
- `/{year}/constructorStandings.json`
- `/{year}/{round}/results.json`
- `/{year}/{round}/qualifying.json`
- `/drivers/{driverId}.json`
- `/drivers/{driverId}/results.json?limit=1000` — tutti i risultati di carriera
- `/drivers/{driverId}/driverStandings.json?limit=100` — tutti i campionati (titoli)

---

## Routing

```
/                        → Home
/schedule                → Calendario completo
/results                 → redirect → /results/races
  /results/races         → Risultati per sessione (dropdown GP + sessione)
  /results/drivers       → Classifica piloti con foto
  /results/teams         → Classifica scuderie
/gp/:year/:round         → Dettaglio singolo GP (sessioni + risultati)
/driver/:driverNumber    → Scheda pilota (foto, stats, risultati stagione)
*                        → redirect → /
```

---

## Struttura file

```
src/
├── App.jsx
├── contexts/
│   └── SeasonContext.jsx
├── services/
│   ├── openf1.js        # getMeetings, getSessions, getDrivers, getPositions,
│   │                    # getLaps, getIntervals, getFinalPositions, getLatestDrivers
│   └── jolpica.js       # getSeasonSchedule, getRaceResults, getQualifyingResults,
│                        # getDriverStandings, getConstructorStandings
├── hooks/
│   ├── useDriverPhotos.js      # Foto piloti con cache localStorage + static fallback
│   ├── useSessionResults.js    # Risultati per session_key, con supporto live (polling 15s)
│   ├── useSchedule.js          # Calendario Jolpica + helper getRaceSessions
│   ├── useCurrentSeason.js     # Meeting e sessione corrente da OpenF1
│   ├── useStandings.js         # Classifiche piloti e costruttori
│   └── useLiveSession.js       # Rileva sessione attiva, polling 30s
├── utils/
│   ├── driverStatics2026.js    # Map statica 22 piloti 2026 con URL foto F1 CDN
│   ├── flags.js                # getFlagUrl(country) → URL bandiera
│   └── time.js                 # toItalianTime, toItalianDate, isPast, formatGPWeekend
├── components/
│   ├── layout/
│   │   ├── Header.jsx          # Brand + Live indicator + selector stagione
│   │   ├── BottomNav.jsx       # Nav mobile (Home/Calendario/Risultati)
│   │   └── Footer.jsx
│   └── ui/
│       ├── ResultsTable.jsx    # Tabella risultati riutilizzabile (Race/Quali/Practice)
│       ├── GPCard.jsx
│       ├── CountdownTimer.jsx
│       ├── Loader.jsx
│       └── SessionPicker.jsx
└── pages/
    ├── Home/index.jsx          # Hero prossimo GP + ultima sessione + classifiche
    ├── Schedule/index.jsx
    ├── Results/
    │   ├── index.jsx
    │   ├── Races.jsx
    │   ├── Drivers.jsx
    │   └── Teams.jsx
    ├── GPDetail/index.jsx      # Carosello sessioni + risultati con live mode
    └── DriverDetail/index.jsx  # Hero + stats carriera + stats stagione + risultati stagione
```

---

## Componente chiave: `useLiveSession`

Rileva se c'è una sessione F1 attiva in questo momento.

1. **Pre-check Jolpica** — verifica prima via calendario (nessuna API call OpenF1) se siamo in un weekend di gara. Se non lo siamo, restituisce `isLive: false` senza chiamare OpenF1.
2. **Check OpenF1** — se siamo in un weekend, chiama `/sessions?year=` e trova la sessione con `date_start ≤ now ≤ date_end`.
3. **Polling ogni 30s** — si aggiorna automaticamente.
4. **Ritorna** `{ isLive, liveSession, year, round }` — `round` è già quello Jolpica per la navigazione diretta a `/gp/:year/:round`.

---

## Componente chiave: `useSessionResults`

Gestisce tre branch separati in base al tipo di sessione, con supporto modalità live.

### Modalità live (`isLive=true`)
- **Race / Sprint / Qualifying**: bypassa Jolpica (nessun dato disponibile durante la sessione) e usa OpenF1 `/position` + `/intervals` → posizioni correnti + gap al leader in tempo reale.
- **Practice**: già basata su OpenF1, stessa logica ma con polling attivo.
- **Polling**: `setInterval(poll, 15_000)` — aggiornamento silenzioso ogni 15s (niente spinner, niente flicker).

### Modalità normale (sessione completata)
- **Practice**: OpenF1 `/position` + `/laps` → best lap per pilota formattato `M:SS.mmm`
- **Race / Sprint**: Jolpica `results.json` → risultati ufficiali con DNF/punti
- **Qualifying / Sprint Qualifying**: Jolpica `qualifying.json` → miglior Q time (Q3 → Q2 → Q1)

---

## Pagina Home

Tre sezioni principali nell'ordine:

1. **Hero prossimo GP** — card grande con bandiera sfumata, countdown live, badge sessioni. Cliccabile → `/gp/:year/:round`.
   - `nextRace` si basa sulla **data calendario** (`r.date >= todayStr`), non sull'ora della gara. Il GP corrente rimane visibile per tutta la domenica; dal lunedì si vede il successivo.
2. **Ultima sessione** — risultati compatti della sessione più recente (top 5 + link "mostra tutti"). Posizionata **prima** delle classifiche.
3. **Classifiche + Prossimi GP** — layout a due colonne su desktop:
   - Sinistra: tab Piloti/Scuderie, top 5 di default, bottone "Mostra tutti →" / "Mostra meno ↑" **dentro la card**.
   - Destra: prossimi 4 GP, bottone "+N altri GP →" nel footer della card.
   - Nessun `overflow-y-auto` sulle sezioni → no scroll trap su mobile.

---

## Pagina GPDetail (`/gp/:year/:round`)

- **Header** con bandiera sfumata, nome GP, circuito, date weekend.
- **Carosello sessioni** — `flex overflow-x-auto`, card compatte stile home page (`rounded-xl`, `min-w-[58px]`).
  - Sessioni future: opache, non cliccabili.
  - Sessioni passate: cliccabili, mostrano i risultati nel pannello.
  - Sessione attiva: bordo rosso, badge "● Live" lampeggiante. Auto-selezionata al caricamento.
- **Auto-selezione**: preferisce la sessione attiva (`date_start ≤ now ≤ date_end`), fallback all'ultima completata.
- **Pannello risultati**: badge "● LIVE" accanto al titolo quando la sessione è in corso. Risultati aggiornati ogni 15s.

---

## Header — Indicatore Live

`LiveIndicator` nel Header (prima del selettore stagione):
- **Live attivo**: pallino rosso `animate-ping` + testo "LIVE", click → `/gp/:year/:round` corrente.
- **Live spento**: pallino grigio opaco, click → tooltip "Nessuna sessione in corso" per 3s.
- Non occupa spazio visivo eccessivo; usa il pre-check Jolpica per evitare polling OpenF1 fuori dai weekend.

---

## Componente chiave: `useDriverPhotos`

1. **Stato iniziale immediato** — carica `DRIVER_STATICS_2026` senza API call.
2. **Cache localStorage** (`gf1_driver_photos_v4`).
3. **Flag `fetchAttempted`** — previene richieste duplicate o retry in caso di 429.
4. **Merge** — dati live OpenF1 sovrapposti alla mappa statica.

**URL pattern F1 CDN:**
```
https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/{DIR}/{CODE}_{Name}/{code}.png.transform/1col/image.png
```

---

## Problemi noti / Limitazioni

| Problema | Causa | Stato |
|---|---|---|
| OpenF1 429 su cold start | Rate limiting API pubblica | Mitigato con static map + `fetchAttempted` flag |
| Foto piloti sostituti (BEA, IWA, ecc.) | URL non ancora pubblicati da F1 | Fallback: div colorato con acronimo |
| `DriverDetail` non funziona con numero pilota numerico OpenF1 | Mismatch ID numerico vs jolpikaId | Non bloccante |
| Practice live: se OpenF1 è down, colonna Tempo mostra `—` | `/laps` non disponibile | Gestito gracefully |
| Live qualifying: mostra posizioni + gap invece dei tempi Q | OpenF1 non espone tempi Q in real-time | Accettabile come MVP live |

---

## Pagina DriverDetail (`/driver/:driverNumber`)

Tre sezioni distinte:

1. **Hero** — foto, numero, nome, team, nazionalità. Colori dinamici dal team OpenF1.
2. **Carriera** — 5 stat card: Titoli (dorata se > 0), GP Disputati, Vittorie, Podi, Pole Position. Da `getDriverAllResults` (tutti i risultati di carriera) + `getDriverAllStandings` (tutti i campionati). Pole = `grid === '1'`.
3. **Stagione `{year}`** — 5 stat card: GP Disputati, Vittorie, Podi, Pole, Punti. Derivate da `getDriverSeasonResults`.
4. **Risultati `{year}`** — tabella GP con colonne Griglia / Pos / Punti. GP cliccabili → `/gp/:year/:round`. Grid `'0'` mostrato come `PL` (pit lane start).

---

## Possibili next steps

- [ ] Pagina 404 dedicata
- [ ] Dettaglio pilota accessibile da numero OpenF1 (mapping numerico → jolpikaId)
- [ ] Info circuito nel dettaglio GP (lunghezza, giri, record lap)
- [ ] Filtro GP passati/futuri nel calendario
- [ ] PWA / installabilità (manifest, service worker)
- [ ] Live qualifying: mostrare tempi Q in tempo reale (richiede endpoint OpenF1 aggiuntivo)
- [ ] Pit stop in tempo reale durante gara live
