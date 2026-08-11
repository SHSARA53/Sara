import { useRef, useState } from "react";
import { motion } from "framer-motion";

const HOLD_MS = 3000;

interface ParentGateButtonProps {
  onUnlock: () => void;
}

/**
 * A deliberately small, low-contrast icon (never a big obvious "Parent Mode"
 * button) tucked in a corner. A toddler brushing past it does nothing; only
 * a sustained 3-second press unlocks parent mode.
 */
export function ParentGateButton({ onUnlock }: ParentGateButtonProps) {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const clear = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    startRef.current = null;
    setProgress(0);
  };

  const tick = (timestamp: number) => {
    if (startRef.current === null) startRef.current = timestamp;
    const elapsed = timestamp - startRef.current;
    const pct = Math.min(1, elapsed / HOLD_MS);
    setProgress(pct);
    if (pct >= 1) {
      clear();
      onUnlock();
      return;
    }
    frameRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    startRef.current = null;
    frameRef.current = requestAnimationFrame(tick);
  };

  const circumference = 2 * Math.PI * 16;

  return (
    <button
      type="button"
      aria-label="Parent zone"
      onPointerDown={start}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      className="no-select fixed bottom-3 opacity-40 hover:opacity-70 end-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/60"
    >
      <svg viewBox="0 0 40 40" className="absolute h-11 w-11 -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#e8ddce" strokeWidth="3" />
        <motion.circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="#c4a5ff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className="text-sm">🌿</span>
    </button>
  );
}
