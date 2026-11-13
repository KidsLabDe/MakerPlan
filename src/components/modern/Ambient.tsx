import { useState } from "react";
import type { CSSProperties } from "react";
import type { AmbientScene, AmbientShow } from "../../lib/ambient";
import { SCENE_SECONDS } from "../../lib/ambient";
import servus from "../../assets/ambient/servus.png";
import hae from "../../assets/ambient/hae.png";
import zefix from "../../assets/ambient/zefix.png";
import gfixt from "../../assets/ambient/gfixt.png";
import laeuft from "../../assets/ambient/laeuft.png";
import hilfe from "../../assets/ambient/hilfe.png";
import brotzeit from "../../assets/ambient/brotzeit.png";
import bug from "../../assets/ambient/bug.png";
import "./ambient.css";

/** The figures of each scene (ZeFix Signal stickers and the bug cable from zefix.org). */
const CAST: Readonly<Record<AmbientScene, readonly { role: string; src: string }[]>> = {
  servus: [{ role: "walker", src: servus }],
  bugJagd: [
    { role: "bug", src: bug },
    { role: "chaser", src: zefix },
  ],
  hae: [{ role: "peek", src: hae }],
  laeuft: [{ role: "lean", src: laeuft }],
  hilfe: [{ role: "hop", src: hilfe }],
  gfixt: [{ role: "pop", src: gfixt }],
  brotzeit: [{ role: "walker", src: brotzeit }],
};

/** One run of a scene. Keyed by slot, so each run mounts (and animates) afresh. */
function SceneRun({ show }: { show: AmbientShow }) {
  // Start the keyframes `elapsed` seconds in, so a reload continues the scene.
  // Taken once on mount: changing the delay later would shift a running animation.
  const [delay] = useState(() => -show.elapsed);
  const style = {
    "--ambient-len": `${SCENE_SECONDS[show.scene]}s`,
    "--ambient-delay": `${delay}s`,
  } as CSSProperties;
  return (
    <div className={`ambient__scene ambient__scene--${show.scene}`} style={style}>
      {CAST[show.scene].map(({ role, src }) => (
        <div key={role} className={`ambient__actor ambient__actor--${role}`}>
          <img className="ambient__img" src={src} alt="" />
        </div>
      ))}
    </div>
  );
}

/** Playful ZeFix scenes over the board (board mode only; purely decorative). */
export function Ambient({ show }: { show: AmbientShow | null }) {
  return (
    <div className="ambient" aria-hidden="true" data-testid="ambient">
      {show !== null && <SceneRun key={`${show.scene}-${show.slot}`} show={show} />}
    </div>
  );
}
