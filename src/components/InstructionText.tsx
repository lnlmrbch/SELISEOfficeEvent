import { AnimatePresence, motion } from "framer-motion";
import type { RaffleState } from "../hooks/useRaffleMachine";

interface InstructionTextProps {
  state: RaffleState;
  resultCountdown: number | null;
}

export function InstructionText({ state, resultCountdown }: InstructionTextProps) {
  return (
    <div className="min-h-12 text-center text-sm text-brand-white/78 md:text-base">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.p key="idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.95, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            Tippe irgendwo auf den Screen zum Start.
          </motion.p>
        )}
        {state === "rolling" && (
          <motion.p key="rolling" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.95, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            Ziehung läuft. Bitte kurz warten.
          </motion.p>
        )}
        {state === "result" && (
          <motion.p
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.95, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            Rückkehr zum Start in {resultCountdown ?? 5}s.
          </motion.p>
        )}
        {state === "exhausted" && (
          <motion.p key="exhausted" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.95, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            Alle Tickets wurden bereits gezogen.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
