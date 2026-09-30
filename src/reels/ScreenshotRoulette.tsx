import React from "react";
import { AbsoluteFill } from "remotion";
import { Aside, Backdrop, Highlight, PHOTOS, Slot, Soundtrack, T } from "./shared";

// "Screenshot roulette". Three slots on different cycles, so wherever the
// viewer screenshots they get a different combo of where / what / how long.
// The screenshot IS the thing they send to their person.
const ROWS: { label: string; items: string[]; cycle: number }[] = [
  {
    label: "where",
    items: ["on the couch", "in bed", "in the shower", "in the kitchen", "in the car", "on the balcony", "in the dark"],
    cycle: 10,
  },
  {
    label: "what",
    items: ["slow kisses", "a massage", "a slow dance", "neck kisses", "cuddles", "a make-out", "whispering"],
    cycle: 13,
  },
  {
    label: "how long",
    items: ["10 seconds", "1 minute", "5 minutes", "a whole song", "all night", "till someone gives in", "no limit"],
    cycle: 16,
  },
];

export const ROULETTE_DURATION = 420; // 14s

export const ScreenshotRoulette: React.FC = () => (
  <AbsoluteFill>
    <Backdrop photo={PHOTOS.cuddleBed} />

    <Highlight lines={["screenshot this 📸", "send it to your person", "no take backs"]} style={{ top: 250, left: T.x }} />

    <div style={{ position: "absolute", top: 760, left: T.x, width: T.width }}>
      {ROWS.map((r, i) => (
        <div key={r.label} style={{ marginBottom: 26 }}>
          <Highlight lines={[r.label]} size={38} style={{ position: "relative" }} />
          <Slot items={r.items} cycle={r.cycle} travel={5} height={100} size={76} offset={i * 7} />
        </div>
      ))}
    </div>

    {/* Three reels tick independently, so each is quieter than the single dare reel. */}
    <Soundtrack slots={ROWS.map((r, i) => ({ cycle: r.cycle, offset: i * 7 }))} tickVolume={0.16} />
    <Aside text="tag your person and say absolutely nothing 🤐" top={1440} />
  </AbsoluteFill>
);
