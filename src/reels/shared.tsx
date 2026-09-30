/* Hallmark · redesign (video): native-reel · tone: casual/typed-on-phone
 * type: TikTok Sans (upright only) · palette: photo + near-white highlight + near-black ink
 * rules kept: no italic display, no cards/pills/badges/glow, no eyebrow labels,
 * no emoji-as-icon, left-biased not centred. Photo is STATIC (no drift, no zoom);
 * the only motion is the slot glide, which replaces hard text swaps (flicker).
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/TikTokSans";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// Locked tokens: every colour and font below references these.
export const T = {
  font: fontFamily,
  highlight: "#fbfaf8", // IG text-tool background, a hair off pure white
  ink: "#141213",
  outlineFill: "#fffdf9",
  outlineStroke: "#0d0b0c",
  shade: "rgba(0,0,0,0.32)",
  x: 84,
  width: 900,
};

// Unsplash License photos (free commercial use, no attribution required),
// downloaded 2026-09-24 via each photo's official /download link.
export const PHOTOS = {
  kissBed: "reels/kiss-bed.jpg",
  cuddleEyes: "reels/cuddle-eyes.jpg",
  kissNight: "reels/kiss-night.jpg",
  cuddleBed: "reels/cuddle-bed.jpg",
  sleeping: "reels/sleeping.jpg",
  kissStars: "reels/kiss-stars.jpg",
  // Meme set, downloaded 2026-09-25 the same way (free Unsplash License only;
  // Unsplash+ photos 403 on /download and were skipped).
  couchRemote: "reels/couch-remote.jpg", // DLI2sm0gGmQ
  shocked: "reels/shocked.jpg", // W7wBNLlryPM
  sideEye: "reels/side-eye.jpg", // -CMdA_DgK6o
  couchIgnored: "reels/couch-ignored.jpg", // ClUnOV5G5VM
  bedPhone: "reels/bed-phone.jpg", // xGOP-ClRljU
  gasp: "reels/gasp.jpg", // UGPSx-oLDZQ
  hiding: "reels/hiding.jpg", // Se3-GFPVcVc
  piggyback: "reels/piggyback.jpg", // NUHSbynw9IE
  cart: "reels/cart.jpg", // pwt32loQ510
  phoneScroll: "reels/phone-scroll.jpg", // 3rXZyQdMdlI, downloaded 2026-09-30
};

/** One full-bleed photo that does not move. Thin top/bottom shade for legibility only. */
export const Backdrop: React.FC<{ photo: string; focus?: string }> = ({ photo, focus = "50% 50%" }) => (
  <AbsoluteFill style={{ backgroundColor: T.ink }}>
    <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus }} />
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${T.shade} 0%, transparent 32%, transparent 55%, ${T.shade} 100%)`,
      }}
    />
  </AbsoluteFill>
);

/**
 * Instagram text-tool "highlight" style: every line sits on its own box that
 * hugs the text, because the box follows each line, not the paragraph.
 */
export const Highlight: React.FC<{
  lines: React.ReactNode[];
  size?: number;
  style?: React.CSSProperties;
}> = ({ lines, size = 58, style }) => (
  <div style={{ position: "absolute", fontFamily: T.font, ...style }}>
    {lines.map((line, i) => (
      <div key={i} style={{ lineHeight: 1, marginBottom: 6 }}>
        <span
          style={{
            display: "inline-block",
            background: T.highlight,
            color: T.ink,
            fontSize: size,
            fontWeight: 700,
            padding: "10px 18px 12px",
            borderRadius: 12,
            letterSpacing: "-0.01em",
          }}
        >
          {line}
        </span>
      </div>
    ))}
  </div>
);

/** Classic white-with-black-outline caption text. */
export const outlineText = (size: number): React.CSSProperties => ({
  fontFamily: T.font,
  fontWeight: 800,
  fontSize: size,
  lineHeight: 1.05,
  color: T.outlineFill,
  WebkitTextStroke: `${Math.round(size / 11)}px ${T.outlineStroke}`,
  paintOrder: "stroke fill",
  letterSpacing: "-0.015em",
});

/**
 * One-window slot. The current line slides up and out while the next slides
 * in from below (`travel` frames, eased), then it rests for the remainder of
 * `cycle`. Motion instead of a hard swap, so it never flickers, and a pause
 * mostly lands on a line at rest.
 */
export const Slot: React.FC<{
  items: string[];
  cycle: number;
  travel: number;
  height: number;
  size: number;
  offset?: number;
}> = ({ items, cycle, travel, height, size, offset = 0 }) => {
  const frame = useCurrentFrame() + offset;
  const { fps } = useVideoConfig();
  const step = Math.floor(frame / cycle);
  const local = frame % cycle;
  const at = (k: number) => items[((k % items.length) + items.length) % items.length];
  const lift = height * 0.45;

  // Outgoing line: lifts, fades and blurs out over `travel` frames.
  const out = interpolate(local, [0, travel], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  // Incoming words: one frame apart, each on a spring with a small settle.
  // Blur follows the spring's speed, so words are sharp the moment they stop.
  // Settles by frame 6 with <=0.5% overshoot (checked against every cycle used).
  const SPRING = { damping: 20, mass: 0.45, stiffness: 300 };
  const words = at(step).split(" ");
  // The whole stagger spans at most 2 frames, however long the line, so the
  // last word is at rest well before the next switch even on a 10-frame cycle.
  const gap = words.length > 1 ? Math.min(1, 2 / (words.length - 1)) : 0;
  const word = (w: string, i: number) => {
    const f = local - 1 - i * gap; // 1 frame after the exit starts, then staggered
    const p = spring({ frame: f, fps, config: SPRING });
    const speed = Math.abs(p - spring({ frame: f - 1, fps, config: SPRING }));
    return (
      <span
        key={i}
        style={{
          display: "inline-block",
          marginRight: "0.26em",
          opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${(1 - p) * lift}px)`,
          filter: speed > 0.03 ? `blur(${Math.min(6, speed * 22)}px)` : undefined,
        }}
      >
        {w}
      </span>
    );
  };

  const box: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexWrap: "wrap",
    alignContent: "center",
    ...outlineText(size),
  };
  return (
    <div
      style={{
        position: "relative",
        height,
        // Feathered edges instead of a hard crop; the stroke needs the headroom.
        maskImage: "linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)",
      }}
    >
      {out < 1 && (
        <div
          style={{
            ...box,
            opacity: 1 - out,
            transform: `translateY(${-out * lift}px) scale(${1 - out * 0.06})`,
            transformOrigin: "left center",
            filter: out > 0 ? `blur(${out * 5}px)` : undefined,
          }}
        >
          {at(step - 1)}
        </div>
      )}
      <div style={box}>{words.map(word)}</div>
    </div>
  );
};

