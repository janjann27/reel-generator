import React from "react";
import { AbsoluteFill } from "remotion";
import { Aside, Backdrop, Highlight, PHOTOS, Slot, Soundtrack, T } from "./shared";

// flamingoconvos "this or that, bf edition". Its own format, not an OweYou reskin.
// Built from that account's reel history (Jun 22-Jul 24):
// - steamy would-you-rather / this-or-that was the 2nd best family (median 1,900 reach, n=10)
// - the audience is women sending to a boyfriend (the 278k dare reel vs its 3.3k "boys" twin)
// - reels there get ~0 comments, so the asks are send + save, never comment
// Two slots flip together, one pair at a time; he has to pick one from each.
// The bottom option lands 3 frames after the top, so the pair reads top-then-bottom.
export const PAIRS: [string, string][] = [
  ["kiss my neck", "kiss my lips"],
  ["lights on", "lights off"],
  ["shower together", "bath together"],
  ["slow and soft", "a little rough"],
  ["you on top", "me on top"],
  ["tonight", "right now 😏"],
];

const CYCLE = 48; // 1.6s per pair = 2 beats at 75 BPM
const OFFSET = 10; // frame 0 lands on a settled pair, so the payoff is on screen immediately
const LAG = 3;
// 6 pairs x 48 = 288 frames = 3 bars of the slow jam, so video and music both loop cleanly.
export const THIS_OR_THAT_DURATION = PAIRS.length * CYCLE; // 9.6s

const SIZE = 88;
const ROW = 150;

export const ThisOrThat: React.FC = () => (
  <AbsoluteFill>
    <Backdrop photo={PHOTOS.cuddleEyes} />

    <Highlight lines={["girls, send this to your bf 😏", "he has to pick one", "from every pair"]} style={{ top: 250, left: T.x }} />

    <div style={{ position: "absolute", top: 780, left: T.x, width: T.width }}>
      <Slot items={PAIRS.map((p) => p[0])} cycle={CYCLE} travel={5} height={ROW} size={SIZE} offset={OFFSET + LAG} />
      <Highlight lines={["or"]} size={44} style={{ position: "relative", margin: "6px 0 10px" }} />
      <Slot items={PAIRS.map((p) => p[1])} cycle={CYCLE} travel={5} height={ROW} size={SIZE} offset={OFFSET} />
    </div>

    {/* One tick per pair (the top slot's step); the bottom lagging 3 frames would double it into a flam. */}
    <Soundtrack slots={[{ cycle: CYCLE, offset: OFFSET + LAG }]} tickVolume={0.3} music="reels/audio/slowjam_75.wav" musicVolume={0.4} />
    <Aside text="save it for later 😌" top={1440} />
  </AbsoluteFill>
);
