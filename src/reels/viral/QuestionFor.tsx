/* morecouplesss "question for the girls / boys": one question, one card, 7s, loops.
 *
 * v2 after "too AI generated". What gave v1 away, and what replaced it:
 *   - copy read like pickup lines from a generator (tidy "X or Y?" pairs, "weak
 *     instantly", an emoji closing every line, "lips or neck:" colon setups).
 *     Now: how people actually type these: "girls, ..." or "boys be honest ...",
 *     lowercase, no closing emoji, real curiosity ("or is that just me"), the odd
 *     missing question mark.
 *   - two-tier layout (grey "question for the girls" label + italic body + grey
 *     "answer below 👇") is a template tell. Now one block of text, the way the
 *     account's viral title slide looks: one sentence, upright, nothing else.
 *   - italic display serif = "designed". Now upright EB Garamond 500, the exact title
 *     style of the carousel template (morecouplesss-abcd-v2).
 *   - fake motion (breathing zoom, fade-in line) gone. A real text reel is a still
 *     card + a song, so it is a still card + a song.
 *   - Noto colour emoji (Android look) removed from the video entirely.
 * Colours sampled from the rendered slides of post_queue 2RwdRAF08uv6gGuy7X0z
 * ("Who folds first in bed?", 33k reach): plum-black #1a0a10, pale pink #f2dde2.
 * Text sits a little above centre: the bottom ~quarter of a reel is under the caption UI.
 * No FLAMINGO footer: no ad copy in the video. The send ask lives in `caption`.
 *
 * Optional `bg`: a muted, looped stock clip under a plum wash (Mixkit free licence,
 * 720x1280 previews; source page in each entry's comment). The wash keeps the
 * carousel colour and the text readable; the slight blur hides the 720p source.
 * Stutter fix: <Video> (HTML5 seek per frame) dropped/froze frames at render, and the
 * 23.976fps clips into a 30fps comp duplicated every 5th frame. Now OffthreadVideo
 * (frame-exact) at 24fps, so each output frame is the next source frame.
 */
import React from "react";
import { AbsoluteFill, Audio, Loop, OffthreadVideo, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/EBGaramond";

const garamond = loadFont("normal", { weights: ["500"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;

const C = { bg: "#1a0a10", ink: "#f2dde2" };

export const QUESTION_FOR_FPS = 24; // matches the 23.976fps Mixkit clips
export const QUESTION_FOR_DURATION = 7 * QUESTION_FOR_FPS; // 7s: one read, a second to think, loop

// Clip length in comp frames (OffthreadVideo has no `loop`, so <Loop> wraps it).
const BG_FRAMES: Record<string, number> = {
  "reels/bg/city-couple.mp4": 114,
  "reels/bg/city-embrace.mp4": 177,
  "reels/bg/night-hug.mp4": 266,
  "reels/bg/sweet-moment.mp4": 312,
};

export type QuestionForProps = {
  question: string;
  /** public/ path of a vertical clip; omit for the plain card. */
  bg?: string;
  /** public/ path of the music bed; defaults to the dark night_120 loop. */
  music?: string;
  /** For the queue script; never rendered. */
  caption: string;
};

export const QuestionFor: React.FC<QuestionForProps> = ({ question, bg, music = "reels/audio/night_120.wav" }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    {bg && (
      <>
        <Loop durationInFrames={BG_FRAMES[bg] ?? QUESTION_FOR_DURATION}>
          <OffthreadVideo src={staticFile(bg)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(3px) saturate(0.85)", transform: "scale(1.04)" }} />
        </Loop>
        <AbsoluteFill style={{ background: "rgba(26,10,16,0.58)" }} />
      </>
    )}
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: 0,
        bottom: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: garamond,
        fontWeight: 500,
        fontSize: 92,
        lineHeight: 1.14,
        letterSpacing: "-0.01em",
        color: C.ink,
        whiteSpace: "pre-line", // Verdict reels put the verdict on its own line
        textShadow: bg ? "0 2px 18px rgba(0,0,0,0.45)" : undefined,
      }}
    >
      {question}
    </div>
    <Audio src={staticFile(music)} loop volume={0.5} />
  </AbsoluteFill>
);

export const QUESTIONS_FOR: (QuestionForProps & { id: string })[] = [
  // for the girls
  { id: "QForGirlsNoIdea", question: "girls, what’s something he does that he has no idea is attractive", caption: "be honest 😭 then send this to him" },
  { id: "QForGirlsFold", question: "girls be honest, what’s the smallest thing that makes you fold", caption: "it’s always something small. send this to him" },
  { id: "QForGirlsSaid", question: "girls, what’s the most attractive thing he’s ever said to you?", caption: "comment it. then send this to him" },
  { id: "QForGirlsHair", question: "girls, does it make you melt when he plays with your hair or are we not admitting that", bg: "reels/bg/night-hug.mp4", // mixkit.co/free-stock-video/urban-couple-hug-at-night-outside-the-telephone-booth-100861
    caption: "be so for real 😭 send this to him" },
  { id: "QForGirlsSecret", question: "girls, what’s one thing he does that he doesn’t know you secretly love", caption: "tell us. then send this to him" },
  // for the boys
  { id: "QForBoysNoIdea", question: "boys, what’s something she does that she has no idea drives you crazy", bg: "reels/bg/city-couple.mp4", // mixkit.co/free-stock-video/silhouetted-couple-under-city-lights-100949
    caption: "boys be honest. send this to him" },
  { id: "QForBoysHoodie", question: "boys be honest, do you actually notice when she’s wearing your hoodie", bg: "reels/bg/sweet-moment.mp4", // mixkit.co/free-stock-video/couple-sharing-a-sweet-moment-101409
    caption: "we need to know. send this to him" },
  { id: "QForBoysText", question: "boys, what’s one text from her that ruins your whole day (in a good way)", caption: "comment it 😭 send this to him" },
  { id: "QForBoysNeck", question: "do guys actually like neck kisses or did we all make that up", bg: "reels/bg/city-embrace.mp4", // mixkit.co/free-stock-video/silhouetted-couple-in-city-nightscape-embrace-100948
    caption: "asking for all of us. send this to him" },
  { id: "QForBoysWear", question: "boys, what’s the hottest thing she can wear. and no you can’t say nothing", caption: "we’re waiting 😭 send this to him" },
  { id: "QForBoysSmell", question: "boys be honest, do you actually notice when she smells good or nah", caption: "be honest. send this to him" },
  { id: "QForBoysAdmit", question: "boys, what’s one thing she does that you’d never admit you love", caption: "you can admit it here. send this to him" },
  { id: "QForBoysTextOrShow", question: "boys, would you rather she text first or just show up", caption: "pick one. send this to him" },
];
