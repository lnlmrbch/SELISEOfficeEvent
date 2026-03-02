import { useCallback, useMemo, useReducer } from "react";
import { raffleConfig } from "../config/raffleConfig";

export type RaffleState = "idle" | "rolling" | "result" | "exhausted";

interface MachineState {
  state: RaffleState;
  nextTicketNumber: number;
  finalTicketNumber: number | null;
}

type MachineAction =
  | { type: "START_ROLLING" }
  | { type: "ROLL_FINISHED"; ticketNumber: number; nextTicketNumber: number; exhausted: boolean }
  | { type: "GO_IDLE" }
  | { type: "SET_EXHAUSTED" };

const STORAGE_KEY = "selise-raffle-latest-issued";

function getLatestIssuedFromStorage(): number | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasTickets(nextTicketNumber: number): boolean {
  return raffleConfig.maxTickets == null || nextTicketNumber <= raffleConfig.maxTickets;
}

function createInitialState(): MachineState {
  const latestIssued = getLatestIssuedFromStorage();
  const nextTicket = latestIssued == null ? raffleConfig.startNumber : Math.max(raffleConfig.startNumber, latestIssued + 1);

  return {
    state: hasTickets(nextTicket) ? "idle" : "exhausted",
    nextTicketNumber: nextTicket,
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
    if (!hasTickets(machine.nextTicketNumber)) {
      dispatch({ type: "SET_EXHAUSTED" });
      return null;
    }

    const issued = machine.nextTicketNumber;
    const next = issued + 1;
    const exhausted = !hasTickets(next);

    // Persist latest issued ticket so refresh won't reset sequence.
    window.localStorage.setItem(STORAGE_KEY, String(issued));
    dispatch({ type: "ROLL_FINISHED", ticketNumber: issued, nextTicketNumber: next, exhausted });
    return issued;
  }, [machine.nextTicketNumber]);

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
