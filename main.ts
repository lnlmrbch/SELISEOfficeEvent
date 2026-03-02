type AppState = "idle" | "rolling" | "result" | "sold-out";

interface RaffleConfig {
  startNumber: number;
  maxTickets: number | null;
  animationDurationMs: number;
  rollingIntervalMs: number;
  progressUpdateMs: number;
  resultResetDelayMs: number;
}

const raffleConfig: RaffleConfig = {
  startNumber: 1,
  maxTickets: 500,
  animationDurationMs: 1850,
  rollingIntervalMs: 68,
  progressUpdateMs: 40,
  resultResetDelayMs: 5000,
};

const storageKey = "selise-raffle-next-ticket";

const frame = document.getElementById("frame") as HTMLElement;
const startButton = document.getElementById("startButton") as HTMLButtonElement;
const nextButton = document.getElementById("nextButton") as HTMLButtonElement;
const rollingNumber = document.getElementById("rollingNumber") as HTMLElement;
const rollingPhase = document.getElementById("rollingPhase") as HTMLElement;
const finalNumber = document.getElementById("finalNumber") as HTMLElement;
const resultKicker = document.getElementById("resultKicker") as HTMLElement;
const resultTitle = document.getElementById("resultTitle") as HTMLElement;
const resultCopy = document.getElementById("resultCopy") as HTMLElement;
const resultCountdown = document.getElementById("resultCountdown") as HTMLElement;
const phaseDot1 = document.getElementById("phaseDot1") as HTMLElement;
const phaseDot2 = document.getElementById("phaseDot2") as HTMLElement;
const phaseDot3 = document.getElementById("phaseDot3") as HTMLElement;
const rollingProgress = document.getElementById("rollingProgress") as HTMLElement;
const flashLayer = document.getElementById("flashLayer") as HTMLElement;
const confettiLayer = document.getElementById("confettiLayer") as HTMLElement;

let appState: AppState = "idle";
let nextTicketNumber = loadStoredNextTicket();
let rollingNumberTimer: number | null = null;
let rollingProgressTimer: number | null = null;
let rollingStopTimeout: number | null = null;
let startScreenTimeout: number | null = null;
let resultCountdownTimer: number | null = null;
let rollingStartTs = 0;
const rollingPhases = ["SELISE Raffle läuft...", "Ticket-Nummer wird gezogen...", "Nummer wird finalisiert..."];

bootstrap();

function bootstrap(): void {
  frame.addEventListener("click", onPrimaryInteraction);
  frame.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPrimaryInteraction();
    }
  });

  startButton.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
    onPrimaryInteraction();
  });

  nextButton.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
    onPrimaryInteraction();
  });

  if (!hasTicketsAvailable()) {
    setState("sold-out");
    return;
  }

  syncUi();
}

/**
 * Core state-machine handler:
 * - idle -> rolling
 * - rolling -> ignore interactions
 * - result -> rolling
 * - sold-out -> locked
 */
function onPrimaryInteraction(): void {
  if (appState === "rolling" || appState === "sold-out") return;
  if (!hasTicketsAvailable()) {
    setState("sold-out");
    return;
  }

  startRolling();
}

function setState(nextState: AppState): void {
  appState = nextState;
  document.body.dataset.state = nextState;
  syncUi();
}

function syncUi(): void {
  if (appState === "idle") {
    startButton.disabled = !hasTicketsAvailable();
    nextButton.disabled = true;
    rollingProgress.style.width = "0%";
    rollingNumber.textContent = "---";
    rollingPhase.textContent = "SELISE Raffle läuft...";
    setActivePhaseDot(0);
    finalNumber.textContent = "---";
    resultCountdown.textContent = "";
  } else if (appState === "rolling") {
    startButton.disabled = true;
    nextButton.disabled = true;
  } else if (appState === "result") {
    const canContinue = hasTicketsAvailable();
    nextButton.disabled = !canContinue;
    nextButton.textContent = canContinue ? "Nächste Nummer ziehen" : "Keine Tickets mehr";
    resultKicker.textContent = "Ticket erfolgreich erzeugt";
    resultTitle.textContent = "Deine Ticket-Nummer";
    resultCopy.textContent = canContinue
      ? "Zeige diese Nummer am Counter / bei der Verlosung."
      : "Keine weiteren Tickets verfügbar.";
  } else {
    nextButton.disabled = true;
    nextButton.textContent = "Keine Tickets verfügbar";
    resultKicker.textContent = "Limit Reached";
    resultTitle.textContent = "Keine weiteren Tickets verfügbar.";
    resultCopy.textContent = "Das Kontingent für dieses Event ist aufgebraucht.";
    finalNumber.textContent = "END";
    resultCountdown.textContent = "";
  }
}

function setActivePhaseDot(index: number): void {
  const dots = [phaseDot1, phaseDot2, phaseDot3];
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });
}

