export type GrowthTier = "seed" | "sprouting" | "blooming" | "flourishing";

/**
 * How "grown" a world looks based on activities explored vs. its target.
 * Purely cosmetic (more background decorations, warmer feel) - it never
 * gates access to anything, per the "child is never blocked" requirement.
 */
export function growthTier(activitiesExplored: number, target: number): GrowthTier {
  const ratio = target > 0 ? activitiesExplored / target : 0;
  if (ratio >= 1) return "flourishing";
  if (ratio >= 0.66) return "blooming";
  if (ratio >= 0.33) return "sprouting";
  return "seed";
}

export function decorationCountForTier(tier: GrowthTier): number {
  switch (tier) {
    case "seed":
      return 3;
    case "sprouting":
      return 6;
    case "blooming":
      return 9;
    case "flourishing":
      return 14;
  }
}
