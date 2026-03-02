import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import seliseLogo from "../SELISE_digital_platforms_white.svg";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { ConfettiBurst } from "./components/ConfettiBurst";
import { Footer } from "./components/Footer";
import { InstructionText } from "./components/InstructionText";
import { RaffleLayout } from "./components/RaffleLayout";
import { RaffleOrb } from "./components/RaffleOrb";
import { RollingNumberStream } from "./components/RollingNumberStream";
import { raffleConfig } from "./config/raffleConfig";
import { useRaffleMachine } from "./hooks/useRaffleMachine";
import { printTicket } from "./utils/printTicket";

const PHASE_TEXT = {
  start: "Ziehung startet",
  rolling: "Ticket-Nummer wird gezogen",
  finalize: "Nummer wird finalisiert",
  done: "Ticket bestätigt",
};

function formatTicketNumber(number: number): string {
  return String(number).padStart(3, "0");
}

export default function App() {
  const { machine, canDraw, startRolling, issueNextTicket, setExhausted, setIdle } = useRaffleMachine();
  const [displayNumber, setDisplayNumber] = useState<string>("---");
  const [phaseLabel, setPhaseLabel] = useState<string>("Bereit");
  const [confettiBurst, setConfettiBurst] = useState<number>(0);
  const [resultCountdown, setResultCountdown] = useState<number | null>(null);
  const [showRollingStream, setShowRollingStream] = useState<boolean>(false);
  const [isSoftResetting, setIsSoftResetting] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const resultCountdownIntervalRef = useRef<number | null>(null);
  const softResetTimeoutRef = useRef<number | null>(null);

  const rollingRange = useMemo(() => {
    const max = raffleConfig.maxTickets ?? raffleConfig.startNumber + 999;
    return {
      min: raffleConfig.startNumber,
      max: Math.max(max, raffleConfig.startNumber),
    };
  }, []);

  const clearAnimationFrame = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearResultTimers = useCallback(() => {
    if (resultCountdownIntervalRef.current !== null) {
      window.clearInterval(resultCountdownIntervalRef.current);
      resultCountdownIntervalRef.current = null;
    }
  }, []);

  const clearSoftResetTimeout = useCallback(() => {
    if (softResetTimeoutRef.current !== null) {
      window.clearTimeout(softResetTimeoutRef.current);
      softResetTimeoutRef.current = null;
    }
  }, []);

  const runRollingSequence = useCallback(() => {
    startRolling();
    setShowRollingStream(true);
    setPhaseLabel(PHASE_TEXT.start);

    const startedAt = performance.now();
    let lastTickAt = startedAt;

    const step = (timestamp: number) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(elapsed / raffleConfig.animationDurationMs, 1);
      const tickInterval = 38 + progress * 135;

      if (timestamp - lastTickAt >= tickInterval) {
        const nextNumber =
          rollingRange.min + Math.floor(Math.random() * (rollingRange.max - rollingRange.min + 1));
        setDisplayNumber(formatTicketNumber(nextNumber));
        lastTickAt = timestamp;
      }

      if (progress < 0.3) {
        setPhaseLabel(PHASE_TEXT.start);
      } else if (progress < 0.8) {
        setPhaseLabel(PHASE_TEXT.rolling);
      } else {
        setPhaseLabel(PHASE_TEXT.finalize);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const issuedTicket = issueNextTicket();
      setShowRollingStream(false);
      if (issuedTicket == null) {
        setDisplayNumber("—");
        setPhaseLabel("Alle Tickets wurden bereits gezogen");
        setExhausted();
        return;
      }

      setDisplayNumber(formatTicketNumber(issuedTicket));
      setPhaseLabel(PHASE_TEXT.done);
      setConfettiBurst((value) => value + 1);

      // Print hook is called exactly once per successfully drawn ticket.
      printTicket(issuedTicket);
    };

    clearAnimationFrame();
    rafRef.current = requestAnimationFrame(step);
  }, [clearAnimationFrame, issueNextTicket, rollingRange.max, rollingRange.min, setExhausted, startRolling]);

  const handleTap = useCallback(() => {
    if (!canDraw || machine.state !== "idle") return;
    runRollingSequence();
  }, [canDraw, machine.state, runRollingSequence]);

  useEffect(() => {
    if (machine.state === "idle") {
      setDisplayNumber("---");
      setPhaseLabel("Bereit");
      setResultCountdown(null);
      setShowRollingStream(false);
      setIsSoftResetting(false);
    }

    if (machine.state === "exhausted") {
      setDisplayNumber("—");
      setPhaseLabel("Alle Tickets wurden bereits gezogen");
      setResultCountdown(null);
      setShowRollingStream(false);
      setIsSoftResetting(false);
    }
  }, [machine.state]);

  useEffect(() => {
    if (machine.state !== "result") {
      clearResultTimers();
      return;
    }

    setResultCountdown(5);
    resultCountdownIntervalRef.current = window.setInterval(() => {
      setResultCountdown((current) => {
        if (current == null) return 5;
        if (current <= 1) {
          clearResultTimers();
          setIsSoftResetting(true);
          clearSoftResetTimeout();
          softResetTimeoutRef.current = window.setTimeout(() => {
            setIdle();
            setIsSoftResetting(false);
            softResetTimeoutRef.current = null;
          }, 460);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      clearResultTimers();
      clearSoftResetTimeout();
    };
  }, [clearResultTimers, clearSoftResetTimeout, machine.state, setIdle]);

  useEffect(() => {
    return () => {
      clearAnimationFrame();
      clearResultTimers();
      clearSoftResetTimeout();
    };
  }, [clearAnimationFrame, clearResultTimers, clearSoftResetTimeout]);

  const isIdle = machine.state === "idle";
  return (
    <RaffleLayout onTap={handleTap}>
      <AnimatedBackground exhausted={machine.state === "exhausted"} />
      <div
        className={`pointer-events-none absolute inset-0 z-20 bg-brand-oxford transition-opacity duration-500 ${
          isSoftResetting ? "opacity-35" : "opacity-0"
        }`}
      />

      <div
        className={`absolute inset-x-0 top-0 z-10 mt-52 flex flex-col items-center gap-2 text-center transition-all duration-500 md:mt-72 ${
          isSoftResetting ? "translate-y-[-10px] opacity-0 blur-[3px]" : "translate-y-0 opacity-100 blur-0"
        }`}
      >
        <h1 className="flex items-center justify-center gap-3 text-5xl font-bold tracking-tight text-brand-white md:gap-5 md:text-7xl">
          <img src={seliseLogo} alt="SELISE" className="h-[0.95em] w-auto" />
          <span>Raffle 2026</span>
        </h1>
        <p className="text-2xl font-medium text-brand-white/86 md:text-3xl">
          Jetzt Nummer ziehen
        </p>
      </div>

      <div
        className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-10 transition-all duration-500 md:gap-12 ${
          isSoftResetting
            ? "translate-y-8 md:translate-y-10 opacity-0 blur-[3px]"
            : "translate-y-10 md:translate-y-12 opacity-100 blur-0"
        }`}
      >
        <RollingNumberStream active={showRollingStream} />
        <RaffleOrb state={machine.state} numberText={displayNumber} phaseLabel={phaseLabel} resultCountdown={resultCountdown} />
        <InstructionText state={machine.state} resultCountdown={resultCountdown} />
      </div>

      <ConfettiBurst trigger={confettiBurst} />
      <Footer />
    </RaffleLayout>
  );
}