function startRolling(): void {
  cleanupRollingTimers();
  clearStartScreenTimeout();
  clearResultCountdownTimer();
  setState("rolling");
  rollingStartTs = performance.now();
  rollingProgress.style.width = "0%";
  rollingPhase.textContent = rollingPhases[0];
  setActivePhaseDot(0);

  rollingNumberTimer = window.setInterval(() => {
    rollingNumber.textContent = String(randomRollingNumber()).padStart(3, "0");
  }, raffleConfig.rollingIntervalMs);

  rollingProgressTimer = window.setInterval(() => {
    const elapsed = performance.now() - rollingStartTs;
    const progress = Math.min((elapsed / raffleConfig.animationDurationMs) * 100, 100);
    rollingProgress.style.width = `${progress.toFixed(1)}%`;

    if (progress < 33) {
      rollingPhase.textContent = rollingPhases[0];
      setActivePhaseDot(0);
    } else if (progress < 74) {
      rollingPhase.textContent = rollingPhases[1];
      setActivePhaseDot(1);
    } else {
      rollingPhase.textContent = rollingPhases[2];
      setActivePhaseDot(2);
    }
  }, raffleConfig.progressUpdateMs);

  rollingStopTimeout = window.setTimeout(() => {
    finalizeDraw();
  }, raffleConfig.animationDurationMs);
}

function cleanupRollingTimers(): void {
  if (rollingNumberTimer !== null) window.clearInterval(rollingNumberTimer);
  if (rollingProgressTimer !== null) window.clearInterval(rollingProgressTimer);
  if (rollingStopTimeout !== null) window.clearTimeout(rollingStopTimeout);
  rollingNumberTimer = null;
  rollingProgressTimer = null;
  rollingStopTimeout = null;
}

function clearStartScreenTimeout(): void {
  if (startScreenTimeout !== null) window.clearTimeout(startScreenTimeout);
  startScreenTimeout = null;
}

function clearResultCountdownTimer(): void {
  if (resultCountdownTimer !== null) window.clearInterval(resultCountdownTimer);
  resultCountdownTimer = null;
}

function finalizeDraw(): void {
  cleanupRollingTimers();

  if (!hasTicketsAvailable()) {
    setState("sold-out");
    return;
  }

  // Sequential ticket logic: assign current ticket and increment the persistent counter.
  const finalTicket = nextTicketNumber;
  nextTicketNumber += 1;
  persistNextTicket(nextTicketNumber);

  const formatted = String(finalTicket).padStart(3, "0");
  rollingNumber.textContent = formatted;
  rollingPhase.textContent = "Ticket bestätigt";
  setActivePhaseDot(2);
  finalNumber.textContent = formatted;
  rollingProgress.style.width = "100%";

  setState("result");
  triggerFlash();
  triggerConfetti();

  // Print integration hook: called immediately after ticket finalization.
  printTicket(finalTicket);

  // After print trigger, return to start screen after delay.
  scheduleReturnToStartScreen();
}

function scheduleReturnToStartScreen(): void {
  clearStartScreenTimeout();
  clearResultCountdownTimer();

  let secondsLeft = Math.ceil(raffleConfig.resultResetDelayMs / 1000);
  resultCountdown.textContent = `Zurück zum Startscreen in ${secondsLeft}s`;

  resultCountdownTimer = window.setInterval(() => {
    secondsLeft = Math.max(secondsLeft - 1, 0);
    resultCountdown.textContent = `Zurück zum Startscreen in ${secondsLeft}s`;
    if (secondsLeft <= 0) {
      clearResultCountdownTimer();
    }
  }, 1000);

  startScreenTimeout = window.setTimeout(() => {
    if (appState === "result") {
      setState("idle");
    }
    clearResultCountdownTimer();
  }, raffleConfig.resultResetDelayMs);
}

function hasTicketsAvailable(): boolean {
  return raffleConfig.maxTickets === null || nextTicketNumber <= raffleConfig.maxTickets;
}

function randomRollingNumber(): number {
  if (raffleConfig.maxTickets !== null) {
    const range = Math.max(raffleConfig.maxTickets - raffleConfig.startNumber + 1, 1);
    return raffleConfig.startNumber + Math.floor(Math.random() * range);
  }

  const span = 220;
  return nextTicketNumber + Math.floor(Math.random() * span);
}

function loadStoredNextTicket(): number {
  const storedValue = localStorage.getItem(storageKey);
  if (!storedValue) return raffleConfig.startNumber;

  const parsedValue = Number.parseInt(storedValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue < raffleConfig.startNumber) {
    return raffleConfig.startNumber;
  }

  return parsedValue;
}

function persistNextTicket(value: number): void {
  localStorage.setItem(storageKey, String(value));
}

function triggerConfetti(): void {
  confettiLayer.innerHTML = "";
  const confettiCount = 34;
  const colors = ["#3da5ff", "#ff4f6d", "#8365ff", "#7bd4ff", "#ffffff"];

  for (let i = 0; i < confettiCount; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece burst";
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--x", `${Math.round((Math.random() - 0.5) * 840)}`);
    piece.style.setProperty("--y", `${Math.round(240 + Math.random() * 620)}`);
    piece.style.setProperty("--r", `${Math.round((Math.random() - 0.5) * 900)}`);
    piece.style.animationDelay = `${Math.random() * 180}ms`;
    confettiLayer.appendChild(piece);
  }
}

function triggerFlash(): void {
  flashLayer.classList.remove("active");
  // Force restart of CSS animation for consecutive draws.
  void flashLayer.offsetWidth;
  flashLayer.classList.add("active");
}

function printTicket(ticketNumber: number): void {
  // TODO: Später echte Drucklogik integrieren (z.B. Bondrucker / Printer API).
  console.log(`[printTicket] ticket=${ticketNumber}`);
}
