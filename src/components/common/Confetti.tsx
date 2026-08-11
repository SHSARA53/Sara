import { motion } from "framer-motion";
import { useMemo } from "react";

const PIECES = ["⭐", "🎈", "🌈", "✨", "🎉", "🧸"];

interface ConfettiProps {
  count?: number;
}

/** A short celebratory burst of emoji confetti. Purely decorative and auto-removes itself via the parent's AnimatePresence. */
export function Confetti({ count = 22 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: PIECES[i % PIECES.length],
        x: (Math.random() - 0.5) * 320,
        delay: Math.random() * 0.3,
        rotate: (Math.random() - 0.5) * 260,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-1/3 text-3xl"
          initial={{ x: piece.x, y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 420, opacity: 0, rotate: piece.rotate }}
          transition={{ duration: 1.6, delay: piece.delay, ease: "easeIn" }}
        >
          {piece.emoji}
        </motion.span>
      ))}
    </div>
  );
}
