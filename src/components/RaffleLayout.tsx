import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

interface RaffleLayoutProps extends PropsWithChildren {
  onTap: () => void;
}

export function RaffleLayout({ onTap, children }: RaffleLayoutProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <motion.section
        onClick={onTap}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onTap();
          }
        }}
        className="relative flex h-full w-full flex-col overflow-hidden border border-brand-white/15 bg-brand-oxford/45 px-5 py-5 backdrop-blur-xl md:px-8 md:py-7"
        whileTap={{ scale: 0.998 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-brand-blue/20" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_25%,transparent_75%,rgba(255,255,255,0.02)_100%)]" />
        <div className="pointer-events-none absolute left-0 top-0 h-16 w-16 border-l-2 border-t-2 border-brand-blue/65" />
        <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 border-r-2 border-t-2 border-brand-blue/65" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-16 border-b-2 border-l-2 border-brand-blue/65" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 border-b-2 border-r-2 border-brand-blue/65" />
        {children}
      </motion.section>
    </div>
  );
}
