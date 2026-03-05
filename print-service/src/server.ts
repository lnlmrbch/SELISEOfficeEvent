import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const printer = require("printer") as {
  getPrinters: () => Array<{ name?: string; displayName?: string; printerName?: string }>;
  printDirect: (options: {
    data: Buffer | string;
    printer: string;
    type: "RAW";
    success: (jobId: number) => void;
    error: (error: Error) => void;
  }) => void;
};
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
  selectedPrinterName: string | null;
}

interface PrintBody {
  ticketNumber?: number;
  eventName?: string;
  issuedAt?: string;
}

interface SelectPrinterBody {
  printerName?: string;
}

function ensureConfig(): ServiceConfig {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    const initial: ServiceConfig = { selectedPrinterName: null };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ServiceConfig>;
    return { selectedPrinterName: parsed.selectedPrinterName ?? null };
  } catch {
    const fallback: ServiceConfig = { selectedPrinterName: null };
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

function getPrinterNames(): string[] {
  try {
    const discovered = printer.getPrinters() ?? [];
    return discovered
      .map((item) => item.name ?? item.displayName ?? item.printerName ?? "")
      .filter((name): name is string => name.trim().length > 0);
  } catch {
    return [];
  }
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

function printRaw(printerName: string, data: Buffer): Promise<number> {
  return new Promise((resolve, reject) => {
    printer.printDirect({
      data,
      printer: printerName,
      type: "RAW",
      success: (jobId) => resolve(jobId),
      error: (error) => reject(error),
    });
  });
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

app.get("/printers", (_req, res) => {
  res.json({ ok: true, printers: getPrinterNames() });
});

app.post("/printer/select", (req, res) => {
  const body = req.body as SelectPrinterBody;
  const printerName = body.printerName?.trim();

  if (!printerName) {
    res.status(400).json({ ok: false, error: "printerName fehlt." });
    return;
  }

  const printers = getPrinterNames();
  if (!printers.includes(printerName)) {
    res.status(404).json({ ok: false, error: "Drucker nicht gefunden." });
    return;
  }

  const config = ensureConfig();
  const updated: ServiceConfig = { ...config, selectedPrinterName: printerName };
  writeConfig(updated);
  res.json({ ok: true, selectedPrinterName: printerName });
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
  if (!config.selectedPrinterName) {
    res.status(400).json({ ok: false, error: "Kein Drucker ausgewaehlt." });
    return;
  }

  const eventName = body.eventName?.trim() || "SELISE OFFICE EVENT 2026";

  try {
    const payload = buildTicketBytes(safeTicketNumber, eventName, body.issuedAt);
    const jobId = await printRaw(config.selectedPrinterName, payload);
    res.json({ ok: true, jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Druckfehler.";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/test-print", async (_req, res) => {
  const config = ensureConfig();
  if (!config.selectedPrinterName) {
    res.status(400).json({ ok: false, error: "Kein Drucker ausgewaehlt." });
    return;
  }

  try {
    const ticketNumber = Math.floor(Math.random() * 900) + 100;
    const payload = buildTicketBytes(ticketNumber, "SELISE OFFICE EVENT 2026", new Date().toISOString());
    const jobId = await printRaw(config.selectedPrinterName, payload);
    res.json({ ok: true, jobId, ticketNumber });
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
