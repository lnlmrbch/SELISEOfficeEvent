import { motion } from "framer-motion";
import type { RaffleState } from "../hooks/useRaffleMachine";

interface RaffleOrbProps {
  state: RaffleState;
  numberText: string;
  phaseLabel: string;
  resultCountdown: number | null;
}

export function RaffleOrb({ state, numberText, phaseLabel, resultCountdown }: RaffleOrbProps) {
  const isRolling = state === "rolling";
  const isExhausted = state === "exhausted";
  const isResult = state === "result";

  return (
    <div className="relative z-30 flex w-full flex-col items-center gap-4 md:gap-5">
      <motion.div
        className="relative flex h-[18rem] w-full max-w-[34rem] items-center justify-center overflow-hidden rounded-[2rem] border border-brand-white/15 bg-brand-oxford/95 shadow-orb md:h-[21rem]"
        animate={
          isExhausted
            ? {
                scale: [1, 1.008],
                boxShadow: ["0 0 30px rgba(124,123,127,0.16)", "0 0 50px rgba(124,123,127,0.22)", "0 0 30px rgba(124,123,127,0.16)"],
              }
            : isRolling
              ? {
                  x: [-4, 4],
                  scale: [1, 1.012],
                  rotate: [-0.22, 0.22],
                }
              : { scale: [0.997, 1.006], rotate: 0, x: 0 }
        }
        transition={
          isRolling
            ? { duration: 0.28, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
            : { duration: 2.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
        }
      >
        <div className="absolute left-6 top-0 h-1 w-28 rounded-b-full bg-brand-blue/90 md:w-40" />
        <div className="absolute inset-3 rounded-[1.65rem] border border-brand-white/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,102,178,0.20),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_22%,transparent_78%,rgba(255,255,255,0.03))]" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-brand-white/10" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-brand-white/10" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(124,123,127,0.12)_45%,transparent_100%)]" />

        {isExhausted ? (
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="text-6xl md:text-7xl">
            🎟️
          </motion.div>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            <motion.p
              key={numberText}
              initial={isResult ? { scale: 0.5, opacity: 0 } : undefined}
              animate={{ scale: 1, opacity: 1, filter: isRolling ? "blur(0.35px)" : "blur(0px)" }}
              transition={{ type: "spring", damping: 16, stiffness: 180 }}
              className="font-display text-[6.25rem] font-extrabold leading-none tracking-[0.12em] text-brand-white md:text-[9rem]"
            >
              {numberText}
            </motion.p>
          </div>
        )}
      </motion.div>

      <div className="mt-8 rounded-2xl border border-brand-white/10 bg-brand-white/[0.04] px-5 py-3 text-center backdrop-blur-sm md:mt-10 md:px-6">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-brand-white/80 md:text-base">{phaseLabel}</p>
        {isResult && !isExhausted && (
          <>
            <p className="mt-2 text-2xl font-semibold text-brand-white md:text-3xl">Deine Ticketnummer</p>
            <p className="mt-1 text-sm text-brand-white/75 md:text-base">Zeige diese Nummer am Counter.</p>
            <motion.div
              className="mx-auto mt-3 flex w-full max-w-[280px] items-center justify-center gap-3 rounded-xl border border-brand-white/10 bg-brand-white/5 px-3 py-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.span
                className="h-2 w-2 rounded-full bg-brand-blue"
                animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.25, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-white/85 md:text-sm">
                Ticket wird gedruckt
              </span>
              <span className="text-xs font-bold text-brand-white md:text-sm">{resultCountdown ?? 5}s</span>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
