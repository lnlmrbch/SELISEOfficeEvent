import {
  PRINT_LAST_ERROR_KEY,
  PRINT_LAST_PRINTED_KEY,
  print as printViaService,
} from "./printServiceClient";

export async function printTicket(ticketNumber: number): Promise<void> {
  try {
    await printViaService(ticketNumber);
    window.localStorage.setItem(PRINT_LAST_PRINTED_KEY, String(ticketNumber));
    window.localStorage.removeItem(PRINT_LAST_ERROR_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Druckfehler.";
    window.localStorage.setItem(PRINT_LAST_ERROR_KEY, message);
    console.error("Print Service Fehler:", message);
  }
}
