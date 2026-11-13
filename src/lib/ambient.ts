/**
 * Playful scenes of the ZeFix board (Modern UI): the Kabelmonster says Servus,
 * chases a bug, peeks in, … Which scene plays when is a pure function of the
 * day's clock, so every board shows the same and a reload continues a scene.
 * The motion itself is CSS (`ambient.css`). Pure and clock-free, like `schedule.ts`.
 */

import type { TimelineState } from "./schedule";
import { isUrgent, parseTime } from "./schedule";

export type AmbientScene =
  | "servus"
  | "bugJagd"
  | "hae"
  | "laeuft"
  | "hilfe"
  | "gfixt"
  | "brotzeit";

export const AMBIENT_SCENES: readonly AmbientScene[] = [
  "servus",
  "bugJagd",
  "hae",
  "laeuft",
  "hilfe",
  "gfixt",
  "brotzeit",
];

/** One scene may start per slot, at the slot's beginning. */
export const SLOT_SECONDS = 75;

/** Length of each scene; keep in sync with the keyframe durations in `ambient.css`. */
export const SCENE_SECONDS: Readonly<Record<AmbientScene, number>> = {
  servus: 12,
  bugJagd: 10,
  hae: 7,
  laeuft: 8,
  hilfe: 8,
  gfixt: 6,
  brotzeit: 12,
};

/** Quiet this long after an item starts (the pixel mouse clicks it) and before a gap ends. */
export const SETTLE_SECONDS = 20;

/** Pause between two runs of a scene pinned via `?szene=`. */
const PINNED_PAUSE_SECONDS = 2;

export interface AmbientShow {
  readonly scene: AmbientScene;
  /** Slot the scene belongs to; a new slot restarts the animation. */
  readonly slot: number;
  /** Seconds since the scene started. */
  readonly elapsed: number;
}

const POOLS = {
  phase: ["bugJagd", "laeuft", "hilfe", "gfixt", "hae", "servus"],
  meal: ["brotzeit", "servus", "hae"],
  break: ["servus", "hae", "laeuft"],
  before: ["servus", "bugJagd", "hae"],
  gap: ["servus", "hae"],
  after: ["servus", "gfixt"],
} as const satisfies Record<string, readonly AmbientScene[]>;

const QUIET: readonly AmbientScene[] = [];

/**
 * Scenes that fit right now; empty means quiet: during talks (someone is on
 * stage), in an item's Endspurt, and around a change of items.
 */
export function scenesFor(tl: TimelineState, nowSeconds: number): readonly AmbientScene[] {
  switch (tl.dayState) {
    case "running": {
      const current = tl.current;
      if (current === null || current.kind === "talk") return QUIET;
      if (isUrgent(tl, nowSeconds)) return QUIET;
      if (nowSeconds - parseTime(current.start) * 60 < SETTLE_SECONDS) return QUIET;
      return POOLS[current.kind];
    }
    case "gap":
      if (tl.untilNextSeconds !== null && tl.untilNextSeconds <= SETTLE_SECONDS) return QUIET;
      return POOLS.gap;
    case "before":
      return POOLS.before;
    case "after":
      return POOLS.after;
  }
}

/** Deterministic integer hash of a slot number (a small xorshift-multiply mix). */
function slotHash(slot: number): number {
  let h = Math.imul(slot ^ 0x5bd1e995, 0x2c1b3c6d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 13;
  return h >>> 0;
}

/** A shuffled order of `0..size-1` for one round, seeded by the round number. */
function shuffled(round: number, size: number): number[] {
  const order = Array.from({ length: size }, (_, i) => i);
  for (let i = size - 1; i > 0; i--) {
    const j = slotHash(round * 31 + i) % (i + 1);
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order;
}

/** Round order of `size` scenes; the first never repeats the previous round's last. */
function roundOrder(round: number, size: number): number[] {
  const order = shuffled(round, size);
  if (size > 1 && order[0] === shuffled(round - 1, size)[size - 1]) {
    return [order[1]!, order[0]!, ...order.slice(2)];
  }
  return order;
}

/**
 * Scene index for a slot: in rounds of `size` slots, each scene once per round
 * in a shuffled order, so a pool never shows the same scene twice in a row.
 */
function pickIndex(slot: number, size: number): number {
  const round = Math.floor(slot / size);
  return roundOrder(round, size)[slot - round * size] ?? 0;
}

/** The scene playing now, or null between scenes and while it's quiet. */
export function ambientAt(tl: TimelineState, nowSeconds: number): AmbientShow | null {
  const pool = scenesFor(tl, nowSeconds);
  if (pool.length === 0) return null;
  const slot = Math.floor(nowSeconds / SLOT_SECONDS);
  const scene = pool[pickIndex(slot, pool.length)];
  if (scene === undefined) return null;
  const elapsed = nowSeconds - slot * SLOT_SECONDS;
  return elapsed < SCENE_SECONDS[scene] ? { scene, slot, elapsed } : null;
}

function isAmbientScene(value: unknown): value is AmbientScene {
  return typeof value === "string" && (AMBIENT_SCENES as readonly string[]).includes(value);
}

/** A scene pinned via `?szene=<name>` for checks (it then loops). */
export function parseAmbientParam(search: string): AmbientScene | null {
  const scene = new URLSearchParams(search).get("szene");
  return isAmbientScene(scene) ? scene : null;
}

/** A pinned scene, looped with a short pause in between. */
export function pinnedShow(scene: AmbientScene, nowSeconds: number): AmbientShow | null {
  const cycle = SCENE_SECONDS[scene] + PINNED_PAUSE_SECONDS;
  const slot = Math.floor(nowSeconds / cycle);
  const elapsed = nowSeconds - slot * cycle;
  return elapsed < SCENE_SECONDS[scene] ? { scene, slot, elapsed } : null;
}
