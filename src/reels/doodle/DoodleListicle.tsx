/**
 * DoodleListicle — "which boyfriend is yours when ___?" doodle reel.
 *
 * Format: hook card (title + scene) → 5 numbered archetypes (label, big title,
 * scene, 2-line caption, red cta) with hard cuts → "which one is he?" end card
 * with 5 numbered thumbnails. Scenes are gpt-image-2 stills generated from a
 * cast sheet (_ops/doodle_listicle_2026-11-23/gen.py), brought to life here
 * with a pop-in, breathing squash and a stepped "line boil" wobble.
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSchoolbell } from "@remotion/google-fonts/Schoolbell";

// Picked from a 5-font test (Gochi Hand, Gaegu, Short Stack, Schoolbell, Patrick Hand):
// Schoolbell is the closest to the reference's marker hand.
export const FONTS = {
  schoolbell: loadSchoolbell().fontFamily,
} as const;
export type FontKey = keyof typeof FONTS;

const INK = "#141414";
const RED = "#d8262f";

export type DoodleItem = {
  label: string; // "number one"
  title: string; // "THE BODYGUARD" (use \n to break)
  caption: string; // 2 lines, \n separated
  img: string; // public path
  cta?: string; // default "follow for more"
};

export type DoodleListicleProps = {
  font: FontKey;
  hookTop: string; // "WHICH"
  hookMid: string; // "boyfriend is yours"
  hookBig: string; // "WHEN A GUY\nFLIRTS WITH YOU?"
  hookImg: string;
  items: DoodleItem[];
  endTitle: string; // "WHICH ONE\nIS HE?"
  endLines: string[]; // ["drop the number below", "send this to him"]
  music?: string;
  /** Optional closing app CTA card after the end card. */
  cta?: DoodleCta;
  /** Optional timing overrides (frames); defaults HOOK_F / ITEM_F / END_F. */
  /** true = scene images never move (no per-step tilt/nudge); text still boils. */
  stillImages?: boolean;
  hookF?: number;
  itemF?: number;
  endF?: number;
};

export type DoodleCta = {
  title: string; // "want more\ncouple questions?"
  line: string; // "search flamingo on the app store"
  img: string; // 1080x1650 App Store search mock (mock-02 + 300px phone body), bottom-anchored
};

export const FLAMINGO_CTA: DoodleCta = {
  title: "WANT MORE\nQUESTIONS?",
  line: "search flamingo on the app store",
  img: "reels/cta/flamingo-search.png",
};

export const HOOK_F = 90; // 3.0s  (6 beats @120bpm)
export const ITEM_F = 105; // 3.5s (7 beats)
export const END_F = 150; // 5.0s
export const CTA_F = 105; // 3.5s
const timing = (p: DoodleListicleProps) => {
  const hook = p.hookF ?? HOOK_F, item = p.itemF ?? ITEM_F, end = p.endF ?? END_F;
  const endAt = hook + p.items.length * item;
  return { hook, item, end, endAt, ctaAt: endAt + end };
};
export const doodleDuration = (p: DoodleListicleProps) => timing(p).ctaAt + (p.cta ? CTA_F : 0);

/* ---------- motion ---------- */

/*
 * "Boil": like the reference, every BOIL_STEP frames the drawing is redrawn a
 * little differently and holds in between. Text: each LETTER gets its own small
 * tilt + nudge per step (weight stays constant). Images: mild SVG turbulence
 * displacement with a new seed per step.
 */
const BOIL_STEP = 6; // reference redraws every 6 frames (5/s)
const BOIL_N = 4;
const LETTER_ROT = 3.5; // max deg per letter
const LETTER_Y = 0.025; // max vertical nudge, fraction of font size
const LETTER_X = 0.012;

export const useBoilStep = (offset = 0) => Math.floor((useCurrentFrame() + offset) / BOIL_STEP) % BOIL_N;

const IMG_ROT = 0.8; // max deg, whole image
const IMG_SHIFT = 3; // max px

