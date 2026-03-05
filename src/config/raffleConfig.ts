export interface RaffleConfig {
  startNumber: number;
  maxTickets: number | null;
  animationDurationMs: number;
  printService: {
    enabled: boolean;
    baseUrl: string;
    timeoutMs: number;
  };
}

export const raffleConfig: RaffleConfig = {
  startNumber: 1,
  maxTickets: 500,
  animationDurationMs: 1800,
  printService: {
    enabled: true,
    baseUrl: "http://127.0.0.1:17890",
    timeoutMs: 2500,
  },
};
