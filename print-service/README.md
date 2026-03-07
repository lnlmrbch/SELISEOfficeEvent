# SELISE Local Print Service (SOT)

Lokaler Silent-Print-Service fuer den Event-Kiosk auf dem SOT (Windows), optimiert fuer EPSON TM-M30 via USB und RAW ESC/POS.

## Zweck

- Kein Browser-Printdialog
- Frontend ruft lokal `127.0.0.1` auf
- Service sendet RAW ESC/POS ueber Windows Spooler an einen lokal konfigurierten UNC-Druckerpfad
- Keine native Node Printer Library (`printer`) mehr
- Jeder Druck wird immer als 2 separate Belege ausgegeben (Abgabe + Auslosung)

## Endpoints

- `GET /health` -> `{ ok: true, version: "1.0.0" }`
- `GET /config` -> `{ ok: true, printerSharePath, printerDisplayName, eventName }`
- `GET /printers` -> `{ ok: true, printers: string[] }`
- `POST /printer/select` ist absichtlich deaktiviert (403), da Druckerwahl nur lokal ueber Config erfolgt
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
- Muss lokal gepflegt werden (nicht via Frontend):
  - `printerSharePath` (z.B. `\\localhost\\EPSON_TM_M30`)
  - `printerDisplayName` (nur Doku/Anzeige)
  - `eventName` (optional, Default Header auf Bon)

## Setup (Windows / Eventbetrieb)

1. EPSON TM-M30 Treiber installieren
2. Drucker per USB verbinden und in Windows sichtbar machen
3. Drucker freigeben und als UNC erreichbar machen (z.B. `\\localhost\\EPSON_TM_M30`)
4. `data/config.json` setzen:

```json
{
  "printerSharePath": "\\\\localhost\\\\EPSON_TM_M30",
  "printerDisplayName": "EPSON TM-M30",
  "eventName": "SELISE OFFICE EVENT 2026"
}
```
5. Cutter/Papierbreite am Geraet korrekt konfigurieren (typisch 80mm, Auto-Cut aktiv)

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
