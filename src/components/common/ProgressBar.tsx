import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
  colorClass?: string;
  heightClass?: string;
}

export function ProgressBar({ value, colorClass = "bg-mint-dark", heightClass = "h-4" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full overflow-hidden rounded-full bg-[#f1e9df] ${heightClass}`}>
      <motion.div
        className={`h-full rounded-full ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}
