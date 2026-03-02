import omLogo from "../../OM_logo-text.svg";

export function Footer() {
  return (
    <footer className="mt-auto rounded-xl border border-brand-white/10 bg-brand-oxford/55 px-4 py-2.5 backdrop-blur-sm text-[0.72rem] uppercase tracking-[0.14em] text-brand-white/85 md:px-5 md:py-3 md:text-sm">
      <div className="mx-auto flex w-full items-center justify-between">
        <span>SELISE Group - Office Event 2026</span>
        <span className="flex items-center gap-2">
          <span className="text-brand-white/85">Developed by</span>
          <img src={omLogo} alt="ORDERMONKEY" className="h-5 w-auto opacity-95 md:h-7" />
        </span>
      </div>
    </footer>
  );
}
