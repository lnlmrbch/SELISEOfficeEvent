import { motion } from "framer-motion";
import { useMemo } from "react";

interface RollingNumberStreamProps {
  active: boolean;
}

interface RollingParticle {
  id: number;
  value: string;
  fromX: number;
  fromY: number;
  delay: number;
  duration: number;
}

function createParticles(): RollingParticle[] {
  return Array.from({ length: 16 }, (_, idx) => {
    const isLeft = idx % 2 === 0;
    const randomValue = String(Math.floor(Math.random() * 900) + 100);
    return {
      id: idx,
      value: randomValue,
      fromX: isLeft ? -420 - idx * 14 : 420 + idx * 14,
      fromY: -180 + idx * 22,
      delay: idx * 0.08,
      duration: 1.8 + (idx % 5) * 0.15,
    };
  });
}

export function RollingNumberStream({ active }: RollingNumberStreamProps) {
  const particles = useMemo(() => createParticles(), [active]);
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={`${particle.id}-${particle.value}`}
          className="absolute left-1/2 top-1/2 text-lg font-bold tracking-[0.12em] text-brand-white/60 md:text-2xl"
          initial={{ x: particle.fromX, y: particle.fromY, opacity: 0, scale: 0.8 }}
          animate={{
            x: [particle.fromX, 0, -particle.fromX * 0.2],
            y: [particle.fromY, -particle.fromY * 0.1, particle.fromY * 0.25],
            opacity: [0, 0.95, 0],
            scale: [0.8, 1.1, 0.95],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          {particle.value}
        </motion.span>
      ))}
    </div>
  );
}
