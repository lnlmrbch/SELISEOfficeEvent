import { AnimatePresence, motion } from "framer-motion";
import type { RaffleState } from "../hooks/useRaffleMachine";

interface InstructionTextProps {
  state: RaffleState;
}

export function InstructionText({ state }: InstructionTextProps) {
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
        {state === "exhausted" && (
          <motion.p key="exhausted" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.95, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            Alle Tickets wurden bereits gezogen.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
