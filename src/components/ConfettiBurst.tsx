import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

interface ConfettiBurstProps {
  trigger: number;
}

export function ConfettiBurst({ trigger }: ConfettiBurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, idx) => ({
        id: idx,
        angle: (360 / 22) * idx,
        distance: 120 + Math.random() * 180,
        rotation: -160 + Math.random() * 320,
        color: ["#0066B2", "#7C7B7F", "#FFFFFF", "#001F35"][idx % 4],
      })),
    [trigger],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {trigger > 0 &&
          particles.map((particle) => (
            <motion.span
              key={`${trigger}-${particle.id}`}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-[3px]"
              style={{ backgroundColor: particle.color }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{
                x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
                y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
                opacity: [0, 1, 0],
                rotate: particle.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
