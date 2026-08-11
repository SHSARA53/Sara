import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface BigButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  "aria-label"?: string;
}

const variantClasses: Record<string, string> = {
  primary: "bg-berry text-white shadow-lg shadow-[#ff8fab55]",
  secondary: "bg-sky-dark text-white shadow-lg shadow-[#7fceff55]",
  ghost: "bg-white text-choco border-2 border-[#ffd9e8]",
};

export function BigButton({
  children,
  variant = "primary",
  fullWidth,
  className = "",
  onClick,
  disabled,
  type = "button",
  ...rest
}: BigButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={rest["aria-label"]}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.03 }}
      className={`no-select rounded-[2rem] px-8 py-5 text-xl font-bold md:text-2xl disabled:opacity-40 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </motion.button>
  );
}
