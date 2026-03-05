import { raffleConfig } from "../config/raffleConfig";

export const PRINT_SERVICE_URL_KEY = "selise-raffle-print-service-url";
export const PRINT_LAST_ERROR_KEY = "selise-raffle-last-print-error";
export const PRINT_LAST_PRINTED_KEY = "selise-raffle-last-printed";

interface PrintServiceResponse<T = unknown> {
  ok: boolean;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}

export interface HealthResponse {
  ok: true;
  version: string;
}

export interface PrinterListResponse {
  ok: true;
  printers: string[];
}

function getConfiguredBaseUrl(): string {
  const override = window.localStorage.getItem(PRINT_SERVICE_URL_KEY)?.trim();
  if (override) return override;
  return raffleConfig.printService.baseUrl;
}

export function getPrintServiceBaseUrl(): string {
  return getConfiguredBaseUrl();
}

export function setPrintServiceBaseUrl(url: string): void {
  window.localStorage.setItem(PRINT_SERVICE_URL_KEY, url.trim());
}

function buildMixedContentHint(baseUrl: string, rawError: string): string {
  const normalized = rawError.toLowerCase();
  if (
    normalized.includes("mixed content") ||
    normalized.includes("blocked") ||
    (window.location.protocol === "https:" && baseUrl.startsWith("http://") && normalized.includes("failed to fetch"))
  ) {
    return (
      `${rawError}\n\n` +
      "Browser blockiert HTTP calls von HTTPS Seite. Loesung: Print Service optional als HTTPS bereitstellen " +
      "oder Kiosk Policy 'Allow insecure content' fuer diese Site setzen."
    );
  }
  return rawError;
}

async function requestJson<T>(path: string, init?: RequestInit, customBaseUrl?: string): Promise<T> {
  const baseUrl = (customBaseUrl ?? getConfiguredBaseUrl()).replace(/\/+$/, "");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), raffleConfig.printService.timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const payload = (await response.json()) as PrintServiceResponse;
    if (!response.ok || !payload.ok) {
      throw new Error(typeof payload.error === "string" ? payload.error : `HTTP ${response.status}`);
    }

    return payload as unknown as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(buildMixedContentHint(baseUrl, error.message));
    }
    throw new Error(buildMixedContentHint(baseUrl, "Unbekannter Print Service Fehler."));
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function healthCheck(customBaseUrl?: string): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/health", { method: "GET" }, customBaseUrl);
}

export async function listPrinters(customBaseUrl?: string): Promise<PrinterListResponse> {
  return requestJson<PrinterListResponse>("/printers", { method: "GET" }, customBaseUrl);
}

export async function selectPrinter(printerName: string, customBaseUrl?: string): Promise<void> {
  await requestJson("/printer/select", {
    method: "POST",
    body: JSON.stringify({ printerName }),
  }, customBaseUrl);
}

export async function testPrint(customBaseUrl?: string): Promise<void> {
  await requestJson("/test-print", {
    method: "POST",
    body: JSON.stringify({}),
  }, customBaseUrl);
}

export async function print(ticketNumber: number, customBaseUrl?: string): Promise<void> {
  await requestJson("/print", {
    method: "POST",
    body: JSON.stringify({
      ticketNumber,
      eventName: "SELISE OFFICE EVENT 2026",
      issuedAt: new Date().toISOString(),
    }),
  }, customBaseUrl);
}
