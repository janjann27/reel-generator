/* morecouplesss "viral carousel -> reel" series, dark text-only look.
 * Each reel re-cuts one of the account's most-reached carousels (Firestore
 * strategies/gpt_abcd_gen/posts, read 2026-10-12; numbers in
 * _ops/mc_viral_reels_2026-10-12/viral.json).
 *
 * Why these posts: the hot me/you and physical this-or-that ABCD carousels were the
 * account's biggest posts Aug 29-Oct 11 (7.5k-33k reach vs 535 median), and its own
 * reel history says reels reach ~2.4x carousels (median 509 vs 210).
 *
 * Changes from the carousels (_ops/four_accounts_growth_2026-10-12/FINDINGS.md):
 * gender-neutral, short hook, no "(x edition)" tails, flirty never graphic, and no ad
 * copy in the video (the send ask lives in `caption`, same rule as Memes).
 *
 * Look (v2; the photo + IG-sticker v1 was rejected): near-black screen, no photo.
 * The hook sits small at the top the whole time. Each question types in word by word,
 * big and white; on the next bar's downbeat the answers punch in, in pink.
 * Timing (night_120.wav, 120 BPM): one question = 2 bars = 120f = one music loop.
 *   0-~40 typing · 60 answers land · 119 hard cut to the next question.
 * Frame 0 is a finished question with its answers (the thumbnail); OFFSET shifts video
 * and music together so the loop point still sits on a downbeat.
 */
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";

