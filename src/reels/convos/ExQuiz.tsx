/* Voiceover "what would you do" quiz, told as a text conversation.
 *
 * Mechanic from flamingoconvos' own DHbCI5ysPPQ (Mar 2025, 28k reach, 317 shares,
 * 14.4s avg watch): a title, then questions read aloud one at a time, each followed
 * by a short think timer.
 *
 * v2 look (v1 read as AI-generated: italic serif, tracked caps label, wordmark dot):
 *   - every question lands as an incoming chat bubble, typing dots first, then a pop
 *   - the think timer is YOUR typing bubble (pink), so the pause asks for an answer
 *   - the chat scrolls up as the questions stack; older ones fade out at the top
 *   - TikTok Sans only, lowercase like a real text; no wordmark, no account name,
 *     so the same file can be A/B posted on two accounts
 * Kept from v1: the moving gradient background.
 * Music: tea_100.wav, a sneaky pizzicato bed (it's an ex quiz: drama, not romance).
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { T } from "../shared";
import * as EX1 from "./exQuiz1.data";
import * as MAD1 from "./madQuiz1.data";

export type QuizLine = {
  kind: "intro" | "q" | "outro";
  text: string;
  audio: string;
  voFrames: number;
  words: { w: string; at: number }[];
};

// Tokens. The ground colours are the gradient's; bubbles follow the chat-app convention
// (incoming light, outgoing coloured).
const C = {
  night: "#140a1c",
  flamingo: "#ff4f8b",
  coral: "#ff8a5b",
  violet: "#7b5cff",
  incoming: "#fbf6f3",
  incomingInk: "#1c1418",
  outgoing: "#ff4f8b",
  outgoingInk: "#ffffff",
  meta: "rgba(255,246,240,0.72)",
};

const LEAD = 16; // incoming typing dots before each voice line
const THINK = 60; // your typing bubble: 2s to answer in your head
const INTRO_HOLD = 14;
const OUTRO_HOLD = 50;

type Seg = QuizLine & { from: number; len: number; index: number };

export const buildSegments = (lines: QuizLine[]): Seg[] => {
  let t = 0;
  let q = 0;
  return lines.map((l) => {
    const tail = l.kind === "q" ? THINK : l.kind === "intro" ? INTRO_HOLD : OUTRO_HOLD;
    const len = LEAD + l.voFrames + tail;
    const seg = { ...l, from: t, len, index: l.kind === "q" ? ++q : 0 };
    t += len;
    return seg;
  });
};

export type ChatQuizProps = { title: string[]; lines: QuizLine[]; music: string };

// One set of props per reel; the Composition registers each.
export const EX_QUIZ: ChatQuizProps = { title: EX1.TITLE, lines: EX1.LINES, music: "reels/audio/tea_100.wav" }; // flamingoconvos + A/B twin
export const MAD_QUIZ: ChatQuizProps = { title: MAD1.TITLE, lines: MAD1.LINES, music: "reels/audio/tea_100.wav" }; // morecouplesss

export const quizDuration = (p: ChatQuizProps) => buildSegments(p.lines).reduce((a, s) => a + s.len, 0);

// Shown lowercase like a real text ("I" stays upright).
const lower = (w: string) => (w === "I" || w.startsWith("I'") ? w : w.toLowerCase());

/** A message in the thread: when it lands, when (if ever) it leaves, what it is. */
type Msg = { key: string; from: number; until?: number; side: "in" | "out"; text?: string; typing?: boolean };

/**
 * The whole conversation as a list of messages. Incoming bubbles land on the voice
 * (a multi-bubble line lands each bubble on its first spoken word); typing bubbles
 * exist only for their window and then collapse away.
 */
