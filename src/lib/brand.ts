/**
 * ZeFix brand constants, from the ZeFix Gestaltungskonzept (Piep, 06/2026).
 *
 * Primary color is Petrol `#297d96` (hue 194); the display typeface is
 * "Schoolbell" and body copy is "Carlito" (≈ Calibri). These are mirrored as
 * CSS custom properties in `index.css` — keep the two in sync.
 */

import type { AgendaKind } from "../types";

export const BRAND = {
  name: "ZeFix!",
  tagline: "Code & Culture Jugend-Hackathon",
  primaryHue: 194,
} as const;

export type HeroTitleSize = "xl" | "lg" | "md";

/**
 * Size tier for the hero title (112 / 92 / 76px on the board), picked so a
 * title fits in at most two lines of Pixelify Sans: by total length, and by
 * its longest word, which must fit on one line on its own.
 */
export function heroTitleSize(title: string): HeroTitleSize {
  const longestWord = Math.max(0, ...title.split(/\s+/).map((w) => w.length));
  if (title.length <= 22 && longestWord <= 14) return "xl";
  if (title.length <= 28 && longestWord <= 17) return "lg";
  return "md";
}

/** Human-readable German labels for each agenda kind. */
export const KIND_LABELS: Readonly<Record<AgendaKind, string>> = {
  phase: "Arbeitsphase",
  meal: "Essen",
  break: "Pause",
  talk: "Programm",
};

/**
 * Palette tone per agenda kind, mapped to the `--tone-*` / `--cat-*` CSS
 * variables so an item's color is consistent everywhere it appears.
 */
export const KIND_TONE: Readonly<Record<AgendaKind, string>> = {
  phase: "blue",
  meal: "orange",
  break: "green",
  talk: "purple",
};
