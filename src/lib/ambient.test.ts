import { describe, expect, it } from "vitest";
import type { AgendaItem } from "../types";
import { buildTimeline } from "./schedule";
import {
  AMBIENT_SCENES,
  SCENE_SECONDS,
  SETTLE_SECONDS,
  SLOT_SECONDS,
  ambientAt,
  parseAmbientParam,
  pinnedShow,
  scenesFor,
} from "./ambient";

const schedule: AgendaItem[] = [
  { id: "a", start: "09:00", end: "12:00", title: "Hackathon", kind: "phase" },
  { id: "b", start: "12:00", end: "13:00", title: "Mittagessen", kind: "meal" },
  { id: "c", start: "13:00", end: "14:00", title: "Abschlusspräsentation", kind: "talk" },
  { id: "d", start: "15:00", end: "16:00", title: "Hackathon", kind: "phase" },
];

const hm = (h: number, m: number, s = 0) => h * 3600 + m * 60 + s;
const at = (seconds: number) => ambientAt(buildTimeline(schedule, seconds), seconds);
/** A moment `offset` seconds into slot `slot`. */
const inSlot = (slot: number, offset = 1) => slot * SLOT_SECONDS + offset;
/** Slots that lie fully inside [from, to). */
function slotsBetween(from: number, to: number): number[] {
  const first = Math.ceil(from / SLOT_SECONDS);
  const last = Math.floor(to / SLOT_SECONDS) - 1;
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => first + i);
}

describe("scenesFor", () => {
  it("should stay quiet during a talk", () => {
    const now = hm(13, 30);
    expect(scenesFor(buildTimeline(schedule, now), now)).toEqual([]);
  });

  it("should stay quiet in the Endspurt of an item", () => {
    const now = hm(11, 57);
    expect(scenesFor(buildTimeline(schedule, now), now)).toEqual([]);
  });

  it("should stay quiet right after an item started, while the mouse clicks it", () => {
    const now = hm(9, 0, SETTLE_SECONDS - 1);
    expect(scenesFor(buildTimeline(schedule, now), now)).toEqual([]);
  });

  it("should stay quiet right before the next item starts in a gap", () => {
    const now = hm(14, 59, 60 - SETTLE_SECONDS + 1);
    expect(scenesFor(buildTimeline(schedule, now), now)).toEqual([]);
  });

  it("should bring Brotzeit at lunch", () => {
    const now = hm(12, 30);
    expect(scenesFor(buildTimeline(schedule, now), now)).toContain("brotzeit");
  });

  it("should chase bugs during a work phase, but never bring Brotzeit", () => {
    const now = hm(10, 0);
    const pool = scenesFor(buildTimeline(schedule, now), now);
    expect(pool).toContain("bugJagd");
    expect(pool).not.toContain("brotzeit");
  });

  it("should say Servus before the day starts and in a gap", () => {
    for (const now of [hm(8, 0), hm(14, 30)]) {
      expect(scenesFor(buildTimeline(schedule, now), now)).toContain("servus");
    }
  });
});

describe("ambientAt", () => {
  const phaseSlots = slotsBetween(hm(9, 1), hm(11, 50));

  it("should start a scene at the beginning of a slot", () => {
    const slot = phaseSlots[0]!;
    const show = at(inSlot(slot));
    expect(show).not.toBeNull();
    expect(show?.slot).toBe(slot);
    expect(show?.elapsed).toBe(1);
  });

  it("should end the scene after its length, until the next slot", () => {
    const slot = phaseSlots[0]!;
    const show = at(inSlot(slot))!;
    expect(at(inSlot(slot, SCENE_SECONDS[show.scene] - 0.5))?.scene).toBe(show.scene);
    expect(at(inSlot(slot, SCENE_SECONDS[show.scene]))).toBeNull();
    expect(at(inSlot(slot, SLOT_SECONDS - 1))).toBeNull();
  });

  it("should pick the same scene for the same moment (a reload continues it)", () => {
    const now = inSlot(phaseSlots[3]!, 2.5);
    expect(at(now)).toEqual(at(now));
  });

  it("should only pick scenes that fit the running item", () => {
    for (const slot of phaseSlots) {
      const now = inSlot(slot);
      const show = at(now);
      expect(scenesFor(buildTimeline(schedule, now), now)).toContain(show?.scene);
    }
  });

  it("should never show the same scene twice in a row", () => {
    const scenes = phaseSlots.map((slot) => at(inSlot(slot))?.scene);
    for (let i = 1; i < scenes.length; i++) {
      expect(scenes[i]).not.toBe(scenes[i - 1]);
    }
  });

  it("should get round to every scene of a work phase", () => {
    const seen = new Set(phaseSlots.map((slot) => at(inSlot(slot))?.scene));
    const pool = scenesFor(buildTimeline(schedule, hm(10, 0)), hm(10, 0));
    expect([...seen].sort()).toEqual([...pool].sort());
  });

  it("should show nothing during a talk", () => {
    for (const slot of slotsBetween(hm(13, 0), hm(14, 0))) {
      expect(at(inSlot(slot))).toBeNull();
    }
  });
});

describe("parseAmbientParam", () => {
  it("should read a scene pinned via ?szene=", () => {
    expect(parseAmbientParam("?szene=bugJagd")).toBe("bugJagd");
  });

  it("should ignore a missing or unknown ?szene=", () => {
    expect(parseAmbientParam("")).toBeNull();
    expect(parseAmbientParam("?szene=tanzen")).toBeNull();
  });
});

describe("pinnedShow", () => {
  it("should loop a pinned scene with a short pause in between", () => {
    const length = SCENE_SECONDS.servus + 2;
    expect(pinnedShow("servus", 0)).toEqual({ scene: "servus", slot: 0, elapsed: 0 });
    expect(pinnedShow("servus", length + 1)).toEqual({ scene: "servus", slot: 1, elapsed: 1 });
    expect(pinnedShow("servus", SCENE_SECONDS.servus + 1)).toBeNull();
  });

  it("should know every scene's length", () => {
    for (const scene of AMBIENT_SCENES) {
      expect(SCENE_SECONDS[scene]).toBeGreaterThan(0);
      expect(SCENE_SECONDS[scene]).toBeLessThan(SLOT_SECONDS);
    }
  });
});
