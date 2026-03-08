import { motion } from "framer-motion";
import omLogo from "../../OM_logo-text.svg";
import babusLogo from "../../img/logos/logo_babus.webp";
import bettertradeLogo from "../../img/logos/bettertrade_logo.png";

interface FooterProps {
  isIdle: boolean;
  animationState: "idle" | "active" | "resetting";
}

export function Footer({ isIdle, animationState }: FooterProps) {
  return (
    <motion.footer
      className={`relative z-10 mt-auto px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.14em] text-brand-white/85 md:px-5 md:py-3 md:text-sm ${
        isIdle ? "" : "rounded-xl border border-brand-white/10 bg-brand-oxford/55 backdrop-blur-sm"
      }`}
      variants={{
        idle: { y: 0, opacity: 1, filter: "blur(0px)" },
        active: { y: 18, opacity: 0.18, filter: "blur(2px)" },
        resetting: { y: 26, opacity: 0, filter: "blur(5px)" },
      }}
      animate={animationState}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex w-full items-end justify-between">
        {isIdle ? (
          <span className="flex flex-col items-start gap-2">
            <span className="text-brand-white/90">Prizes provided by</span>
            <img src={bettertradeLogo} alt="bettertrade" className="h-6 w-auto opacity-95 md:h-7" />
            <img src={babusLogo} alt="Babus" className="h-6 w-auto opacity-95 md:h-7" />
          </span>
        ) : (
          <span>SELISE Group - Office Event 2026</span>
        )}
        <span className="flex items-center gap-2">
          <span className="text-brand-white/85">Developed by</span>
          <img src={omLogo} alt="ORDERMONKEY" className="h-5 w-auto opacity-95 md:h-7" />
        </span>
      </div>
    </motion.footer>
  );
}
