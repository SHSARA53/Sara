import { motion } from "framer-motion";
import { useLang } from "../../hooks/useLang";

interface ProgressBarProps {
  value: number; // 0-100
  colorClass?: string;
  heightClass?: string;
}

/**
 * A plain `width` fill always grows from the physical left edge no matter
 * what `dir` is set to (block boxes with an explicit width aren't
 * direction-aware). For Hebrew that reads as visually backwards - the bar
 * should fill toward the reading direction. `scaleX` anchored at the
 * dir-appropriate edge fixes that, and is cheaper to animate than `width`.
 */
export function ProgressBar({ value, colorClass = "bg-mint-dark", heightClass = "h-4" }: ProgressBarProps) {
  const { dir } = useLang();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-[#f1e9df] ${heightClass}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`h-full w-full rounded-full ${colorClass}`}
        style={{ transformOrigin: dir === "rtl" ? "right" : "left" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: clamped / 100 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}
