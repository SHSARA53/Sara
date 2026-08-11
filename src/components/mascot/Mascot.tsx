import { motion } from "framer-motion";

export type MascotMood = "idle" | "happy" | "celebrating" | "thinking" | "sleepy" | "encouraging";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

const bounceTransition = { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const };

/**
 * Bunny the mascot - the single consistent character used throughout the app.
 * Drawn as inline SVG (no image assets needed) so it stays crisp at any size
 * and can react instantly to mood changes without loading a new file.
 */
export function Mascot({ mood = "idle", size = 140, className = "" }: MascotProps) {
  const eyes = mood === "happy" || mood === "celebrating" ? "closed-happy" : mood === "sleepy" ? "closed-sleepy" : "open";
  const mouthPath =
    mood === "celebrating" || mood === "happy"
      ? "M62 118 Q90 145 118 118"
      : mood === "sleepy"
        ? "M75 122 Q90 126 105 122"
        : mood === "thinking"
          ? "M70 122 Q90 116 110 122"
          : "M70 118 Q90 135 110 118";

  return (
    <motion.div
      className={`inline-block select-none ${className}`}
      animate={
        mood === "celebrating"
          ? { rotate: [0, -8, 8, -6, 6, 0], y: [0, -14, 0, -10, 0] }
          : mood === "idle" || mood === "encouraging"
            ? { y: [0, -8, 0] }
            : {}
      }
      transition={mood === "celebrating" ? { duration: 0.9 } : bounceTransition}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 180 190" width={size} height={size} role="img" aria-label="Bunny mascot">
        {/* ears */}
        <motion.ellipse
          cx="62" cy="42" rx="20" ry="52" fill="#FFFFFF" stroke="#FFD9E8" strokeWidth="4"
          animate={mood === "celebrating" ? { rotate: [-4, 6, -4] } : {}}
          transition={{ duration: 0.6, repeat: mood === "celebrating" ? Infinity : 0 }}
          style={{ transformOrigin: "62px 90px" }}
        />
        <ellipse cx="118" cy="42" rx="20" ry="52" fill="#FFFFFF" stroke="#FFD9E8" strokeWidth="4" />
        <ellipse cx="62" cy="46" rx="10" ry="36" fill="#FFB6C1" />
        <ellipse cx="118" cy="46" rx="10" ry="36" fill="#FFB6C1" />

        {/* head */}
        <circle cx="90" cy="118" r="64" fill="#FFFFFF" stroke="#FFD9E8" strokeWidth="4" />

        {/* cheeks */}
        <ellipse cx="52" cy="128" rx="12" ry="9" fill="#FFD9E8" opacity="0.8" />
        <ellipse cx="128" cy="128" rx="12" ry="9" fill="#FFD9E8" opacity="0.8" />

        {/* eyes */}
        {eyes === "open" && (
          <>
            <circle cx="70" cy="108" r="7" fill="#5B4636" />
            <circle cx="110" cy="108" r="7" fill="#5B4636" />
            <circle cx="72.5" cy="105.5" r="2" fill="#fff" />
            <circle cx="112.5" cy="105.5" r="2" fill="#fff" />
          </>
        )}
        {eyes === "closed-happy" && (
          <>
            <path d="M62 106 Q70 96 78 106" stroke="#5B4636" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M102 106 Q110 96 118 106" stroke="#5B4636" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
        {eyes === "closed-sleepy" && (
          <>
            <path d="M62 108 Q70 112 78 108" stroke="#5B4636" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M102 108 Q110 112 118 108" stroke="#5B4636" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* nose + mouth */}
        <ellipse cx="90" cy="118" rx="8" ry="6" fill="#FF9EB5" />
        <path d={mouthPath} stroke="#5B4636" strokeWidth="4" fill="none" strokeLinecap="round" />

        {mood === "sleepy" && (
          <text x="128" y="60" fontSize="22" fill="#C4A5FF">
            z
          </text>
        )}
      </svg>
    </motion.div>
  );
}
