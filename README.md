# SELISE Raffle 2026 (9:16)

Extrem schlanke, lokale Web-Raffle-App fuer Office-Events (Touch/Click), optimiert fuer einen vertikalen 9:16 Screen.
Target-Display: **1080 x 1920** (Portrait, Fullscreen).
Die Experience ist als Multi-Screen Flow gebaut (Attract -> Draw -> Result) im modernen SELISE-Tech-Look.

## Starten

1. Dateien lokal im Browser oeffnen:
   - `index.html` direkt per Doppelklick oder ueber einen kleinen lokalen Static-Server.
2. Fuer den Event-Modus:
   - Browser auf Vollbild
   - Screen im Hochformat (9:16)

## Experience Flow (2026)

- **Attract Screen:** Hero-Message + Value Chips + klarer Tap-CTA
- **Draw Screen:** Rolling Number mit Orb-Rings, Progress-Bar und Motion
- **Result Screen:** Finale Ticketnummer in Hero-Groesse + direkter Next-Draw CTA

## Dateiuebersicht

- `index.html`: UI-Struktur und App-Container
- `styles.css`: 2026-style Design, Animationen, Page-Transitions, responsive 9:16 Styling
- `main.ts`: TypeScript-Quelle mit State-Machine, Ticketlogik, localStorage, Print-Hook, Rolling-Progress
- `main.js`: Laufzeitdatei fuer den Browser (wird von `index.html` geladen)

## Konfiguration

In `main.ts` (und fuer direktes Browser-Run auch in `main.js`) anpassen:

```ts
const raffleConfig = {
  startNumber: 1,
  maxTickets: 500, // null = unlimited
  animationDurationMs: 1800,
  rollingIntervalMs: 70
};
```

## Verhalten

- States: `idle` -> `rolling` -> `result` (`sold-out` wenn Startkontingent bereits leer ist)
- Ticketnummern laufen fortlaufend (`1, 2, 3, ...`)
- Naechste Nummer wird in `localStorage` persistiert
- Wenn `maxTickets` erreicht ist, wird die Ziehung deaktiviert

## Print-Hook

Beim finalen Ziehen wird immer `printTicket(ticketNumber)` aufgerufen.

Aktuell nur vorbereitet (Console-Output), spaeter fuer Bondrucker/API ersetzbar.
