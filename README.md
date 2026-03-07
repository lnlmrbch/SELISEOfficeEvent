# SELISE Raffle 2026

Premium 9:16 raffle experience for the SELISE Group Office Event 2026.
Built with Vite + React + TypeScript + Tailwind CSS + Framer Motion.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production bundle is generated in `dist/`.

## GitHub Pages Deployment

This project is configured for GitHub Pages at:

`https://lnlmrbch.github.io/SELISEOfficeEvent/`

### One-time setup on GitHub

1. Open repository **Settings** -> **Pages**
2. Set **Source** to **GitHub Actions**

### Deploy flow

- Push to `main`
- GitHub Action `.github/workflows/deploy.yml` builds and deploys `dist/`

## Configuration

Edit `src/config/raffleConfig.ts`:

- `startNumber`
- `maxTickets`
- `animationDurationMs`

## Print Integration Hook

The print hook is in `src/utils/printTicket.ts`.

- It is called exactly once after each successful draw.
- It calls the local print service at `http://127.0.0.1:17890` (override via localStorage key `selise-raffle-print-service-url`).
- It stores:
  - `selise-raffle-last-printed`
  - `selise-raffle-last-print-error`

## Lokaler Silent Print Service (SOT)

Ein lokaler Service fuer RAW ESC/POS Druck liegt unter:

- `print-service/`

Start:

```bash
cd print-service
npm i
npm run build
npm run start
```

Der Service bietet:

- `GET /health`
- `GET /config`
- `GET /printers`
- `POST /printer/select` (deaktiviert, Antwort 403)
- `POST /print`
- `POST /test-print`

Druckerwahl erfolgt lokal im Service ueber `print-service/data/config.json` (`printerSharePath`), nicht ueber das Frontend.

## Admin Overlay (4x Tap oben links)

Im versteckten Overlay sind Print-Setup und Debug enthalten:

- Print Service URL lesen/aendern
- Health Check (Connected/Disconnected)
- Anzeige des aktuell gesetzten `printerSharePath`
- Drucker laden
- Nur Read-Only Druckerliste (keine Auswahl im Frontend)
- Testdruck
- Letzte gedruckte Nummer
- Letzter Error
- Mixed-Content Hinweis fuer HTTPS -> HTTP Browser-Blocker