/** Same cadence as the text: holds still, then a small new tilt/nudge every BOIL_STEP frames. */
const LivingImage: React.FC<{ src: string; width: number; seed?: number; still?: boolean }> = ({ src, width, seed = 0, still }) => {
  const boil = useBoilStep();
  const step = still ? 0 : boil;
  const k = `${src}-${seed}-${step}`;
  const r = still ? 0 : (random(`r${k}`) * 2 - 1) * IMG_ROT;
  const x = still ? 0 : (random(`x${k}`) * 2 - 1) * IMG_SHIFT;
  const y = still ? 0 : (random(`y${k}`) * 2 - 1) * IMG_SHIFT;
  return (
    <div style={{ width, height: width, transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg)` }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

/* ---------- text ---------- */

/** Text whose letters each tilt/nudge independently every BOIL_STEP frames. */
const BoilText: React.FC<{ text: string; size: number; seed: string }> = ({ text, size, seed }) => {
  const step = useBoilStep();
  let n = 0;
  return (
    <>
      {text.split("\n").map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 ? <br /> : null}
          {line.split(" ").map((word, wi) => (
            <React.Fragment key={wi}>
              {wi > 0 ? " " : null}
              <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                {Array.from(word).map((ch) => {
                  const k = `${seed}-${n++}-${step}`;
                  const r = (random(`r${k}`) * 2 - 1) * LETTER_ROT;
                  const y = (random(`y${k}`) * 2 - 1) * LETTER_Y * size;
                  const x = (random(`x${k}`) * 2 - 1) * LETTER_X * size;
                  return (
                    <span key={n} style={{ display: "inline-block", transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg)` }}>
                      {ch}
                    </span>
                  );
                })}
              </span>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </>
  );
};

const Txt: React.FC<{ font: FontKey; size: number; top: number; children: string; color?: string; lh?: number; underline?: boolean }> = ({
  font,
  size,
  top,
  children,
  color = INK,
  lh = 0.95,
  underline,
}) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 40,
      right: 40,
      textAlign: "center",
      fontFamily: FONTS[font],
      fontSize: size,
      lineHeight: lh,
      color,
      WebkitTextStroke: `${(size / 40).toFixed(2)}px ${color}`,
    }}
  >
    <span style={underline ? { borderBottom: `4px solid ${INK}`, paddingBottom: 4 } : undefined}>
      <BoilText text={children} size={size} seed={`${top}-${children}`} />
    </span>
  </div>
);

const Star: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 2.5l2.8 6.1 6.6.7-5 4.5 1.4 6.6L12 17l-5.8 3.4 1.4-6.6-5-4.5 6.6-.7z" fill="#f6c431" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);
const Heart: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.9 1.3 5.4 3.2 1.5-1.9 3.2-3.2 5.4-3.2 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" fill={RED} stroke={INK} strokeWidth={1.2} />
  </svg>
);

/* ---------- cards ---------- */

const HookCard: React.FC<DoodleListicleProps> = (p) => {
  const step = useBoilStep();
  const tilt = (k: string) => `rotate(${((random(`${k}${step}`) * 2 - 1) * 6).toFixed(1)}deg)`;
  return (
  <AbsoluteFill style={{ background: "#fff" }}>
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: FONTS[p.font], fontSize: 132, color: INK, WebkitTextStroke: `3.3px ${INK}` }}>
      <span style={{ display: "inline-block", transform: tilt("star") }}><Star size={84} /></span> <BoilText text={p.hookTop} size={132} seed="hookTop" />{" "}
      <span style={{ display: "inline-block", transform: tilt("heart") }}><Heart size={84} /></span>
    </div>
    <Txt font={p.font} size={66} top={400}>
      {p.hookMid}
    </Txt>
    <Txt font={p.font} size={112} top={480}>
      {p.hookBig}
    </Txt>
    <AbsoluteFill style={{ top: 720, alignItems: "center" }}>
      <LivingImage src={p.hookImg} width={960} still={p.stillImages} />
    </AbsoluteFill>
  </AbsoluteFill>
  );
};

const ItemCard: React.FC<{ item: DoodleItem; font: FontKey; seed: number; still?: boolean }> = ({ item, font, seed, still }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Txt font={font} size={64} top={270}>
      {item.label}
    </Txt>
    <Txt font={font} size={140} top={345} lh={0.88}>
      {item.title}
    </Txt>
    <AbsoluteFill style={{ top: 640, alignItems: "center" }}>
      <LivingImage src={item.img} width={820} seed={seed} still={still} />
    </AbsoluteFill>
    <Txt font={font} size={72} top={1420} lh={1.05}>
      {item.caption}
    </Txt>
    <Txt font={font} size={48} top={1580} color={RED}>
      {item.cta ?? "follow for more"}
    </Txt>
  </AbsoluteFill>
);

