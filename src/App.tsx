import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import seliseLogo from "../SELISE_digital_platforms_white.svg";
import startScreenBackground from "../img/bg.png";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { Footer } from "./components/Footer";
import { InstructionText } from "./components/InstructionText";
import { RaffleLayout } from "./components/RaffleLayout";
import { RaffleOrb } from "./components/RaffleOrb";
import { raffleConfig } from "./config/raffleConfig";
import { useRaffleMachine } from "./hooks/useRaffleMachine";
import { printTicket } from "./utils/printTicket";
import {
  PRINT_LAST_ERROR_KEY,
  PRINT_LAST_PRINTED_KEY,
  getServiceConfig,
  getPrintServiceBaseUrl,
  healthCheck,
  listPrinters,
  setPrintServiceBaseUrl,
  testPrint,
} from "./utils/printServiceClient";

const PHASE_TEXT = {
  start: "Ziehung startet",
  rolling: "Ticket-Nummer wird gezogen",
  finalize: "Nummer wird finalisiert",
  done: "Ticket bestätigt",
};
const LEGACY_PRINTED_STORAGE_KEY = "selise-raffle-latest-issued";
const MIXED_CONTENT_HINT =
  "Browser blockiert HTTP-Aufrufe von HTTPS-Seite. Loesung: Print Service optional als HTTPS bereitstellen oder Kiosk-Policy 'Allow insecure content' fuer diese Site setzen.";

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
  const [isDebugOverlayOpen, setIsDebugOverlayOpen] = useState<boolean>(false);
  const [latestPrintedNumber, setLatestPrintedNumber] = useState<number | null>(null);
  const [lastPrintError, setLastPrintError] = useState<string>("");
  const [printServiceUrlInput, setPrintServiceUrlInput] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false);
  const [isSendingTestPrint, setIsSendingTestPrint] = useState<boolean>(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [configuredPrinterSharePath, setConfiguredPrinterSharePath] = useState<string>("");
  const [configuredPrinterDisplayName, setConfiguredPrinterDisplayName] = useState<string>("");
  const rafRef = useRef<number | null>(null);
  const resultCountdownIntervalRef = useRef<number | null>(null);
  const softResetTimeoutRef = useRef<number | null>(null);
  const idleRevealTimeoutRef = useRef<number | null>(null);
  const cornerTapCountRef = useRef<number>(0);
  const cornerTapResetRef = useRef<number | null>(null);
  const drawLockRef = useRef<boolean>(false);

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

  const clearCornerTapReset = useCallback(() => {
    if (cornerTapResetRef.current !== null) {
      window.clearTimeout(cornerTapResetRef.current);
      cornerTapResetRef.current = null;
    }
  }, []);

  const clearIdleRevealTimeout = useCallback(() => {
    if (idleRevealTimeoutRef.current !== null) {
      window.clearTimeout(idleRevealTimeoutRef.current);
      idleRevealTimeoutRef.current = null;
    }
  }, []);

  const getLatestPrintedFromStorage = useCallback((): number | null => {
    const raw = window.localStorage.getItem(PRINT_LAST_PRINTED_KEY) ?? window.localStorage.getItem(LEGACY_PRINTED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const getLastPrintErrorFromStorage = useCallback((): string => {
    return window.localStorage.getItem(PRINT_LAST_ERROR_KEY) ?? "";
  }, []);

  const loadServiceConfig = useCallback(async (customUrl?: string) => {
    const result = await getServiceConfig(customUrl);
    setConfiguredPrinterSharePath(result.printerSharePath?.trim() ?? "");
    setConfiguredPrinterDisplayName(result.printerDisplayName?.trim() ?? "");
  }, []);

  const checkPrintServiceHealth = useCallback(
    async (customUrl?: string) => {
      setIsCheckingHealth(true);
      try {
        await healthCheck(customUrl);
        setHealthStatus("connected");
        await loadServiceConfig(customUrl);
        setLastPrintError(getLastPrintErrorFromStorage());
      } catch (error) {
        setHealthStatus("disconnected");
        const message = error instanceof Error ? error.message : "Verbindungspruefung fehlgeschlagen.";
        setLastPrintError(message);
        window.localStorage.setItem(PRINT_LAST_ERROR_KEY, message);
      } finally {
        setIsCheckingHealth(false);
      }
    },
    [getLastPrintErrorFromStorage, loadServiceConfig],
  );

  const loadPrinters = useCallback(async () => {
    setIsLoadingPrinters(true);
    try {
      const result = await listPrinters(printServiceUrlInput);
      setPrinters(result.printers);
      setHealthStatus("connected");
      setLastPrintError(getLastPrintErrorFromStorage());
    } catch (error) {
      setHealthStatus("disconnected");
      const message = error instanceof Error ? error.message : "Drucker konnten nicht geladen werden.";
      setLastPrintError(message);
      window.localStorage.setItem(PRINT_LAST_ERROR_KEY, message);
    } finally {
      setIsLoadingPrinters(false);
    }
  }, [getLastPrintErrorFromStorage, printServiceUrlInput]);

  const sendTestPrint = useCallback(async () => {
    setIsSendingTestPrint(true);
    try {
      await testPrint(printServiceUrlInput);
      setHealthStatus("connected");
      setLastPrintError("");
      window.localStorage.removeItem(PRINT_LAST_ERROR_KEY);
    } catch (error) {
      setHealthStatus("disconnected");
      const message = error instanceof Error ? error.message : "Testdruck fehlgeschlagen.";
      setLastPrintError(message);
      window.localStorage.setItem(PRINT_LAST_ERROR_KEY, message);
    } finally {
      setIsSendingTestPrint(false);
    }
  }, [printServiceUrlInput]);

  const runRollingSequence = useCallback(() => {
    if (drawLockRef.current) return;
    drawLockRef.current = true;
    clearIdleRevealTimeout();
    setIsSoftResetting(false);
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
        drawLockRef.current = false;
        return;
      }

      setDisplayNumber(formatTicketNumber(issuedTicket));
      setPhaseLabel(PHASE_TEXT.done);
      setConfettiBurst((value) => value + 1);

      // Print hook is called exactly once per successfully drawn ticket.
      void printTicket(issuedTicket);
    };

    clearAnimationFrame();
    rafRef.current = requestAnimationFrame(step);
  }, [clearAnimationFrame, clearIdleRevealTimeout, issueNextTicket, rollingRange.max, rollingRange.min, setExhausted, startRolling]);

  const handleTap = useCallback(() => {
    if (!canDraw || machine.state !== "idle") return;
    runRollingSequence();
  }, [canDraw, machine.state, runRollingSequence]);

  useEffect(() => {
    if (machine.state === "idle") {
      drawLockRef.current = false;
      setDisplayNumber("---");
      setPhaseLabel("Bereit");
      setResultCountdown(null);
      setShowRollingStream(false);
      setIsSoftResetting(false);
      clearIdleRevealTimeout();
    }

    if (machine.state === "exhausted") {
      drawLockRef.current = false;
      setDisplayNumber("—");
      setPhaseLabel("Alle Tickets wurden bereits gezogen");
      setResultCountdown(null);
      setShowRollingStream(false);
      setIsSoftResetting(false);
      clearIdleRevealTimeout();
    }
  }, [clearIdleRevealTimeout, machine.state]);

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
          clearIdleRevealTimeout();
          softResetTimeoutRef.current = window.setTimeout(() => {
            setIdle();
            idleRevealTimeoutRef.current = window.setTimeout(() => {
              setIsSoftResetting(false);
              idleRevealTimeoutRef.current = null;
            }, 520);
            softResetTimeoutRef.current = null;
          }, 760);
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
    const fromStorage = getLatestPrintedFromStorage();
    if (machine.finalTicketNumber == null) {
      setLatestPrintedNumber(fromStorage);
      return;
    }

    if (fromStorage == null) {
      setLatestPrintedNumber(machine.finalTicketNumber);
      return;
    }

    setLatestPrintedNumber(Math.max(fromStorage, machine.finalTicketNumber));
  }, [getLatestPrintedFromStorage, machine.finalTicketNumber]);

  useEffect(() => {
    return () => {
      clearAnimationFrame();
      clearResultTimers();
      clearSoftResetTimeout();
      clearIdleRevealTimeout();
      clearCornerTapReset();
    };
  }, [clearAnimationFrame, clearResultTimers, clearSoftResetTimeout, clearCornerTapReset, clearIdleRevealTimeout]);

  const handleCornerTap = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      cornerTapCountRef.current += 1;

      clearCornerTapReset();
      cornerTapResetRef.current = window.setTimeout(() => {
        cornerTapCountRef.current = 0;
        cornerTapResetRef.current = null;
      }, 1400);

      if (cornerTapCountRef.current >= 4) {
        cornerTapCountRef.current = 0;
        clearCornerTapReset();
        setLatestPrintedNumber(getLatestPrintedFromStorage());
        setLastPrintError(getLastPrintErrorFromStorage());
        const baseUrl = getPrintServiceBaseUrl();
        setPrintServiceUrlInput(baseUrl);
        void loadServiceConfig(baseUrl).catch(() => {
          setConfiguredPrinterSharePath("");
          setConfiguredPrinterDisplayName("");
        });
        setHealthStatus("unknown");
        setPrinters([]);
        setIsDebugOverlayOpen(true);
      }
    },
    [clearCornerTapReset, getLastPrintErrorFromStorage, getLatestPrintedFromStorage, loadServiceConfig],
  );

  const isIdle = machine.state === "idle";
  const showIdleBackground = isIdle || isSoftResetting;
  const sceneAnimationState = isSoftResetting ? "resetting" : isIdle ? "idle" : "active";

  return (
    <RaffleLayout onTap={handleTap}>
      <AnimatedBackground exhausted={machine.state === "exhausted"} />
      <motion.div
        className="pointer-events-none absolute inset-0 z-[2]"
        animate={{
          opacity: showIdleBackground ? 1 : 0,
          scale: showIdleBackground ? 1 : 1.045,
          filter: showIdleBackground ? "blur(0px)" : "blur(9px)",
        }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundImage: `url(${startScreenBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-brand-oxford/62" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,31,53,0.32)_0%,rgba(0,31,53,0.74)_100%)]" />
      </motion.div>
      <button
        type="button"
        aria-label="Debug overlay öffnen"
        onClick={handleCornerTap}
        className="absolute left-0 top-0 z-[120] h-20 w-20 cursor-default bg-transparent"
      />
      <motion.div
        className={`pointer-events-none absolute inset-0 z-20 bg-brand-oxford transition-opacity duration-500 ${
          isSoftResetting ? "opacity-35" : "opacity-0"
        }`}
      />

      <motion.div
        className="absolute inset-x-0 top-0 z-10 mt-52 flex flex-col items-center gap-2 text-center md:mt-72"
        variants={{
          idle: { y: 0, opacity: 1, filter: "blur(0px)" },
          active: { y: -8, opacity: 0.9, filter: "blur(0px)" },
          resetting: { y: -18, opacity: 0, filter: "blur(4px)" },
        }}
        animate={sceneAnimationState}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="flex items-center justify-center gap-3 text-5xl font-bold tracking-tight text-brand-white md:gap-5 md:text-7xl">
          <span>Open House @</span>
          <img src={seliseLogo} alt="SELISE" className="h-[0.95em] w-auto" />
          <span>2026</span>
        </h1>
      </motion.div>

      <motion.div
        className="absolute inset-0 z-10"
        variants={{
          idle: { y: 0, opacity: 1, filter: "blur(0px)" },
          active: { y: 0, opacity: 1, filter: "blur(0px)" },
          resetting: { y: 20, opacity: 0, filter: "blur(4px)" },
        }}
        animate={sceneAnimationState}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex w-full max-w-[34rem] flex-col items-center justify-center px-5 md:px-0">
            <p className="absolute bottom-full mb-2 whitespace-nowrap text-2xl font-medium text-brand-white/86 md:mb-3 md:text-3xl">
              Jetzt Nummer ziehen
            </p>
            <RaffleOrb
              state={machine.state}
              numberText={displayNumber}
              phaseLabel={phaseLabel}
              resultCountdown={resultCountdown}
              showRollingStream={showRollingStream}
              confettiTrigger={confettiBurst}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+14rem)] flex justify-center md:top-[calc(50%+16rem)]">
          <InstructionText state={machine.state} />
        </div>
      </motion.div>

      <Footer isIdle={isIdle} animationState={sceneAnimationState} />

      {isDebugOverlayOpen && (
        <div
          className="absolute inset-0 z-[130] flex items-center justify-center bg-brand-oxford/75 px-6"
          onClick={() => setIsDebugOverlayOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-brand-white/20 bg-brand-oxford px-6 py-6 text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-white/70">Admin Druck-Setup</p>
            <p className="mt-3 text-lg text-brand-white/90">Bereits gedruckt bis Nummer</p>
            <p className="mt-2 text-center font-display text-6xl font-extrabold leading-none text-brand-white">
              {latestPrintedNumber != null ? formatTicketNumber(latestPrintedNumber) : "—"}
            </p>

            <div className="mt-5 rounded-xl border border-brand-white/10 bg-brand-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-white/70">Print-Service-URL</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={printServiceUrlInput}
                  onChange={(event) => setPrintServiceUrlInput(event.target.value)}
                  className="w-full rounded-md border border-brand-white/20 bg-brand-oxford px-3 py-2 text-sm text-brand-white outline-none"
                />
                <button
                  type="button"
                  className="rounded-md border border-brand-white/20 bg-brand-white/10 px-3 py-2 text-xs font-semibold text-brand-white"
                  onClick={() => {
                    setPrintServiceBaseUrl(printServiceUrlInput);
                    void checkPrintServiceHealth(printServiceUrlInput);
                  }}
                >
                  Speichern
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-brand-white/20 bg-brand-white/10 px-3 py-2 text-xs font-semibold text-brand-white"
                onClick={() => void checkPrintServiceHealth(printServiceUrlInput)}
                disabled={isCheckingHealth}
              >
                {isCheckingHealth ? "Pruefe..." : "Verbindung pruefen"}
              </button>
              <button
                type="button"
                className="rounded-md border border-brand-white/20 bg-brand-white/10 px-3 py-2 text-xs font-semibold text-brand-white"
                onClick={() => void loadPrinters()}
                disabled={isLoadingPrinters}
              >
                {isLoadingPrinters ? "Lade Drucker..." : "Drucker laden"}
              </button>
              <button
                type="button"
                className="rounded-md border border-brand-white/20 bg-brand-white/10 px-3 py-2 text-xs font-semibold text-brand-white"
                onClick={() => void sendTestPrint()}
                disabled={isSendingTestPrint}
              >
                {isSendingTestPrint ? "Drucke..." : "Testdruck"}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-brand-white/10 bg-brand-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-white/70">Verbindungsstatus</p>
              <p className="mt-1 text-sm text-brand-white">
                {healthStatus === "connected" ? "Verbunden ✅" : healthStatus === "disconnected" ? "Getrennt ❌" : "Unbekannt"}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-white/70">Drucker</p>
              <p className="mt-1 text-xs text-brand-white/70">
                Auswahl ist im Frontend deaktiviert. Bitte lokal in `print-service/data/config.json` setzen.
              </p>
              <p className="mt-2 text-xs text-brand-white/80">
                Config printerSharePath:{" "}
                <span className="font-semibold text-brand-white">{configuredPrinterSharePath || "(leer)"}</span>
              </p>
              <p className="mt-1 text-xs text-brand-white/75">
                Config printerDisplayName: {configuredPrinterDisplayName || "(leer)"}
              </p>
              <div className="mt-2 max-h-28 overflow-auto rounded-md border border-brand-white/15 bg-brand-oxford/80 px-3 py-2 text-sm text-brand-white/85">
                {printers.length > 0 ? printers.join(" | ") : "Noch keine Drucker geladen."}
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-white/70">Letzter Fehler</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-brand-white/80">{lastPrintError || "Kein Fehler"}</p>
              {lastPrintError.includes("Mixed Content") || lastPrintError.includes("blocked") ? (
                <p className="mt-2 text-xs text-brand-white/70">{MIXED_CONTENT_HINT}</p>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-lg border border-brand-white/20 bg-brand-white/5 px-4 py-2 text-sm font-semibold text-brand-white"
                onClick={() => setIsDebugOverlayOpen(false)}
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}
    </RaffleLayout>
  );
}
