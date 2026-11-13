import { useState } from "react";
import type { CSSProperties } from "react";
import { ambientAt, parseAmbientParam, pinnedShow } from "../../lib/ambient";
import type { BoardModel } from "../../hooks/useBoardModel";
import type { Theme } from "../../hooks/useTheme";
import mascot from "../../assets/zefix-mascot-animiert.gif";
import { Header } from "../Header";
import { Ambient } from "./Ambient";
import { NowPanel } from "../NowPanel";
import { PixelCursor } from "../PixelCursor";
import { Ticker } from "../Ticker";
import { Timeline } from "../Timeline";

interface ModernBoardProps {
  board: BoardModel;
  scale: number;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleUi: () => void;
}

/** The Modern UI: ZeFix-styled board with hero, Tagesplan and ticker. */
export function ModernBoard({ board, scale, theme, onToggleTheme, onToggleUi }: ModernBoardProps) {
  const { data, timeline, plan, click } = board;
  // `?szene=<name>` pins one scene (looped) for checks; otherwise the day's clock picks.
  const [pinned] = useState(() => parseAmbientParam(window.location.search));
  const show =
    pinned !== null ? pinnedShow(pinned, board.nowSeconds) : ambientAt(timeline, board.nowSeconds);
  return (
    <div className="board" style={{ "--board-scale": scale } as CSSProperties}>
      <Header
        title={data.boardTitle}
        now={board.now}
        testTime={board.testTime}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onToggleUi={onToggleUi}
      />

      <main className="board__main">
        <NowPanel
          timeline={timeline}
          nowSeconds={board.nowSeconds}
          resumeLead={board.resumeLead}
          dayName={board.dayName}
        />
        <div className="board__side">
          <Timeline
            entries={plan.timeline.entries}
            remainingSeconds={plan.timeline.remainingSeconds}
            dayLabel={plan.label}
            preview={plan.preview}
          />
          {/* ZeFix-Kabelmonster from zefix.org (wobbly eyes, talking mouth); purely decorative. */}
          <img className="mascot" src={mascot} alt="" aria-hidden="true" />
        </div>
      </main>

      <Ticker messages={data.messages ?? []} />

      <Ambient show={show} />

      {click !== null && (
        <PixelCursor
          key={click.key}
          targetId={click.id}
          lateMs={click.lateMs}
          onDone={board.clearClick}
        />
      )}
    </div>
  );
}