/** The call to action: one small typed line, like a creator's aside. */
export const Aside: React.FC<{ text: string; top: number }> = ({ text, top }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: T.x + 12,
      fontFamily: T.font,
      fontWeight: 700,
      fontSize: 40,
      color: T.outlineFill,
      textShadow: `0 2px 10px ${T.shade}, 0 1px 2px ${T.outlineStroke}`,
    }}
  >
    {text}
  </div>
);

/**
 * Soundtrack: the synthesized lo-fi loop (scripts/make_audio.py, no samples,
 * so no licensing) plus one tick per slot step. Ticks are placed from the same
 * cycle/offset values the Slot uses, so sound and motion cannot drift apart.
 */
export const Soundtrack: React.FC<{
  slots: { cycle: number; offset?: number }[];
  tickVolume: number;
  musicVolume?: number;
  music?: string;
}> = ({ slots, tickVolume, musicVolume = 0.5, music = "reels/audio/lofi_75.wav" }) => {
  const { durationInFrames } = useVideoConfig();
  const ticks: number[] = [];
  for (const { cycle, offset = 0 } of slots) {
    // A step starts where (frame + offset) is a multiple of cycle.
    for (let f = (cycle - (offset % cycle)) % cycle; f < durationInFrames; f += cycle) ticks.push(f);
  }
  return (
    <>
      <Audio src={staticFile(music)} volume={musicVolume} />
      {ticks.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={3} layout="none">
          <Audio src={staticFile("reels/audio/tick.wav")} volume={tickVolume} />
        </Sequence>
      ))}
    </>
  );
};
