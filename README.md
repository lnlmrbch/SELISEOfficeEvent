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
- It currently logs to `console`.
- Integrate your real printer logic in this function (receipt printer bridge / API).