const buildThread = (segs: Seg[], TITLE: string[]): Msg[] => {
  const out: Msg[] = [];
  const bubbleGroups = (s: Seg): string[][] => {
    // Intro: the title's two lines, then whatever follows ("be honest."). Outro: split after the question mark.
    const words = s.words.map((w) => w.w);
    if (s.kind === "intro") {
      const a = TITLE[0].split(" ").length;
      const b = a + TITLE[1].split(" ").length;
      return [TITLE[0].split(" "), TITLE[1].split(" "), words.slice(b)].filter((g) => g.length);
    }
    if (s.kind === "outro") {
      const cut = words.findIndex((w) => w.endsWith("?")) + 1;
      return [words.slice(0, cut), words.slice(cut)].filter((g) => g.length);
    }
    return [words];
  };
  segs.forEach((s, si) => {
    if (s.kind === "intro") return; // the intro is the TitleCard, not bubbles
    const groups = bubbleGroups(s);
    let wi = 0;
    groups.forEach((g, gi) => {
      const at = s.from + LEAD + (s.words[Math.min(wi, s.words.length - 1)]?.at ?? 0);
      // Typing dots in the few frames before each bubble.
      out.push({ key: `t${si}-${gi}`, from: at - LEAD + (gi === 0 ? 0 : LEAD - 10), until: at, side: "in", typing: true });
      out.push({ key: `m${si}-${gi}`, from: at, side: "in", text: g.map(lower).join(" ") });
      wi += g.length;
    });
    if (s.kind === "q") {
      const start = s.from + LEAD + s.voFrames;
      out.push({ key: `r${si}`, from: start, until: start + THINK - 4, side: "out", typing: true });
    }
  });
  return out;
};

// Which voice line a message belongs to (bubbles of one line dim together, not one by one).
const seg = (m: Msg) => m.key.slice(1).split("-")[0];

/** Slow aurora gradient, kept from v1: three big blurred lights on incommensurate orbits. */
const Aurora: React.FC = () => {
  const f = useCurrentFrame();
  const blob = (color: string, cx: number, cy: number, r: number, px: number, py: number, ax: number, ay: number, o: number) => (
    <div
      style={{
        position: "absolute",
        width: r * 2,
        height: r * 2,
        left: cx + Math.sin((f / px) * Math.PI * 2) * ax - r,
        top: cy + Math.cos((f / py) * Math.PI * 2) * ay - r,
        borderRadius: "50%",
        background: color,
        opacity: o,
        filter: "blur(140px)",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      {blob(C.flamingo, 250, 420, 420, 610, 470, 120, 90, 0.55)}
      {blob(C.violet, 860, 1180, 460, 530, 690, 110, 140, 0.5)}
      {blob(C.coral, 520, 1650, 360, 770, 410, 160, 70, 0.35)}
    </AbsoluteFill>
  );
};

const Dots: React.FC<{ color: string; local: number }> = ({ color, local }) => (
  <div style={{ display: "flex", gap: 12, padding: "8px 4px" }}>
    {[0, 1, 2].map((i) => {
      const b = Math.sin(((local - i * 5) / 18) * Math.PI * 2);
      return (
        <span
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            background: color,
            opacity: 0.45 + 0.4 * Math.max(0, b),
            transform: `translateY(${-Math.max(0, b) * 8}px)`,
          }}
        />
      );
    })}
  </div>
);

/**
 * One row of the thread. It grows open (so the rows above slide up instead of
 * jumping) and the bubble pops in from its tail corner; typing rows collapse again.
 */
