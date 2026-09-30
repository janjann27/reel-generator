/* flamingoappreels voiceover ABCD quiz: "pick one. no switching."
 *
 * Why ABCD: on flamingoappreels abcd beats question in both lanes and shares drive
 * reach (see _ops/flamingoappreels_virality_2026-08-17). Heat is the biggest ABCD
 * lever, so the options are flirty, never graphic.
 *
 * Look: a page torn out of a notebook, the opposite of the dark chat-thread quizzes
 * on flamingoconvos/morecouplesss.
 *   - ruled paper, red margin, grain; each question is a new page swiped in over a
 *     flamingo-pink desk
 *   - Permanent Marker for the question and the letters, Kalam for the answers
 *   - the letter circles draw themselves and a highlighter swipes the option the
 *     voice is reading; the think timer is a pencil line
 *   - branding: pink washi tape reading "flamingo" (same header word the ad slides use)
 * Frame 0 is the finished title page, because IG takes the first frame as the thumbnail.
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
import { loadFont as loadMarker } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadKalam } from "@remotion/google-fonts/Kalam";
import * as P1 from "./pickOne1.data";
import * as S1 from "./pickShort1.data";

const marker = loadMarker("normal", { weights: ["400"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;
const hand = loadKalam("normal", { weights: ["700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;

export type QuizLine = {
  kind: "intro" | "q" | "outro";
  text: string;
  audio: string;
  voFrames: number;
  words: { w: string; at: number }[];
};
export type PickOneProps = { title: string[]; lines: QuizLine[]; music: string; ask?: string };
export const PICK_ONE: PickOneProps = { title: P1.TITLE, lines: P1.LINES, music: "reels/audio/funk_108.wav" };
// Short cut: one question, no intro/outro voice; the page is already written at frame 0
// (thumbnail + hook) and the voice reads over it. ~14s so people finish it and replay.
export const PICK_SHORT: PickOneProps = { title: S1.TITLE, lines: S1.LINES, music: "reels/audio/funk_108.wav", ask: "comment your letter 👇" };

const C = {
  desk: "#ff5f98",
  paper: "#f6f0e5",
  rule: "rgba(70,120,190,0.24)",
  margin: "rgba(214,70,86,0.42)",
  ink: "#1f1b1c",
  inkSoft: "rgba(31,27,28,0.62)",
  tape: "rgba(255,120,168,0.82)",
  highlight: "rgba(255,224,64,0.78)",
  pink: "#e8336f",
};
const LEFT = 150; // just right of the margin line
const WIDTH = 1080 - LEFT - 80;

const LEAD = 12;
const THINK = 75; // four options to weigh: 2.5s
const INTRO_HOLD = 24;
const OUTRO_HOLD = 60;
const SWIPE = 10; // page swipe in/out

type Seg = QuizLine & { from: number; len: number; index: number };
const buildSegments = (lines: QuizLine[]): Seg[] => {
  let t = 0;
  let q = 0;
  return lines.map((l) => {
    const tail = l.kind === "q" ? THINK : l.kind === "intro" ? INTRO_HOLD : OUTRO_HOLD;
    const len = LEAD + l.voFrames + tail;
    const s = { ...l, from: t, len, index: l.kind === "q" ? ++q : 0 };
    t += len;
    return s;
  });
};
export const pickOneDuration = (p: PickOneProps) => buildSegments(p.lines).reduce((a, s) => a + s.len, 0);

const lower = (w: string) => (w === "I" || w.startsWith("I'") ? w : w.toLowerCase());
const isLetter = (w: string) => /^[ABCD]:$/.test(w);

/** Split a question line into the question and its A-D options, keeping word timings. */
const parse = (words: QuizLine["words"]) => {
  const cut = words.map((w, i) => (isLetter(w.w) ? i : -1)).filter((i) => i >= 0);
  const question = words.slice(0, cut[0] ?? words.length);
  const options = cut.map((c, k) => ({
    letter: words[c].w[0],
    at: words[c].at,
    words: words.slice(c + 1, cut[k + 1] ?? words.length),
  }));
  return { question, options };
};

/** Deterministic wobble so every hand-drawn shape is a little different but stable per render. */
const wob = (seed: number, i: number) => Math.sin(seed * 12.9898 + i * 78.233) * 0.5;

/** Notebook paper: ruled lines, red margin, grain. */
const Paper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: C.paper, overflow: "hidden" }}>
    <AbsoluteFill
      style={{ backgroundImage: `repeating-linear-gradient(180deg, transparent 0 70px, ${C.rule} 70px 72px)`, backgroundPosition: "0 40px" }}
    />
    <div style={{ position: "absolute", left: 118, top: 0, bottom: 0, width: 3, background: C.margin }} />
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "multiply" }}>
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed={4} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
    {children}
  </AbsoluteFill>
);

