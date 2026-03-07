import cors from "cors";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import { execFile } from "node:child_process";
const EscPosEncoder = require("esc-pos-encoder");

const VERSION = "1.0.0";
const HOST = "127.0.0.1";
const HTTP_PORT = 17890;
const HTTPS_PORT = 17891;
const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");
const CERTS_DIR = path.resolve(process.cwd(), "certs");
const KEY_PATH = path.join(CERTS_DIR, "key.pem");
const CERT_PATH = path.join(CERTS_DIR, "cert.pem");

interface ServiceConfig {
  printerSharePath: string;
  printerDisplayName: string;
  eventName: string;
}

interface PrintBody {
  ticketNumber?: number;
  eventName?: string;
  issuedAt?: string;
}

function withConfiguredPathError(message: string, config: ServiceConfig): string {
  const currentValue = config.printerSharePath.trim() || "(leer)";
  return `${message} Aktuell gesetzt: ${currentValue}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function ensureConfig(): ServiceConfig {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    const initial: ServiceConfig = { printerSharePath: "", printerDisplayName: "", eventName: "SELISE OFFICE EVENT 2026" };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ServiceConfig>;
    return {
      printerSharePath: typeof parsed.printerSharePath === "string" ? parsed.printerSharePath : "",
      printerDisplayName: typeof parsed.printerDisplayName === "string" ? parsed.printerDisplayName : "",
      eventName: typeof parsed.eventName === "string" ? parsed.eventName : "SELISE OFFICE EVENT 2026",
    };
  } catch {
    const fallback: ServiceConfig = { printerSharePath: "", printerDisplayName: "", eventName: "SELISE OFFICE EVENT 2026" };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(fallback, null, 2), "utf-8");
    return fallback;
  }
}

function writeConfig(next: ServiceConfig): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), "utf-8");
}

function formatIssuedAt(issuedAt?: string): string {
  const date = issuedAt ? new Date(issuedAt) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString("de-CH");
  }
  return date.toLocaleString("de-CH");
}

function buildTicketBytes(ticketNumber: number, eventName: string, issuedAt?: string): Buffer {
  const encoder = new EscPosEncoder();
  const encoded = encoder
    .initialize()
    .align("center")
    .line(eventName.toUpperCase())
    .line("--------------------------------")
    .newline()
    .line("Deine Ticketnummer")
    .bold(true)
    .size(2, 2)
    .line(String(ticketNumber).padStart(3, "0"))
    .size(1, 1)
    .bold(false)
    .newline()
    .line(formatIssuedAt(issuedAt))
    .newline()
    .newline()
    .cut()
    .encode();

  return Buffer.from(encoded);
}

function runPowerShell(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", command],
      { windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message));
          return;
        }
        resolve(stdout);
      },
    );
  });
}

async function listWindowsPrinters(): Promise<string[]> {
  if (process.platform !== "win32") return [];
  const output = await runPowerShell("Get-Printer | Select-Object -ExpandProperty Name");
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function printRaw(sharePath: string, data: Buffer): Promise<number> {
  const normalizedShare = sharePath.trim();
  if (!normalizedShare.startsWith("\\\\")) {
    throw new Error(
      `printerSharePath muss als UNC Pfad gesetzt sein, z.B. \\\\localhost\\\\EPSON_TM_M30. Aktuell gesetzt: ${normalizedShare || "(leer)"}`,
    );
  }

  const tempFile = path.join(os.tmpdir(), `selise-ticket-${Date.now()}-${Math.round(Math.random() * 10000)}.bin`);
  fs.writeFileSync(tempFile, data);

  try {
    await new Promise<void>((resolve, reject) => {
      execFile(
        "cmd.exe",
        ["/d", "/s", "/c", `copy /b "${tempFile}" "${normalizedShare}"`],
        { windowsHide: true },
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(stderr?.trim() || error.message));
            return;
          }
          resolve();
        },
      );
    });
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }

  return Date.now();
}

async function printTwoSeparateReceipts(sharePath: string, data: Buffer): Promise<[number, number]> {
  const firstJobId = await printRaw(sharePath, data);
  // Small gap between jobs helps some spoolers separate both tickets reliably.
  await delay(150);
  const secondJobId = await printRaw(sharePath, data);
  return [firstJobId, secondJobId];
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: VERSION });
});

app.get("/config", (_req, res) => {
  const config = ensureConfig();
  res.json({
    ok: true,
    printerSharePath: config.printerSharePath,
    printerDisplayName: config.printerDisplayName,
    eventName: config.eventName,
  });
});

app.get("/printers", async (_req, res) => {
  try {
    const printers = await listWindowsPrinters();
    res.json({ ok: true, printers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Drucker konnten nicht gelesen werden.";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/printer/select", (_req, res) => {
  res.status(403).json({
    ok: false,
    error: "Druckerwahl ist im Frontend deaktiviert. Bitte print-service/data/config.json lokal bearbeiten.",
  });
});

app.post("/print", async (req, res) => {
  const body = req.body as PrintBody;
  const ticketNumber = body.ticketNumber;

  if (!Number.isFinite(ticketNumber)) {
    res.status(400).json({ ok: false, error: "ticketNumber ist ungueltig." });
    return;
  }
  const safeTicketNumber = Number(ticketNumber);

  const config = ensureConfig();
  if (!config.printerSharePath.trim()) {
    res.status(400).json({
      ok: false,
      error: withConfiguredPathError(
        "Kein printerSharePath gesetzt. Bitte print-service/data/config.json anpassen.",
        config,
      ),
    });
    return;
  }

  const eventName = body.eventName?.trim() || config.eventName || "SELISE OFFICE EVENT 2026";

  try {
    const payload = buildTicketBytes(safeTicketNumber, eventName, body.issuedAt);
    const [firstJobId, secondJobId] = await printTwoSeparateReceipts(config.printerSharePath, payload);
    res.json({ ok: true, copies: 2, jobId: firstJobId, secondJobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Druckfehler.";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/test-print", async (_req, res) => {
  const config = ensureConfig();
  if (!config.printerSharePath.trim()) {
    res.status(400).json({
      ok: false,
      error: withConfiguredPathError(
        "Kein printerSharePath gesetzt. Bitte print-service/data/config.json anpassen.",
        config,
      ),
    });
    return;
  }

  try {
    const ticketNumber = Math.floor(Math.random() * 900) + 100;
    const payload = buildTicketBytes(ticketNumber, config.eventName || "SELISE OFFICE EVENT 2026", new Date().toISOString());
    const [firstJobId, secondJobId] = await printTwoSeparateReceipts(config.printerSharePath, payload);
    res.json({ ok: true, copies: 2, jobId: firstJobId, secondJobId, ticketNumber });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Druckfehler.";
    res.status(500).json({ ok: false, error: message });
  }
});

app.listen(HTTP_PORT, HOST, () => {
  ensureConfig();
  console.log(`Print Service HTTP aktiv auf http://${HOST}:${HTTP_PORT}`);
});

if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
  const key = fs.readFileSync(KEY_PATH);
  const cert = fs.readFileSync(CERT_PATH);
  https.createServer({ key, cert }, app).listen(HTTPS_PORT, HOST, () => {
    console.log(`Print Service HTTPS aktiv auf https://${HOST}:${HTTPS_PORT}`);
  });
}
