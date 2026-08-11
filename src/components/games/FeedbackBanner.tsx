import { AnimatePresence, motion } from "framer-motion";
import type { LocalizedText } from "../../models/types";
import { useLang } from "../../hooks/useLang";

interface FeedbackBannerProps {
  visible: boolean;
  kind: "success" | "encourage" | "reveal" | null;
  text: LocalizedText | null;
}

const kindClasses: Record<string, string> = {
  success: "bg-mint text-choco",
  encourage: "bg-sun text-choco",
  reveal: "bg-lilac text-choco",
};

export function FeedbackBanner({ visible, kind, text }: FeedbackBannerProps) {
  const { tr } = useLang();
  return (
    <AnimatePresence>
      {visible && kind && text && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className={`fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-3xl px-6 py-4 text-center text-xl font-bold shadow-lg sm:bottom-8 ${kindClasses[kind]}`}
        >
          {tr(text)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