/** Washi tape with the brand word, stuck on at an angle. */
const Tape: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 214,
      left: 360,
      width: 360,
      height: 92,
      transform: "rotate(-4deg)",
      background: C.tape,
      clipPath:
        "polygon(0% 8%, 3% 0%, 6% 10%, 9% 2%, 12% 8%, 88% 6%, 91% 0%, 94% 9%, 97% 1%, 100% 8%, 100% 92%, 97% 100%, 94% 90%, 91% 99%, 88% 92%, 12% 94%, 9% 100%, 6% 91%, 3% 99%, 0% 92%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: marker,
      fontSize: 50,
      color: C.ink,
      letterSpacing: "0.02em",
    }}
  >
    flamingo
  </div>
);

/** Hand-drawn circle that draws itself in `dur` frames starting at `at`. */
const Circle: React.FC<{ size: number; at: number; seed: number; color?: string; dur?: number }> = ({ size, at, seed, color = C.pink, dur = 9 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = size / 2 - 6;
  const pts: string[] = [];
  for (let i = 0; i <= 44; i++) {
    const a = (i / 40) * Math.PI * 2 - 2.2; // a bit over 360deg: the pen overshoots its start
    const rr = r * (1 + 0.045 * Math.sin(a * 2 + seed) + 0.025 * Math.sin(a * 3 + seed * 2.3)); // slow pen wobble, not jitter
    pts.push(`${size / 2 + Math.cos(a) * rr * 1.08},${size / 2 + Math.sin(a) * rr}`);
  }
  return (
    <svg width={size} height={size} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
    </svg>
  );
};

/** Words written in as they're spoken: each word wipes on left to right. */
const Written: React.FC<{ words: QuizLine["words"]; style: React.CSSProperties; offset?: number; pre?: boolean }> = ({ words, style, offset = 0, pre }) => {
  const f = pre ? 9999 : useCurrentFrame() - offset;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", ...style }}>
      {words.map((w, i) => {
        const p = interpolate(f, [w.at, w.at + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <span key={i} style={{ display: "inline-block", marginRight: "0.28em", clipPath: `inset(-20% ${(1 - p) * 100}% -20% -5%)` }}>
            {lower(w.w)}
          </span>
        );
      })}
    </div>
  );
};

const Option: React.FC<{ o: ReturnType<typeof parse>["options"][number]; next?: number; seed: number; pre?: boolean }> = ({ o, next, seed, pre }) => {
  const f = useCurrentFrame() - LEAD;
  const { fps } = useVideoConfig();
  // pre: already on the page at frame 0; only the highlighter follows the voice.
  const inP = pre ? 1 : spring({ frame: f - o.at, fps, config: { damping: 18, stiffness: 220 } });
  // Highlighter: swipes on as the letter is read, lifts when the voice moves to the next one.
  const hi = interpolate(f, [o.at + 2, o.at + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const off = next === undefined ? 0 : interpolate(f, [next, next + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 34, marginBottom: 44, opacity: inP, transform: `translateX(${(1 - inP) * -30}px)` }}>
      <div style={{ position: "relative", width: 96, height: 96, flex: "none" }}>
        <Circle size={96} at={pre ? -20 : o.at + LEAD} seed={seed} dur={pre ? 1 : 9} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: marker, fontSize: 56, color: C.ink }}>
          {o.letter.toLowerCase()}
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: -14,
            right: -14,
            top: "18%",
            bottom: "8%",
            background: C.highlight,
            borderRadius: "10px 22px 14px 26px",
            transformOrigin: "left center",
            transform: `scaleX(${hi}) skewX(-6deg)`,
            opacity: 1 - off,
          }}
        />
        <div style={{ position: "relative", fontFamily: hand, fontWeight: 700, fontSize: 60, lineHeight: 1.1, color: C.ink }}>
          {o.words.map((w) => lower(w.w)).join(" ").replace(/[.]$/, "")}
        </div>
      </div>
    </div>
  );
};

/** Pencil line that draws across while you pick; the tip is the countdown. */
const PencilTimer: React.FC<{ start: number; ask?: string }> = ({ start, ask }) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  const p = interpolate(f, [0, THINK - 8], [0, 1], { extrapolateRight: "clamp" });
  const W = WIDTH - 60;
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) pts.push(`${(i / 60) * W},${22 + Math.sin(i * 0.9) * 3 + wob(3, i) * 4}`);
  return (
    <div style={{ position: "relative", marginTop: 26, height: 70 }}>
      <svg width={W} height={50} style={{ overflow: "visible" }}>
        <polyline points={pts.join(" ")} fill="none" stroke={C.inkSoft} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 44, fontFamily: hand, fontWeight: 700, fontSize: 40, color: C.pink }}>
        {ask ?? (p < 1 ? "pick one..." : "no switching!")}
      </div>
    </div>
  );
};

