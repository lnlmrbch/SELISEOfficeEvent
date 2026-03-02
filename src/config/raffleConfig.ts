export interface RaffleConfig {
  startNumber: number;
  maxTickets: number | null;
  animationDurationMs: number;
}

export const raffleConfig: RaffleConfig = {
  startNumber: 1,
  maxTickets: 500,
  animationDurationMs: 1800,
};
