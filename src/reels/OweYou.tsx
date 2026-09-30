import React from "react";
import { AbsoluteFill } from "remotion";
import { Aside, Backdrop, Highlight, PHOTOS, Slot, Soundtrack, T } from "./shared";

// "What your person owes you". ScreenshotRoulette's successor, fixing why it
// stalled (700 reach, 0 comments, 4.2s avg watch):
// - one slot, not three, so a pause reads in one glance
// - a result is already on screen at frame 0, so the payoff comes before the ask
// - the ask is a comment + an in-app send (both ranked), not a screenshot (not ranked)
// - one jackpot and one bust give people something to brag or laugh about in comments,
//   and a reason to replay for the jackpot
// - 9.6s and seamless (video and music), so replays read as watch time, not restarts
export const OWED: string[] = [
  "slow kisses. no rushing.",
  "a 10 minute massage",
  "the good side of the bed",
  "neck kisses till you say stop",
  "breakfast in bed",
  "nothing. you owe them 💀",
  "a make-out like it's day one",
  "they stay awake for your movie",
  "whatever you whisper later",
  "a slow dance in the kitchen",
  "cuddles, phones off",
  "JACKPOT 🎰 everything",
];

const CYCLE = 12; // an eighth note at 75 BPM, same pace as PauseDare
const OFFSET = 10; // frame 0 lands on items[0] after the words settle, not mid-slide
// Two passes of a 12-line list = 3 bars of the slow jam, so video and music both loop cleanly.
export const OWE_YOU_DURATION = OWED.length * CYCLE * 2; // 288 frames, 9.6s

// flamingoconvos variant. That account's best post ever (reel DbFJpBFFdCa, 278k reach,
// 12.5k shares) was "Girls, I dare you to send this to your boyfriend. Whatever he
// screenshots, you have to do it." Its "Boys ... girlfriend" twin the same day did 3.3k,
// so this one is written for her to send to him. No comment line: reels there get ~0
// comments; shares and saves are what move.
export const OWED_BF: string[] = [
  "slow kisses. no rushing.",
  "a 10 minute massage",
  "the good side of the bed",
  "neck kisses till you say stop",
  "breakfast in bed",
  "nothing. you owe HIM 💀",
  "a make-out like it's day one",
  "he stays awake for your movie",
  "whatever you whisper later",
  "a slow dance in the kitchen",
  "cuddles, phone off",
  "JACKPOT 🎰 everything",
];

export type OweYouProps = {
  items: string[];
  header: string[];
  asides: string[];
  photo: string;
};

export const OWE_YOU_MC: OweYouProps = {
  items: OWED,
  header: ["pause it ✋", "your person owes you", "whatever it lands on 😏"],
  asides: ["comment what you got 👇", "then send it to them. no take backs"],
  photo: PHOTOS.kissNight,
};

export const OWE_YOU_BF: OweYouProps = {
  items: OWED_BF,
  header: ["girls, send this to your bf 😏", "whatever he pauses on", "he owes you"],
  asides: ["no take backs 🤐"],
  photo: PHOTOS.kissStars,
};

export const OweYou: React.FC<OweYouProps> = ({ items, header, asides, photo }) => (
  <AbsoluteFill>
    <Backdrop photo={photo} />

    <Highlight lines={header} style={{ top: 250, left: T.x }} />

    <div style={{ position: "absolute", top: 820, left: T.x, width: T.width }}>
      <Slot items={items} cycle={CYCLE} travel={5} height={220} size={92} offset={OFFSET} />
    </div>

    {/* Slow jam is exactly this reel's length and loops seamlessly; a bit hotter than the lo-fi, so quieter. */}
    <Soundtrack slots={[{ cycle: CYCLE, offset: OFFSET }]} tickVolume={0.3} music="reels/audio/slowjam_75.wav" musicVolume={0.4} />
    {asides.map((a, i) => (
      <Aside key={a} text={a} top={1400 + i * 60} />
    ))}
  </AbsoluteFill>
);
