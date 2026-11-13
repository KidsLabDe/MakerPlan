import { useCallback, useState } from "react";
import type { HackdayDay } from "../types";
import type { UiChoice, UiVariant } from "../lib/uiChoice";
import { activeUi, makeChoice, parseChoice, parseUiParam } from "../lib/uiChoice";

const STORAGE_KEY = "mys-ui";

function storedChoice(): UiChoice | null {
  try {
    return parseChoice(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * The board UI: Modern by default; a switch is persisted for the current (or
 * next) event only and falls back to Modern once that event is over. `?ui=`
 * overrides it until the visitor toggles.
 */
export function useUiChoice(
  days: readonly HackdayDay[],
  now: Date,
): { ui: UiVariant; toggle: () => void } {
  const [forced, setForced] = useState(() => parseUiParam(window.location.search));
  const [choice, setChoice] = useState(storedChoice);

  const choose = useCallback(
    (ui: UiVariant) => {
      const next = makeChoice(ui, days, now);
      if (next === null) return;
      setForced(null);
      setChoice(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); the choice then lasts until reload.
      }
    },
    [days, now],
  );

  const ui = forced ?? activeUi(choice, days, now);
  const toggle = useCallback(() => choose(ui === "pixel" ? "modern" : "pixel"), [choose, ui]);

  return { ui, toggle };
}
