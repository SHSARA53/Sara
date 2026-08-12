import { useMemo } from "react";
import { motion } from "framer-motion";

interface AmbientDecorationsProps {
  emojis: string[];
  count?: number;
  className?: string;
}

/**
 * Gentle floating background decoration (clouds, stars, flowers...) used to
 * give the world map and world screens a storybook feel. Purely decorative
 * (aria-hidden), lightweight (CSS/SVG transforms only, no images), and the
 * count is deliberately small so it never overwhelms the actual content or
 * costs meaningful render/animation budget on low-end devices.
 */
export function AmbientDecorations({ emojis, count = 8, className = "" }: AmbientDecorationsProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: emojis[i % emojis.length],
        left: `${(i * 37 + 5) % 92}%`,
        top: `${(i * 53 + 8) % 90}%`,
        delay: (i % 5) * 0.6,
        duration: 3.2 + (i % 4) * 0.6,
        size: 20 + (i % 3) * 8,
      })),
    [emojis, count],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute opacity-70"
          style={{ left: piece.left, top: piece.top, fontSize: piece.size }}
          animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
          transition={{ duration: piece.duration, repeat: Infinity, delay: piece.delay, ease: "easeInOut" }}
        >
          {piece.emoji}
        </motion.span>
      ))}
    </div>
  );
}