/** Each page swipes in from the right over the desk and out to the left. The first page is already down at frame 0. */
const Page: React.FC<{ len: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ len, first, last, children }) => {
  const f = useCurrentFrame();
  const inP = first ? 1 : interpolate(f, [0, SWIPE], [0, 1], { extrapolateRight: "clamp" });
  // The last page stays put, so the loop back to frame 0 is a cut between two finished pages.
  const outP = last ? 0 : interpolate(f, [len - SWIPE, len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const x = (1 - ease(inP)) * 1100 - ease(outP) * 1100;
  const rot = (1 - ease(inP)) * 4 - ease(outP) * 4;
  return <AbsoluteFill style={{ transform: `translateX(${x}px) rotate(${rot}deg)`, boxShadow: "0 30px 80px rgba(0,0,0,0.25)" }}>{children}</AbsoluteFill>;
};

const Counter: React.FC<{ n: number; total: number }> = ({ n, total }) => (
  <div style={{ position: "absolute", top: 222, right: 86, width: 130, height: 96 }}>
    <Circle size={112} at={0} seed={n * 7} color={C.inkSoft} dur={1} />
    <div style={{ position: "absolute", left: 0, top: 0, width: 112, height: 112, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: marker, fontSize: 40, color: C.ink }}>
      {n}/{total}
    </div>
  </div>
);

const TitlePage: React.FC<{ title: string[] }> = ({ title }) => (
  <Paper>
    <Tape />
    <div style={{ position: "absolute", left: LEFT, width: WIDTH, top: 560 }}>
      <div style={{ fontFamily: hand, fontWeight: 700, fontSize: 64, color: C.pink }}>{title[0]}</div>
      <svg width="420" height="24" style={{ display: "block", marginTop: -6 }}>
        <path d="M4 14 C 90 4, 200 22, 300 10 S 400 12, 416 8" fill="none" stroke={C.pink} strokeWidth="6" strokeLinecap="round" />
      </svg>
      <div style={{ height: 36 }} />
      <div style={{ fontFamily: marker, fontSize: 132, lineHeight: 1.02, color: C.ink }}>{title[1]}</div>
      <div style={{ height: 70 }} />
      <div style={{ display: "flex", gap: 30 }}>
        {["a", "b", "c", "d"].map((l, i) => (
          <div key={l} style={{ position: "relative", width: 104, height: 104 }}>
            <Circle size={104} at={-10} seed={i + 1} dur={1} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: marker, fontSize: 58, color: C.ink }}>
              {l}
            </div>
          </div>
        ))}
      </div>
    </div>
  </Paper>
);

const QuestionPage: React.FC<{ seg: Seg; total: number; pre?: boolean; ask?: string }> = ({ seg, total, pre, ask }) => {
  const { question, options } = useMemo(() => parse(seg.words), [seg.words]);
  return (
    <Paper>
      <Tape />
      {total > 1 && <Counter n={seg.index} total={total} />}
      <div style={{ position: "absolute", left: LEFT, width: WIDTH, top: 520 }}>
        <Written words={question} offset={LEAD} pre={pre} style={{ fontFamily: marker, fontSize: total > 1 ? 84 : 104, lineHeight: 1.08, color: C.ink }} />
        <div style={{ height: 70 }} />
        {options.map((o, k) => (
          <Option key={o.letter} o={o} next={options[k + 1]?.at} seed={seg.index * 10 + k} pre={pre} />
        ))}
        <PencilTimer start={LEAD + seg.voFrames} ask={ask} />
      </div>
    </Paper>
  );
};

const OutroPage: React.FC<{ seg: Seg }> = ({ seg }) => {
  const cut = seg.words.findIndex((w) => /,$/.test(w.w)) + 1 || seg.words.length;
  return (
    <Paper>
      <Tape />
      <div style={{ position: "absolute", left: LEFT, width: WIDTH, top: 620 }}>
        <Written words={seg.words.slice(0, cut)} offset={LEAD} style={{ fontFamily: marker, fontSize: 118, lineHeight: 1.04, color: C.ink }} />
        <div style={{ height: 50 }} />
        <Written words={seg.words.slice(cut)} offset={LEAD} style={{ fontFamily: hand, fontWeight: 700, fontSize: 62, lineHeight: 1.15, color: C.pink }} />
      </div>
    </Paper>
  );
};

export const PickOne: React.FC<PickOneProps> = ({ title, lines, music, ask }) => {
  const segs = useMemo(() => buildSegments(lines), [lines]);
  const total = segs.filter((s) => s.kind === "q").length;
  return (
    <AbsoluteFill style={{ background: C.desk }}>
      {segs.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.len} layout="none">
          <Page len={s.len} first={i === 0} last={i === segs.length - 1}>
            {s.kind === "intro" ? <TitlePage title={title} /> : s.kind === "q" ? <QuestionPage seg={s} total={total} pre={i === 0} ask={ask} /> : <OutroPage seg={s} />}
          </Page>
          <Sequence from={LEAD} layout="none">
            <Audio src={staticFile(s.audio)} volume={1} />
          </Sequence>
          {s.kind === "q" &&
            parse(s.words).options.map((o) => (
              <Sequence key={o.letter} from={LEAD + o.at + 2} durationInFrames={9} layout="none">
                <Audio src={staticFile("reels/audio/swish.wav")} volume={0.45} />
              </Sequence>
            ))}
        </Sequence>
      ))}
      <Audio src={staticFile(music)} loop volume={0.14} />
    </AbsoluteFill>
  );
};
