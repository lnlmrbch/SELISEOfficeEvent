import { motion } from "framer-motion";

export function AnimatedBackground({ exhausted }: { exhausted: boolean }) {
  const floatingPills = [
    { text: "General Services", left: "4%", top: "7%", duration: 21, delay: 0.2 },
    { text: "Staff Augmentation", left: "23%", top: "5%", duration: 19, delay: 0.5 },
    { text: "User Experience", left: "67%", top: "5%", duration: 22, delay: 0.8 },
    { text: "Consulting", left: "84%", top: "8%", duration: 18, delay: 1.1 },
    { text: "IT Operations", left: "4%", top: "18%", duration: 23, delay: 0.9 },
    { text: "Retail & Services", left: "78%", top: "18%", duration: 20, delay: 0.6 },
    { text: "E-commerce", left: "84%", top: "28%", duration: 17, delay: 0.4 },
    { text: "Website Development", left: "4%", top: "30%", duration: 24, delay: 1.0 },
    { text: "Application Development", left: "78%", top: "40%", duration: 21, delay: 0.3 },
    { text: "Business Suite", left: "6%", top: "52%", duration: 19, delay: 1.2 },
    { text: "Insurance & Banking", left: "78%", top: "52%", duration: 22, delay: 0.7 },
    { text: "Data & AI Solutions", left: "8%", top: "66%", duration: 20, delay: 0.2 },
    { text: "Telecom & Technology", left: "76%", top: "66%", duration: 23, delay: 1.0 },
    { text: "Manufacturing & Engineering", left: "8%", top: "78%", duration: 25, delay: 0.6 },
    { text: "CPQ", left: "30%", top: "82%", duration: 16, delay: 1.1 },
    { text: "OrderMonkey", left: "56%", top: "80%", duration: 18, delay: 0.5 },
    { text: "Enterprise Platform (Blocks)", left: "76%", top: "78%", duration: 22, delay: 0.9 },
    { text: "Blocks Language Manager", left: "22%", top: "90%", duration: 20, delay: 1.0 },
    { text: "SELISE Signature", left: "56%", top: "90%", duration: 24, delay: 0.4 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animated-grid absolute inset-0 opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,102,178,0.18),transparent_42%)]" />
      <motion.div
        className="absolute -left-24 -top-32 h-[45vh] w-[45vh] rounded-full bg-brand-blue/20 blur-3xl"
        style={{ opacity: exhausted ? 0.03 : 0.055 }}
        animate={{ scale: exhausted ? [1, 1.01] : [1, 1.05] }}
        transition={{ duration: 11, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 right-[-8rem] h-[42vh] w-[42vh] rounded-full bg-brand-gray/20 blur-3xl"
        style={{ opacity: exhausted ? 0.025 : 0.05 }}
        animate={{ scale: exhausted ? [1, 1.015] : [1, 1.06] }}
        transition={{ duration: 13, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/4 h-[30vh] w-[30vh] rounded-full bg-brand-blue/15 blur-3xl"
        style={{ opacity: exhausted ? 0.02 : 0.038 }}
        animate={{ x: [-14, 14], y: [0, -12] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-[-12%] top-1/2 h-px bg-gradient-to-r from-transparent via-brand-blue/45 to-transparent"
        animate={{ x: ["-8%", "8%", "-8%"], opacity: exhausted ? [0.14, 0.2, 0.14] : [0.22, 0.36, 0.22] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[-20vh] top-[-20vh] h-[62vh] w-[62vh] rounded-full border border-brand-white/10"
        style={{ opacity: exhausted ? 0.012 : 0.026 }}
        animate={{ rotate: exhausted ? 0 : 360 }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-[-24vh] right-[-18vh] h-[54vh] w-[54vh] rounded-full border border-brand-gray/25"
        style={{ opacity: exhausted ? 0.01 : 0.022 }}
        animate={{ rotate: exhausted ? 0 : -360 }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      />
      {!exhausted &&
        floatingPills.map((pill) => (
          <motion.div
            key={pill.text}
            className="absolute z-0 rounded-full border border-brand-white/10 bg-brand-white/[0.015] px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-white/[0.22] md:text-[0.78rem]"
            style={{ left: pill.left, top: pill.top }}
            animate={{ y: [-8, 8], x: [-4, 4], opacity: [0.11, 0.17] }}
            transition={{ duration: pill.duration, delay: pill.delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          >
            {pill.text}
          </motion.div>
        ))}
    </div>
  );
}
