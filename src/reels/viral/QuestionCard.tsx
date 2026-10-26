/* "question card over the ocean": clone of the 21questionscards reel format
 * (instagram.com/reel/DZk8jLXom99, 5.1s). One flat question card, static from frame 0
 * (IG uses frame 0 as the thumbnail), over full-bleed scenic footage: a breaking wave
 * plus a song. No motion on the card. (The reference cuts to a sunset shore; we keep one
 * looping clip.)
 *
 * Card is our own playing-card design (see the comment on the card markup), not a copy
 * of the reference's box. Card colour and label are props per account.
 *
 * One bg clip per reel, each pre-cropped 1080x1920 30fps and built as a 6s (= the comp)
 * seamless loop: 6.5s cut, its first 0.5s crossfaded over the tail. Mixkit free licence:
 *   ocean-wave.mp4   = mixkit.co/free-stock-video/big-wave-crashing-7194 (from 0.5s)
 *   sunset-beach.mp4 = .../bright-orange-sunset-on-beach-2168 (from 3s)
 *   sunset-sea.mp4   = .../stunning-sunset-seen-from-the-sea-4119 (from 1s)
 *   aerial-sea.mp4   = .../turquoise-ocean-background-with-foaming-waves-2091 (from 2s)
 */
import React from "react";
import { AbsoluteFill, Audio, interpolate, Loop, OffthreadVideo, staticFile } from "remotion";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const caslon = loadCaslon("normal", { weights: ["700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;
const inter = loadInter("normal", { weights: ["800"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;

export const QUESTION_CARD_FPS = 30;
export const QUESTION_CARD_DURATION = 6 * QUESTION_CARD_FPS; // reference is 5.1s; +1s to finish reading
const BG_FRAMES = 180; // every bg clip is a 6s seamless loop (last 0.5s crossfades into its start)

export type QuestionCardProps = {
  question: string;
  /** Card face colour; blush by default. */
  card?: string;
  /** Small caps label in the card's top corner. */
  label: string;
  /** public/ path of the looping bg clip (6s seamless loops, see header). */
  bg?: string;
  /** public/ path of the music track (Mixkit free licence; ids in QUESTION_CARDS). */
  music?: string;
  /** Seconds into the track to start, to skip a slow intro. */
  musicFrom?: number;
  /** For the queue script; never rendered. */
  caption: string;
};

const INK = "#1a1014";

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, card = "#fbe3ea", label, bg = "reels/bg/ocean-wave.mp4", music = "reels/audio/mixkit_760.mp3", musicFrom = 0 }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Loop durationInFrames={BG_FRAMES}>
      <OffthreadVideo src={staticFile(bg)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </Loop>
    {/* Playing-card look, deliberately not the reference's flat face + black strip:
        tilted card with a soft shadow, inset hairline frame, label in the top corner,
        no footer bar. */}
    <div
      style={{
        position: "absolute",
        left: 120,
        width: 840,
        top: 380,
        height: 1080,
        borderRadius: 44,
        background: card,
        transform: "rotate(-2.5deg)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ position: "absolute", inset: 30, borderRadius: 26, border: "3px solid rgba(20,12,16,0.85)" }} />
      <div style={{ position: "absolute", top: 62, left: 70, fontFamily: inter, fontWeight: 800, fontSize: 30, letterSpacing: "0.14em", color: INK, textTransform: "uppercase" }}>
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          inset: "0 100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "left",
          fontFamily: caslon,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.2,
          color: INK,
          whiteSpace: "pre-line",
        }}
      >
        {question}
      </div>
    </div>
    <Audio
      src={staticFile(music)}
      startFrom={Math.round(musicFrom * QUESTION_CARD_FPS)}
      // short fade in, fade out on the last half second so the loop seam is soft
      volume={(f) => 0.6 * interpolate(f, [0, 6, QUESTION_CARD_DURATION - 15, QUESTION_CARD_DURATION], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
    />
  </AbsoluteFill>
);

// Tracks (Mixkit free licence, assets.mixkit.co/music/<id>/<id>.mp3), one per comp to
// compare: 760 "Sun in Your Eyes", 383 "Loving You Is Easy", 585 "Slow Pop",
// 854 "Lounging By Moonlight" (titles from the mood listing, may be off by one).
export const QUESTION_CARDS: (QuestionCardProps & { id: string })[] = [
  { id: "QCardFirstDetail", label: "flamingo", bg: "reels/bg/ocean-wave.mp4", music: "reels/audio/mixkit_760.mp3", question: "What’s the very first physical detail you notice when I walk into a room?",
    caption: "answer honestly 👀 then send this to your person" },
  { id: "QCardFellFor", label: "flamingo", bg: "reels/bg/sunset-beach.mp4", music: "reels/audio/mixkit_383.mp3", card: "#f6c1d3", question: "What’s something small I did early on that made you fall for me?",
    caption: "comment it. then send this to your person" },
  { id: "QCardThinkAbout", label: "flamingo", bg: "reels/bg/sunset-sea.mp4", music: "reels/audio/mixkit_585.mp3", musicFrom: 20, card: "#f8e7c4", question: "What’s a moment with me you still think about when you can’t sleep?",
    caption: "be honest. send this to your person" },
  { id: "QCardNeverSaid", label: "flamingo", bg: "reels/bg/aerial-sea.mp4", music: "reels/audio/mixkit_854.mp3", card: "#e4dcf5", question: "What’s something you’ve wanted to tell me but never found the right time?",
    caption: "now’s the time. send this to your person" },
  { id: "QCardOnlyYou", label: "flamingo", bg: "reels/bg/night-hug.mp4", music: "reels/audio/mixkit_760.mp3", card: "#fbd6c6", question: "Be honest…\nwhen did you know you didn’t want anyone else but me?",
    caption: "don’t overthink it. send this to your person and make them answer" },
  { id: "QCardNeverStop", label: "flamingo", bg: "reels/bg/gentle-kiss.mp4", music: "reels/audio/mixkit_585.mp3", card: "#d9ecdf", question: "What’s one little thing I do that you secretly hope I never stop doing?",
    caption: "send this to your person. their answer will make your day" },
];