const EndCard: React.FC<DoodleListicleProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = useBoilStep(2);
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Txt font={p.font} size={150} top={250} lh={0.88}>
        {p.endTitle}
      </Txt>
      {p.endLines.map((l, i) => (
        <Txt key={l} font={p.font} size={76} top={560 + i * 100} underline={i === p.endLines.length - 1}>
          {l}
        </Txt>
      ))}
      <div style={{ position: "absolute", top: 860, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: p.items.length === 4 ? 18 : 28 }}>
        {p.items.map((it, i) => {
          const s = spring({ frame: frame - 10 - i * 5, fps, config: { damping: 12, stiffness: 160 } });
          return (
            <div
              key={it.img}
              style={{
                width: p.items.length === 4 ? 226 : 300, // 4 fit one row in 960px (border-box)
                transform: `translateY(${interpolate(s, [0, 1], [500, 0])}px) rotate(${(i % 2 ? 1 : -1) * 2}deg)`,
                border: `5px solid ${INK}`,
                borderRadius: 28,
                background: "#fff",
                padding: "10px 10px 4px",
                textAlign: "center",
              }}
            >
              <Img src={staticFile(it.img)} style={{ width: "100%", transform: p.stillImages ? undefined : `rotate(${((random(`t${i}-${step}`) * 2 - 1) * IMG_ROT * 1.5).toFixed(2)}deg)` }} />
              <div style={{ fontFamily: FONTS[p.font], fontSize: 72, lineHeight: 1, color: INK, WebkitTextStroke: `1.8px ${INK}` }}>
                <BoilText text={String(i + 1)} size={72} seed={`end${i}`} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** App CTA: doodle headline, the App Store search mock slides up from the bottom,
 *  then a hand-drawn red ring is drawn around "Get". The mock stays crisp (no boil). */
const CtaCard: React.FC<{ cta: DoodleCta; font: FontKey }> = ({ cta, font }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 120 } });
  const draw = interpolate(frame, [26, 44], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const step = useBoilStep();
  const ringRot = ((random(`ring${step}`) * 2 - 1) * 2).toFixed(2);
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Txt font={font} size={140} top={400} lh={0.88}>
        {cta.title}
      </Txt>
      <Txt font={font} size={64} top={700} color={RED}>
        {cta.line}
      </Txt>
      <div style={{ position: "absolute", left: 0, bottom: 0, width: 1080, height: 1650, transform: `translateY(${interpolate(s, [0, 1], [700, 0])}px)` }}>
        <Img src={staticFile(cta.img)} style={{ width: "100%", height: "100%" }} />
        {/* ring around the Get button (mock coords ~453-590 x 1208-1268) */}
        <svg width={300} height={160} viewBox="0 0 300 160" style={{ position: "absolute", left: 371, top: 1158, overflow: "visible", transform: `rotate(${ringRot}deg)` }}>
          <path
            d="M40 92 C 30 40, 140 18, 220 30 C 290 42, 292 112, 210 132 C 130 150, 34 140, 30 96 C 28 70, 70 50, 110 44"
            fill="none"
            stroke={RED}
            strokeWidth={9}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={draw}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- main ---------- */

export const DoodleListicle: React.FC<DoodleListicleProps> = (p) => {
  const total = doodleDuration(p);
  const t = timing(p);
  const cuts = [0, ...p.items.map((_, i) => t.hook + i * t.item), t.endAt, ...(p.cta ? [t.ctaAt] : [])];
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Sequence durationInFrames={t.hook}>
        <HookCard {...p} />
      </Sequence>
      {p.items.map((it, i) => (
        <Sequence key={it.img} from={t.hook + i * t.item} durationInFrames={t.item}>
          <ItemCard item={it} font={p.font} seed={i * 3 + 1} still={p.stillImages} />
        </Sequence>
      ))}
      <Sequence from={t.endAt} durationInFrames={t.end}>
        <EndCard {...p} />
      </Sequence>
      {p.cta ? (
        <Sequence from={t.ctaAt} durationInFrames={CTA_F}>
          <CtaCard cta={p.cta} font={p.font} />
        </Sequence>
      ) : null}
      {p.music ? (
        <Audio
          src={staticFile(p.music)}
          loop
          volume={(f) => interpolate(f, [0, 8, total - 20, total], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
      {cuts.slice(1).map((c) => (
        <Sequence key={c} from={c} durationInFrames={20}>
          <Audio src={staticFile("reels/audio/pop.wav")} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/* ---------- data ---------- */

const D = "reels/doodle/cats";

export const JEALOUS_BF: DoodleListicleProps = {
  font: "schoolbell",
  hookTop: "WHICH",
  hookMid: "boyfriend is yours",
  hookBig: "WHEN A GUY\nFLIRTS WITH YOU?",
  hookImg: `${D}/hook.png`,
  items: [
    { label: "number one", title: "THE\nBODYGUARD", caption: "suddenly twice his size\nand standing very close", img: `${D}/1.png` },
    { label: "number two", title: "THE TOO\nCHILL ONE", caption: "\"he seems nice\"\n...sir??", img: `${D}/2.png` },
    { label: "number three", title: "THE PDA\nATTACK", caption: "holds you like a trophy\nfor the rest of the night", img: `${D}/3.png` },
    { label: "number four", title: "THE\nSULKER", caption: "\"i'm fine\"\nhe is not fine", img: `${D}/4.png` },
    { label: "number five", title: "THE\nSTARE", caption: "says nothing.\ndoes not blink.", img: `${D}/5.png` },
  ],
  endTitle: "WHICH ONE\nIS HE?",
  endLines: ["drop the number below", "send this to him"],
  music: "reels/audio/mixkit_87.mp3",
  cta: FLAMINGO_CTA,
};

/* Nov 24 2026: v2 of the format after the first readout (DoodleJealousBf avg watch 9.0s of 25.5s,
   2 comments on 39k reach). Shorter (4 items, 2s hook, 2.5s items = 19.5s incl. CTA) and the comment
   ask is on every item card instead of only the end card. Own script; same cat couple (cry/ assets
   from _ops/doodle_cry_2026-11-24/gen.py). */
const C = "reels/doodle/cry";

export const CRY_BF: DoodleListicleProps = {
  font: "schoolbell",
  hookTop: "WHICH",
  hookMid: "boyfriend is yours",
  hookBig: "WHEN YOU CRY?",
  hookImg: `${C}/hook.png`,
  items: [
    { label: "number one", title: "THE\nPANIC", caption: "\"WHO DID THIS??\"\nruns around with tissues", img: `${C}/1.png`, cta: "comment 1 if this is him" },
    { label: "number two", title: "THE SNACK\nDEALER", caption: "says nothing\nreturns with all your snacks", img: `${C}/2.png`, cta: "comment 2 if this is him" },
    { label: "number three", title: "THE\nFIXER", caption: "\"ok here's a 5-step plan\"\nyou wanted a hug", img: `${C}/3.png`, cta: "comment 3 if this is him" },
    { label: "number four", title: "THE ONE\nWHO CRIES TOO", caption: "sees one tear\ncries louder than you", img: `${C}/4.png`, cta: "comment 4 if this is him" },
  ],
  endTitle: "WHICH ONE\nIS HE?",
  endLines: ["comment the number", "send this to him"],
  music: "reels/audio/mixkit_87.mp3",
  cta: FLAMINGO_CTA,
  stillImages: true,
  hookF: 60,
  itemF: 75,
  endF: 105,
};

/* Nov 24 2026: same v2 format as CRY_BF, first PEOPLE cast (original couple, coral sweater gf +
   cream overshirt bf; _ops/doodle_hungry_2026-11-24/gen.py). */
const H = "reels/doodle/hungry";

export const HUNGRY_BF: DoodleListicleProps = {
  ...CRY_BF,
  hookMid: "boyfriend is yours",
  hookBig: "WHEN YOU'RE\nHUNGRY?",
  hookImg: `${H}/hook.png`,
  items: [
    { label: "number one", title: "THE\nCHEF", caption: "you wanted a snack\nhe made a 3-course dinner", img: `${H}/1.png`, cta: "comment 1 if this is him" },
    { label: "number two", title: "THE\nINDECISIVE ONE", caption: "\"where do you wanna eat?\"\nasks for 45 minutes", img: `${H}/2.png`, cta: "comment 2 if this is him" },
    { label: "number three", title: "THE FRY\nTHIEF", caption: "\"i'm not hungry\"\neats half your fries", img: `${H}/3.png`, cta: "comment 3 if this is him" },
    { label: "number four", title: "THE\nDELIVERY GUY", caption: "you said \"i'm hungry\" once\nfood shows up in 20 min", img: `${H}/4.png`, cta: "comment 4 if this is him" },
  ],
};

/* From flamingo.app.reels viral quiz DdxQvKqDy1S "what kinda weird boyfriend am i?"
   (Sep 26 2026: 926k reach, 121k shares). Captions reuse that post's trait lines;
   cast is our own (_ops/doodle_far_viral_2026-11-23/gen.py). */
const W = "reels/doodle/weirdbf";

export const WEIRD_BF: DoodleListicleProps = {
  font: "schoolbell",
  hookTop: "WHICH",
  hookMid: "weird boyfriend",
  hookBig: "IS YOURS?",
  hookImg: `${W}/hook.png`,
  items: [
    { label: "number one", title: "THE\nMONKE", caption: "steals your snacks\nclimbs on everything", img: `${W}/1.png` },
    { label: "number two", title: "THE\nPENGUIN", caption: "waddles behind you everywhere\npicks one person forever", img: `${W}/2.png` },
    { label: "number three", title: "THE\nCRAB", caption: "permanently a little annoyed\nacts tough, needs affection", img: `${W}/3.png` },
    { label: "number four", title: "THE\nCAPYBARA", caption: "zero thoughts, just vibes\nsomehow still very chill", img: `${W}/4.png` },
    { label: "number five", title: "THE\nBEAR", caption: "looks scary, acts soft\ngiant cuddle machine", img: `${W}/5.png` },
  ],
  endTitle: "WHICH ONE\nIS HE?",
  endLines: ["drop the number below", "send this to him"],
  music: "reels/audio/mixkit_87.mp3",
  cta: FLAMINGO_CTA,
};
