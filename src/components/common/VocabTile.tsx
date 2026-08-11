import { motion } from "framer-motion";
import type { VocabItem } from "../../models/types";

interface VocabTileProps {
  item: VocabItem;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  wrong?: boolean;
  hinted?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "h-16 w-16 text-3xl",
  md: "h-24 w-24 text-5xl sm:h-28 sm:w-28 sm:text-6xl",
  lg: "h-32 w-32 text-6xl sm:h-40 sm:w-40 sm:text-7xl",
};

function ShapeVisual({ item, className }: { item: VocabItem; className: string }) {
  const color = item.color ?? "#7FCEFF";
  const base = `${className} block`;
  switch (item.shapeKind) {
    case "circle":
      return <span className={base} style={{ background: color, borderRadius: "50%" }} />;
    case "square":
      return <span className={base} style={{ background: color, borderRadius: "18%" }} />;
    case "triangle":
      return (
        <span
          className={className}
          style={{
            width: 0,
            height: 0,
            borderLeft: "45px solid transparent",
            borderRight: "45px solid transparent",
            borderBottom: `78px solid ${color}`,
          }}
        />
      );
    case "rectangle":
      return <span className={base} style={{ background: color, borderRadius: "18%", width: "85%", height: "60%" }} />;
    default:
      return <span className={base} style={{ background: color, borderRadius: "50%" }} />;
  }
}

export function VocabTile({ item, size = "md", selected, wrong, hinted, onClick, disabled, label }: VocabTileProps) {
  const interactive = Boolean(onClick);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || !interactive}
      whileTap={interactive ? { scale: 0.9 } : undefined}
      whileHover={interactive ? { scale: 1.05 } : undefined}
      animate={
        wrong
          ? { x: [0, -8, 8, -8, 8, 0] }
          : hinted
            ? { scale: [1, 1.12, 1] }
            : selected
              ? { scale: 1.08 }
              : { scale: 1 }
      }
      transition={{ duration: wrong ? 0.5 : 0.5, repeat: hinted ? Infinity : 0, repeatDelay: 0.4 }}
      className={`no-select flex flex-col items-center justify-center gap-1 rounded-3xl border-4 bg-white p-2 shadow-md disabled:opacity-30 ${sizeClasses[size]} ${
        selected ? "border-mint-dark" : hinted ? "border-sun-dark" : "border-transparent"
      } ${interactive ? "cursor-pointer" : ""}`}
      aria-label={label}
    >
      {item.renderAs === "shape" ? (
        <ShapeVisual item={item} className="h-[65%] w-[65%]" />
      ) : item.renderAs === "swatch" ? (
        <span className="h-[65%] w-[65%] rounded-full" style={{ background: item.color }} />
      ) : (
        <span aria-hidden>{item.emoji}</span>
      )}
    </motion.button>
  );
}
