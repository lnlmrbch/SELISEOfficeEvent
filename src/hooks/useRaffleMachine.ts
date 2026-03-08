import { useCallback, useMemo, useReducer } from "react";
import { raffleConfig } from "../config/raffleConfig";

export type RaffleState = "idle" | "rolling" | "result" | "exhausted";

interface MachineState {
  state: RaffleState;
  nextTicketNumber: number;
  remainingTicketNumbers: number[];
  finalTicketNumber: number | null;
}

type MachineAction =
  | { type: "START_ROLLING" }
  | {
      type: "ROLL_FINISHED";
      ticketNumber: number;
      nextTicketNumber: number;
      remainingTicketNumbers: number[];
      exhausted: boolean;
    }
  | { type: "GO_IDLE" }
  | { type: "SET_EXHAUSTED" };

const STORAGE_KEY = "selise-raffle-latest-issued";
const REMAINING_TICKETS_KEY = "selise-raffle-remaining-ticket-pool";

function getLatestIssuedFromStorage(): number | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasTickets(nextTicketNumber: number): boolean {
  return raffleConfig.maxTickets == null || nextTicketNumber <= raffleConfig.maxTickets;
}

function buildTicketPool(start: number, max: number): number[] {
  if (max < start) return [];
  return Array.from({ length: max - start + 1 }, (_, index) => start + index);
}

function isValidRemainingPool(rawPool: unknown, min: number, max: number): rawPool is number[] {
  if (!Array.isArray(rawPool)) return false;
  const unique = new Set<number>();
  for (const value of rawPool) {
    if (!Number.isInteger(value)) return false;
    if (value < min || value > max) return false;
    if (unique.has(value)) return false;
    unique.add(value);
  }
  return true;
}

function getRemainingPoolFromStorage(min: number, max: number): number[] | null {
  const raw = window.localStorage.getItem(REMAINING_TICKETS_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidRemainingPool(parsed, min, max)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function createInitialState(): MachineState {
  const latestIssued = getLatestIssuedFromStorage();
  const nextTicket = latestIssued == null ? raffleConfig.startNumber : Math.max(raffleConfig.startNumber, latestIssued + 1);
  const max = raffleConfig.maxTickets;

  if (max != null) {
    const fromStorage = getRemainingPoolFromStorage(raffleConfig.startNumber, max);
    const pool =
      fromStorage ??
      buildTicketPool(raffleConfig.startNumber, max).filter((ticketNumber) => {
        if (latestIssued == null) return true;
        // Migration path from old sequential mode: already-issued range is consumed.
        return ticketNumber > latestIssued;
      });

    return {
      state: pool.length > 0 ? "idle" : "exhausted",
      nextTicketNumber: nextTicket,
      remainingTicketNumbers: pool,
      finalTicketNumber: latestIssued,
    };
  }

  return {
    state: hasTickets(nextTicket) ? "idle" : "exhausted",
    nextTicketNumber: nextTicket,
    remainingTicketNumbers: [],
    finalTicketNumber: latestIssued,
  };
}

function reducer(current: MachineState, action: MachineAction): MachineState {
  switch (action.type) {
    case "START_ROLLING":
      if (current.state === "exhausted") return current;
      return { ...current, state: "rolling" };
    case "ROLL_FINISHED":
      return {
        state: action.exhausted ? "exhausted" : "result",
        nextTicketNumber: action.nextTicketNumber,
        remainingTicketNumbers: action.remainingTicketNumbers,
        finalTicketNumber: action.ticketNumber,
      };
    case "GO_IDLE":
      if (current.state === "exhausted") return current;
      return { ...current, state: "idle" };
    case "SET_EXHAUSTED":
      return { ...current, state: "exhausted" };
    default:
      return current;
  }
}

export function useRaffleMachine() {
  const [machine, dispatch] = useReducer(reducer, undefined, createInitialState);

  const canDraw = useMemo(() => machine.state !== "rolling" && machine.state !== "exhausted", [machine.state]);

  const issueNextTicket = useCallback((): number | null => {
    if (raffleConfig.maxTickets != null) {
      if (machine.remainingTicketNumbers.length === 0) {
        dispatch({ type: "SET_EXHAUSTED" });
        return null;
      }

      const randomIndex = Math.floor(Math.random() * machine.remainingTicketNumbers.length);
      const issued = machine.remainingTicketNumbers[randomIndex] ?? null;
      if (issued == null) {
        dispatch({ type: "SET_EXHAUSTED" });
        return null;
      }

      const remaining = machine.remainingTicketNumbers.filter((_, index) => index !== randomIndex);
      const nextSequential = machine.nextTicketNumber + 1;
      const exhausted = remaining.length === 0;

      window.localStorage.setItem(STORAGE_KEY, String(issued));
      window.localStorage.setItem(REMAINING_TICKETS_KEY, JSON.stringify(remaining));
      dispatch({
        type: "ROLL_FINISHED",
        ticketNumber: issued,
        nextTicketNumber: nextSequential,
        remainingTicketNumbers: remaining,
        exhausted,
      });
      return issued;
    }

    if (!hasTickets(machine.nextTicketNumber)) {
      dispatch({ type: "SET_EXHAUSTED" });
      return null;
    }

    const issued = machine.nextTicketNumber;
    const next = issued + 1;
    const exhausted = !hasTickets(next);

    window.localStorage.setItem(STORAGE_KEY, String(issued));
    dispatch({
      type: "ROLL_FINISHED",
      ticketNumber: issued,
      nextTicketNumber: next,
      remainingTicketNumbers: machine.remainingTicketNumbers,
      exhausted,
    });
    return issued;
  }, [machine.nextTicketNumber, machine.remainingTicketNumbers]);

  const startRolling = useCallback(() => {
    dispatch({ type: "START_ROLLING" });
  }, []);

  const setIdle = useCallback(() => {
    dispatch({ type: "GO_IDLE" });
  }, []);

  const setExhausted = useCallback(() => {
    dispatch({ type: "SET_EXHAUSTED" });
  }, []);

  return {
    machine,
    canDraw,
    startRolling,
    setIdle,
    setExhausted,
    issueNextTicket,
  };
}
