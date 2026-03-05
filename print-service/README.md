# SELISE Local Print Service (SOT)

Lokaler Silent-Print-Service fuer den Event-Kiosk auf dem SOT (Windows), optimiert fuer EPSON TM-M30 via USB und RAW ESC/POS.

## Zweck

- Kein Browser-Printdialog
- Frontend ruft lokal `127.0.0.1` auf
- Service sendet RAW ESC/POS direkt an den gewaehlten Drucker

## Endpoints

- `GET /health` -> `{ ok: true, version: "1.0.0" }`
- `GET /printers` -> `{ ok: true, printers: string[] }`
- `POST /printer/select` Body `{ printerName: string }`
- `POST /print` Body `{ ticketNumber: number, eventName?: string, issuedAt?: string }`
- `POST /test-print`

## Netzwerk / Security

- HTTP bindet nur lokal auf `127.0.0.1:17890`
- CORS ist auf `origin: "*"` gesetzt, weil der Service nur lokal gebunden ist
- Optional HTTPS:
  - Lege Zertifikate unter `print-service/certs/key.pem` und `print-service/certs/cert.pem` ab
  - Dann startet zusaetzlich `https://127.0.0.1:17891`

## Konfiguration

- Datei: `data/config.json`
- Wird automatisch erstellt, falls nicht vorhanden
- Speichert den ausgewaehlten Drucker:
  - `selectedPrinterName`

## Setup (Windows / Eventbetrieb)

1. EPSON TM-M30 Treiber installieren
2. Drucker per USB verbinden und in Windows sichtbar machen
3. Windows Druckername pruefen (muss mit `/printers` erscheinen)
4. Cutter/Papierbreite am Geraet korrekt konfigurieren (typisch 80mm, Auto-Cut aktiv)

## Starten

```bash
npm i
npm run build
npm run start
```

## Autostart fuer Event

Optional ueber Windows Task Scheduler:

- Trigger: `At logon`
- Action: `npm run start` im Ordner `print-service`
- Option: mit hoechsten Rechten starten

## Hinweise fuer HTTPS Frontend

Wenn die Raffle-App von HTTPS (GitHub Pages) geladen wird, kann der Browser HTTP-Aufrufe blockieren.

Moegliche Loesungen:

- Print Service URL im Admin Overlay auf `https://127.0.0.1:17891` setzen (wenn Zertifikate vorhanden)
- oder Kiosk Policy fuer diese Seite auf `Allow insecure content` setzen
