import React from "react";
import { AbsoluteFill } from "remotion";
import { Aside, Backdrop, Highlight, PHOTOS, Slot, Soundtrack, T } from "./shared";

// "Tap to pause" game. Instagram pauses a reel on one tap (since 2026-03), so a
// spinning dare turns every viewer into a player: they pause, read the dare,
// and send it to their person. Replays to land a different one are watch time.
// Suggestive, never graphic: same ceiling as the gpt lanes.
export const DARES: string[] = [
  "kiss their neck for 10 seconds",
  "slow dance in the kitchen",
  "30 seconds. no touching.",
  "they pick your outfit tomorrow",
  "whisper what you want later",
  "shower together tonight",
  "make out like it's day one",
  "5 min massage, no stopping",
  "bite their lip. gently.",
  "phones off. lights off.",
  "they're the little spoon tonight",
  "tell them your biggest fantasy",
  "sit on their lap next episode",
  "forehead kisses for an hour",
  "kiss wherever they point",
  "cuddle till someone falls asleep",
];

export const PAUSE_DARE_DURATION = 450; // 15s
const CYCLE = 12; // 0.4s = an eighth note at the soundtrack's 75 BPM

export const PauseDare: React.FC = () => (
  <AbsoluteFill>
    <Backdrop photo={PHOTOS.kissBed} />

    <Highlight lines={["tap to pause ✋", "send your person", "whatever it lands on 😏"]} style={{ top: 250, left: T.x }} />

    <div style={{ position: "absolute", top: 820, left: T.x, width: T.width }}>
      <Slot items={DARES} cycle={CYCLE} travel={5} height={220} size={92} />
    </div>

    <Soundtrack slots={[{ cycle: CYCLE }]} tickVolume={0.35} />
    <Aside text="tag your person and say absolutely nothing 🤐" top={1440} />
  </AbsoluteFill>
);
