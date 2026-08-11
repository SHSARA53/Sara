import type { Lang } from "../../models/types";

export interface ActivityOutcome {
  vocabResults: { vocabId: string; correct: boolean }[];
  attempts: number;
  hintsUsed: number;
}

export interface SubActivityProps {
  lang: Lang;
  onResolved: (outcome: ActivityOutcome) => void;
}
