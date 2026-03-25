import { motion } from "framer-motion";
import omLogo from "../../OM_logo-text.svg";
import babusLogo from "../../img/logos/logo_babus.webp";
import bettertradeLogo from "../../img/logos/bettertrade_logo.png";
import bmLogo from "../../img/logos/bm-logo.svg";
import redbullLogo from "../../img/logos/redbull-logo.png";
import sithuetteLogo from "../../img/logos/sithütte-logo.webp";
import zfvLogo from "../../img/logos/zfv_unternehmungen_logo.jpeg";

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
      <div className={`mx-auto flex w-full items-end gap-4 ${isIdle ? "justify-start" : "justify-between"}`}>
        {isIdle ? (
          <span className="flex flex-col items-start gap-2">
            <span className="text-brand-white/90">Preise bereitgestellt von</span>
            <span className="grid grid-cols-3 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4">
              <span className="flex h-14 w-32 items-center justify-center rounded-lg border border-brand-white/10 bg-brand-white/5 p-2.5 md:h-16 md:w-36 md:p-3">
                <img src={bettertradeLogo} alt="bettertrade" className="max-h-full w-full object-contain opacity-95" />
              </span>
              <span className="flex h-14 w-32 items-center justify-center rounded-lg border border-brand-white/10 bg-brand-white/5 p-2.5 md:h-16 md:w-36 md:p-3">
                <img src={bmLogo} alt="BM" className="max-h-full w-full object-contain opacity-95" />
              </span>
              <span className="flex h-14 w-32 items-center justify-center rounded-lg border border-brand-white/10 bg-brand-white/5 p-2.5 md:h-16 md:w-36 md:p-3">
                <img src={babusLogo} alt="Babus" className="max-h-full w-full object-contain opacity-95" />
              </span>
              <span className="flex h-14 w-32 items-center justify-center rounded-lg border border-brand-white/10 bg-brand-white/5 p-2.5 md:h-16 md:w-36 md:p-3">
                <img src={redbullLogo} alt="Red Bull" className="max-h-full w-full object-contain opacity-95" />
              </span>
              <span className="flex h-14 w-32 items-center justify-center rounded-lg border border-brand-white/10 bg-brand-white/5 p-2.5 md:h-16 md:w-36 md:p-3">
                <img src={sithuetteLogo} alt="Sithuette" className="max-h-full w-full object-contain opacity-95" />
              </span>
              <span className="flex h-14 w-32 items-center justify-center rounded-lg border border-brand-white/10 bg-brand-white/5 p-2.5 md:h-16 md:w-36 md:p-3">
                <img src={zfvLogo} alt="ZFV Unternehmungen" className="max-h-full w-full object-contain opacity-95" />
              </span>
            </span>
          </span>
        ) : (
          <span>SELISE Group - Office Event 2026</span>
        )}
        <span className={`flex items-center gap-2 ${isIdle ? "absolute bottom-2.5 right-4 md:bottom-3 md:right-5" : ""}`}>
          <span className="text-brand-white/85">Entwickelt von</span>
          <img src={omLogo} alt="ORDERMONKEY" className="h-5 w-auto opacity-95 md:h-7" />
        </span>
      </div>
    </motion.footer>
  );
}