const Row: React.FC<{ m: Msg; next?: number }> = ({ m, next }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({ frame: f - m.from, fps, config: { damping: 16, mass: 0.5, stiffness: 240 } });
  const outP = m.until === undefined ? 0 : interpolate(f, [m.until, m.until + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const open = Math.min(1, inP) * (1 - outP);
  if (f < m.from || open <= 0.001) return null;
  const incoming = m.side === "in";
  // Once the next message lands, this one steps back so the newest question owns the frame.
  const past = next === undefined ? 0 : interpolate(f, [next, next + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ display: "grid", gridTemplateRows: `${open}fr`, marginTop: 18 * open }}>
      <div style={{ minHeight: 0, overflow: "visible", display: "flex", justifyContent: incoming ? "flex-start" : "flex-end" }}>
        <div
          style={{
            maxWidth: 800,
            padding: m.typing ? "22px 30px" : "26px 36px 30px",
            borderRadius: 46,
            borderBottomLeftRadius: incoming ? 12 : 46,
            borderBottomRightRadius: incoming ? 46 : 12,
            background: incoming ? C.incoming : C.outgoing,
            color: incoming ? C.incomingInk : C.outgoingInk,
            fontFamily: T.font,
            fontWeight: 500,
            fontSize: 56,
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            transformOrigin: incoming ? "left bottom" : "right bottom",
            transform: `scale(${0.6 + 0.4 * inP})`,
            opacity: Math.min(1, inP * 1.6) * (1 - outP) * (1 - 0.55 * past),
          }}
        >
          {m.typing ? <Dots color={incoming ? "#8d8189" : "#ffffff"} local={f - m.from} /> : m.text}
        </div>
      </div>
    </div>
  );
};

/** Plain progress line above the chat: "3 of 10". No label styling, no brand. */
/**
 * Title screen for the intro line. Fully drawn at frame 0 (no entrance), because IG
 * uses the first frame as the thumbnail; it lifts away as the first question starts.
 */
const TitleCard: React.FC<{ seg: Seg; title: string[] }> = ({ seg, title }) => {
  const f = useCurrentFrame();
  const end = seg.from + seg.len;
  if (f >= end) return null;
  const out = interpolate(f, [end - 12, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const extra = seg.words.slice((title[0] + " " + title[1]).split(" ").length).map((w) => lower(w.w)).join(" ");
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-out * 80}px)` }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 560, fontFamily: T.font }}>
        <div style={{ fontWeight: 800, fontSize: 52, color: C.flamingo }}>{title[0]}</div>
        <div style={{ height: 24 }} />
        <div style={{ fontWeight: 800, fontSize: 116, lineHeight: 1.02, letterSpacing: "-0.03em", color: C.incoming }}>{title[1]}</div>
        {extra && (
          <>
            <div style={{ height: 44 }} />
            <div
              style={{
                display: "inline-block",
                padding: "20px 32px 24px",
                borderRadius: 40,
                borderBottomLeftRadius: 12,
                background: C.incoming,
                color: C.incomingInk,
                fontWeight: 500,
                fontSize: 52,
              }}
            >
              {extra}
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Progress: React.FC<{ segs: Seg[] }> = ({ segs }) => {
  const f = useCurrentFrame();
  const TOTAL_Q = segs.filter((s) => s.kind === "q").length;
  const cur = segs.filter((s) => s.kind === "q" && f >= s.from).length;
  const outro = segs[segs.length - 1];
  if (cur === 0 || f >= outro.from) return null;
  return (
    <div style={{ position: "absolute", top: 262, left: 0, right: 0, textAlign: "center", fontFamily: T.font, fontWeight: 700, fontSize: 38, color: C.meta }}>
      {cur} of {TOTAL_Q}
    </div>
  );
};

export const ExQuiz: React.FC<ChatQuizProps> = ({ title, lines, music }) => {
  const segs = useMemo(() => buildSegments(lines), [lines]);
  const THREAD = useMemo(() => buildThread(segs, title), [segs, title]);
  return (
    <AbsoluteFill>
      <Aurora />
      <Progress segs={segs} />
      {segs[0]?.kind === "intro" && <TitleCard seg={segs[0]} title={title} />}

      {/* The thread: bottom-anchored just above IG's caption zone; older bubbles fade out at the top. */}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 520,
          height: 1000,
          paddingBottom: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 40%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 40%)",
        }}
      >
        {THREAD.map((m) => (
          <Row key={m.key} m={m} next={m.typing ? undefined : THREAD.find((n) => !n.typing && n.from > m.from && seg(n) !== seg(m))?.from} />
        ))}
      </div>

      <Audio src={staticFile(music)} loop volume={0.16} />
      {segs.map((s, i) => (
        <Sequence key={i} from={s.from + LEAD} durationInFrames={s.voFrames + 4} layout="none">
          <Audio src={staticFile(s.audio)} volume={1} />
        </Sequence>
      ))}
      {THREAD.filter((m) => !m.typing).map((m) => (
        <Sequence key={m.key} from={m.from} durationInFrames={6} layout="none">
          <Audio src={staticFile("reels/audio/pop.wav")} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
