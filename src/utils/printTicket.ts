export function printTicket(ticketNumber: number): void {
  // TODO: Integrate real printer/receipt bridge here (USB, network, kiosk printer SDK).
  // This hook is intentionally isolated so event hardware integration can be added safely.
  console.log(`Ticket printed: ${ticketNumber}`);
}