const inter = loadFont("normal", { weights: ["600", "800"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;
const emoji = loadEmoji("normal", { ignoreTooManyRequestsWarning: true }).fontFamily;

export type ViralGameProps = {
  /** Small line at the top, on screen the whole time. */
  hook: string;
  /** One per 4s. Keep them under ~45 chars so they stay 3 lines at 96px. */
  questions: string[];
  /** Punched in under each question, e.g. "me or you". */
  answers: string;
  /** For the queue script; never rendered. */
  caption: string;
  /** Source carousel, for the read-out. */
  source: { postQueueId: string; permalink: string; reach: number; shares: number };
};

const C = {
  bg: "#0a0909",
  ink: "#f7f3f0",
  dim: "rgba(247,243,240,0.7)",
  pink: "#ff4f8b",
  font: `${inter}, ${emoji}`,
};
const CYCLE = 120; // 2 bars at 120 BPM
const WORD = 4; // frames between typed words
const ANSWER_AT = 60; // downbeat of bar 2
const OFFSET = 75; // frame 0 = question 1 finished, answers up
const X = 90;
export const viralGameDuration = (p: ViralGameProps) => p.questions.length * CYCLE;

const Question: React.FC<{ text: string; answers: string; local: number }> = ({ text, answers, local }) => {
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const pop = spring({ frame: local - ANSWER_AT, fps, config: { damping: 13, mass: 0.5, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: X, right: X, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontFamily: C.font, fontWeight: 800, fontSize: 96, lineHeight: 1.08, letterSpacing: "-0.03em", color: C.ink }}>
        {words.map((w, i) => {
          const f = local - i * WORD;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.24em",
                opacity: interpolate(f, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                transform: `translateY(${interpolate(f, [0, 4], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 56,
          fontFamily: C.font,
          fontWeight: 800,
          fontSize: 76,
          letterSpacing: "-0.02em",
          color: C.pink,
          opacity: local >= ANSWER_AT ? 1 : 0,
          transform: `scale(${0.82 + 0.18 * pop})`,
          transformOrigin: "left center",
        }}
      >
        {answers}
      </div>
    </div>
  );
};

export const ViralGame: React.FC<ViralGameProps> = ({ hook, questions, answers }) => {
  const frame = useCurrentFrame() + OFFSET;
  const n = questions.length;
  const step = Math.floor(frame / CYCLE) % n;
  const local = frame % CYCLE;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Soft vignette so the black is not flat. */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 45%, rgba(255,79,139,0.07) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 230, left: X, right: X, fontFamily: C.font, fontWeight: 600, fontSize: 50, color: C.dim, letterSpacing: "-0.01em" }}>
        {hook}
      </div>
      <Question key={step} text={questions[step]} answers={answers} local={local} />
      <div style={{ position: "absolute", bottom: 330, left: X, fontFamily: C.font, fontWeight: 600, fontSize: 40, color: C.dim }}>
        {step + 1}/{n}
      </div>
      {/* The loop is exactly one question long, so starting it OFFSET frames in keeps the beat on the cut. */}
      <Sequence from={-OFFSET} layout="none">
        <Audio src={staticFile("reels/audio/night_120.wav")} loop volume={0.55} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Top 5 morecouplesss carousels by reach (2 days after posting), Aug 29-Oct 11 2026.
export const VIRAL_GAMES: (ViralGameProps & { id: string })[] = [
  {
    id: "ViralWhoFoldsFirst",
    // gpt_abcd_gen, who_is_more_likely: 33,410 reach, 3,067 shares (the account's #1)
    source: { postQueueId: "2RwdRAF08uv6gGuy7X0z", permalink: "https://www.instagram.com/p/DdWz2plmnSB/", reach: 33410, shares: 3067 },
    hook: "who folds first in bed? 🫦",
    questions: [
      "who starts kissing again after “we should sleep”?",
      "who gets needy for cuddles first?",
      "who reaches for a thigh on the couch?",
      "who blushes first when neck kisses start?",
      "who says “stop teasing” while smiling?",
      "who loses the no-touching dare first?",
    ],
    answers: "me, you or both",
    caption: "who folds first? 🫦 send this to your person and count your points",
  },
  {
    id: "ViralNoTouching",
    // gpt_abcd_gen, me_you_binary: 17,159 reach, 433 shares
    source: { postQueueId: "NWX4baiGR5rEKEuGlMBe", permalink: "https://www.instagram.com/p/Dd00zqam-b7/", reach: 17159, shares: 433 },
    hook: "no touching till midnight 🫦",
    questions: [
      "who breaks the rule first?",
      "who keeps staring at lips?",
      "who goes for a neck kiss?",
      "who turns cuddling into teasing?",
      "who ends up breathless first?",
      "who whispers “bed” before midnight?",
    ],
    answers: "me or you",
    caption: "no touching till midnight. who lasts? 🫦 send this to your person",
  },
  {
    id: "ViralLipsOrNeck",
    // gpt_abcd_gen, physical_this_or_that: 15,522 reach ("Pick his lips or neck?", neutralised)
    source: { postQueueId: "rCGDepNKFxI37ln9SCCb", permalink: "https://www.instagram.com/p/DdYwnl9m6FA/", reach: 15522, shares: 99 },
    hook: "lips or neck? 😏",
    questions: [
      "first thing after hello",
      "on the couch at night",
      "right before bed",
      "when you’re teasing them",
      "against the kitchen counter",
      "under the covers",
    ],
    answers: "lips or neck",
    caption: "lips or neck? 😏 send this to your person and compare",
  },
  {
    id: "ViralAfterShower",
    // gpt_abcd_gen, me_you_binary: 9,934 reach, 253 shares
    source: { postQueueId: "9SYu0HFJGjM4ioJ02kq9", permalink: "https://www.instagram.com/p/DdxQ7ynmWoF/", reach: 9934, shares: 253 },
    hook: "us after the shower… 🫦",
    questions: [
      "who fogs up the mirror first?",
      "who starts the first kiss?",
      "who pulls the other closer?",
      "who steals the towel?",
      "who says “we’re gonna be late”?",
      "who turns pillow talk naughty?",
    ],
    answers: "me or you",
    caption: "us after the shower… 🫦 send this to your person",
  },
  {
    id: "ViralOneBed",
    // gpt_abcd_gen, who_is_more_likely: 9,159 reach, 345 shares
    source: { postQueueId: "4E4foKlSH63bIFO38tHq", permalink: "https://www.instagram.com/p/DeMUi48G_WN/", reach: 9159, shares: 345 },
    hook: "one bed, no sleeping 🫦",
    questions: [
      "who starts with one kiss, then wants five more?",
      "who turns cuddling into a tease first?",
      "who goes for the neck mid-kiss?",
      "who loses it when the lights go off?",
      "who keeps the pillow talk going longest?",
      "who falls asleep first after all that?",
    ],
    answers: "me, you or both",
    caption: "one bed, no sleeping 🫦 send this to your person and count your points",
  },
];
