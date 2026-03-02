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
  exitX: number;
  exitY: number;
  delay: number;
  duration: number;
}

function createParticles(): RollingParticle[] {
  const viewportWidth = typeof window === "undefined" ? 1080 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 1920 : window.innerHeight;
  const spawnDirections = ["left", "right", "top", "bottom", "diag-left", "diag-right"] as const;

  return Array.from({ length: 24 }, (_, idx) => {
    const direction = spawnDirections[idx % spawnDirections.length];
    const randomValue = String(Math.floor(Math.random() * 900) + 100);
    const xOffset = viewportWidth * 0.58 + idx * 14;
    const yOffset = viewportHeight * 0.42 + idx * 18;

    let fromX = 0;
    let fromY = 0;
    let exitX = 0;
    let exitY = 0;

    if (direction === "left") {
      fromX = -xOffset;
      fromY = -yOffset * 0.3;
      exitX = xOffset * 0.32;
      exitY = yOffset * 0.14;
    } else if (direction === "right") {
      fromX = xOffset;
      fromY = yOffset * 0.2;
      exitX = -xOffset * 0.32;
      exitY = -yOffset * 0.12;
    } else if (direction === "top") {
      fromX = -xOffset * 0.2;
      fromY = -yOffset;
      exitX = xOffset * 0.14;
      exitY = yOffset * 0.28;
    } else if (direction === "bottom") {
      fromX = xOffset * 0.18;
      fromY = yOffset;
      exitX = -xOffset * 0.16;
      exitY = -yOffset * 0.3;
    } else if (direction === "diag-left") {
      fromX = -xOffset;
      fromY = -yOffset;
      exitX = xOffset * 0.26;
      exitY = yOffset * 0.26;
    } else {
      fromX = xOffset;
      fromY = -yOffset;
      exitX = -xOffset * 0.26;
      exitY = yOffset * 0.26;
    }

    return {
      id: idx,
      value: randomValue,
      fromX,
      fromY,
      exitX,
      exitY,
      delay: idx * 0.09,
      duration: 2.9 + (idx % 6) * 0.2,
    };
  });
}

export function RollingNumberStream({ active }: RollingNumberStreamProps) {
  const particles = useMemo(() => createParticles(), [active]);
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[80] overflow-visible">
      {particles.map((particle) => (
        <motion.span
          key={`${particle.id}-${particle.value}`}
          className="absolute left-1/2 top-1/2 text-lg font-bold tracking-[0.12em] text-brand-white/60 md:text-2xl"
          initial={{ x: particle.fromX, y: particle.fromY, opacity: 0, scale: 0.8 }}
          animate={{
            x: [particle.fromX, 0, particle.exitX],
            y: [particle.fromY, 0, particle.exitY],
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
