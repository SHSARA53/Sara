import type { ThemeKey } from "../models/types";

/** Shared theme→color mapping so world/topic cards, progress rings and backgrounds all agree on the same palette. */
export const themeBgClass: Record<ThemeKey, string> = {
  bubblegum: "bg-bubblegum",
  sky: "bg-sky",
  sun: "bg-sun",
  mint: "bg-mint",
  lilac: "bg-lilac",
  peach: "bg-peach",
  berry: "bg-[#ffd0dc]",
};

export const themeAccentHex: Record<ThemeKey, string> = {
  bubblegum: "#ff9eb5",
  sky: "#7fceff",
  sun: "#ffc93c",
  mint: "#7fe0ab",
  lilac: "#c4a5ff",
  peach: "#ffab73",
  berry: "#ff8fab",
};

export const themeGradientClass: Record<ThemeKey, string> = {
  bubblegum: "from-bubblegum to-[#fff1f6]",
  sky: "from-sky to-[#eef8ff]",
  sun: "from-sun to-[#fff8e0]",
  mint: "from-mint to-[#eefcf3]",
  lilac: "from-lilac to-[#f5f0ff]",
  peach: "from-peach to-[#fff3e8]",
  berry: "from-[#ffd0dc] to-[#fff1f4]",
};
