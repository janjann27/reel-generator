import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PHOTOS, T, outlineText } from "./shared";

// Original couple-humor memes, the format that went viral on morecouplesss in
// Jun-Jul 2026 (top reels 2.2k-5.2k reach at 3-6% share rate, against 1.3% for
// the game reels). Relatable, specific setup the viewer sends to their person,
// then a punchline beat. Short on purpose: the old reels averaged a 4.7s watch,
// so a 7s reel that loops earns replays instead of drop-off.
//
// Layout is the classic meme reel: black caption on a white header, photo band
// below. Most usable stock photos are landscape, and a full 9:16 crop cuts one
// of the couple out of frame; the band keeps both in.
//
// Two shapes:
//   - punchline only: the photo stays, the punchline lands over it.
//   - reaction: a hard cut to a reaction photo with a snap zoom, which is where
//     the laugh is in this format.
//
// Copy is gender-neutral ("my person", "they"). The tag-your-person ask lives in
// `caption` (the post caption), never in the video.
type Shot = { photo: string; focus?: string };

// Punchline sound (scripts/make_audio.py, synthesized, no licensing):
//   boom    reaction cuts; the music ducks under it
//   scratch deadpan lines; the music cuts out for a beat, then comes back
//   ching   money jokes
type Sfx = "boom" | "scratch" | "ching";

export type Meme = {
  id: string;
  shot: Shot;
  reaction?: Shot;
  setup: string[];
  punchline: string[];
  sfx: Sfx;
  caption: string;
};

export const MEMES: Meme[] = [
  {
    id: "MemeOneBite",
    shot: { photo: PHOTOS.couchRemote, focus: "50% 40%" },
    reaction: { photo: PHOTOS.shocked, focus: "50% 35%" },
    setup: ["them: \"i'm not hungry,", "i'll just have one bite", "of yours\""],
    punchline: ["me watching half", "my food disappear"],
    sfx: "boom",
    caption: "\"one bite\" they said 😭 tag the one who steals your food",
  },
  {
    id: "MemeReadyInFive",
    shot: { photo: PHOTOS.sideEye, focus: "40% 40%" },
    setup: ["my person: \"ok i'll be", "ready in 5 minutes\""],
    punchline: ["me, who has heard", "this before"],
    sfx: "scratch",
    caption: "5 minutes is a lifestyle not a unit of time ⏳ tag them",
  },
  {
    id: "MemeLoudSigh",
    shot: { photo: PHOTOS.couchIgnored, focus: "50% 55%" },
    setup: ["me sighing loudly for", "the 4th time so they", "ask what's wrong"],
    punchline: ["they have not asked"],
    sfx: "scratch",
    caption: "i will sigh until i am acknowledged 😤 send this to your person",
  },
  {
    id: "MemeWhoLikedIt",
    shot: { photo: PHOTOS.bedPhone, focus: "55% 45%" },
    reaction: { photo: PHOTOS.gasp, focus: "50% 35%" },
    setup: ["them: \"look at this", "funny video\""],
    punchline: ["me noticing who", "liked it first"],
    sfx: "boom",
    caption: "i'm not jealous i'm just observant 👀 tag your person",
  },
  {
    id: "MemeSaidItFirst",
    shot: { photo: PHOTOS.hiding, focus: "50% 45%" },
    setup: ["me after saying", "\"i love you\" first"],
    punchline: ["they said \"haha", "thank you\""],
    sfx: "scratch",
    caption: "we don't talk about it 🫠 tag someone who'd survive this",
  },
  {
    id: "MemeCarryMe",
    shot: { photo: PHOTOS.piggyback, focus: "58% 40%" },
    setup: ["my person after walking", "for literally 4 minutes"],
    punchline: ["\"my legs are done.", "carry me\""],
    sfx: "boom",
    caption: "4 minutes is a marathon apparently 🥲 tag them",
  },
  {
    id: "MemeOneThing",
    shot: { photo: PHOTOS.cart, focus: "42% 50%" },
    setup: ["us: \"we're just grabbing", "one thing\""],
    punchline: ["$214 later"],
    sfx: "ching",
    caption: "we went in for milk 🛒 tag your shopping partner in crime",
  },
  {
    id: "MemeFiveMoreMinutes",
    shot: { photo: PHOTOS.sleeping, focus: "40% 50%" },
    setup: ["pov: we said \"just 5 more", "minutes\" of cuddling"],
    punchline: ["that was 3 hours ago"],
    sfx: "scratch",
    caption: "we have no self control 😭 send this to your cuddle buddy",
  },
  {
    id: "MemeWhereToEat",
    shot: { photo: PHOTOS.phoneScroll, focus: "55% 40%" },
    reaction: { photo: PHOTOS.sideEye, focus: "40% 40%" },
    setup: ["them: \"where do you", "want to eat?\"", "me: \"i don't care\""],
    punchline: ["them: \"tacos?\"", "me: \"not that\""],
    sfx: "boom",
    caption: "i don't care but also not that 🙃 tag the one who has to guess every night",
  },
];

export const MEME_DURATION = 210; // 7s
const PUNCH_AT = 60; // 2.0s: time to read the setup, and the bar downbeat of the 120 BPM bed

// 1080x1920 frame. IG's top UI covers ~200px and its caption/actions the bottom
// ~380px, so the joke lives between them.
const HEADER_TOP = 230;
const BAND_TOP = 660;
const BAND_H = 860;

const Photo: React.FC<{ shot: Shot; zoom?: number }> = ({ shot, zoom = 1 }) => (
  <Img
    src={staticFile(shot.photo)}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: shot.focus ?? "50% 50%",
      transform: `scale(${zoom})`,
    }}
  />
);

const BED = 0.45;
/** Music level per frame: a boom ducks the bed, a scratch stops it for a beat. */
const musicVolume = (sfx: Sfx, f: number): number => {
  const t = f - PUNCH_AT;
  if (sfx === "scratch") {
    if (t < 0) return BED;
    // Silent from the scratch for a full bar, then fades back in.
    return interpolate(t, [4, 5, 60, 72], [BED, 0, 0, BED], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  return interpolate(t, [0, 2, 24, 40], [BED, BED * 0.35, BED * 0.35, BED], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const MemeReel: React.FC<{ meme: Meme }> = ({ meme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punched = frame >= PUNCH_AT;
  const p = spring({ frame: frame - PUNCH_AT, fps, config: { damping: 14, mass: 0.5, stiffness: 260 } });
  // Snap zoom on the reaction cut: starts tight and settles in ~6 frames.
  const zoom = interpolate(frame - PUNCH_AT, [0, 6], [1.18, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <div
        style={{
          position: "absolute",
          top: HEADER_TOP,
          left: 70,
          right: 70,
          height: BAND_TOP - HEADER_TOP - 30,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          fontFamily: T.font,
          fontWeight: 700,
          fontSize: 62,
          lineHeight: 1.12,
          color: T.ink,
          letterSpacing: "-0.01em",
        }}
      >
        {meme.setup.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <div style={{ position: "absolute", top: BAND_TOP, left: 0, width: 1080, height: BAND_H, overflow: "hidden" }}>
        {punched && meme.reaction ? <Photo shot={meme.reaction} zoom={zoom} /> : <Photo shot={meme.shot} />}
        {punched && (
          <div
            style={{
              position: "absolute",
              left: 50,
              right: 50,
              bottom: 56,
              textAlign: "center",
              ...outlineText(80),
              opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
              transform: `scale(${interpolate(p, [0, 1], [0.8, 1])})`,
            }}
          >
            {meme.punchline.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}
      </div>

      <Audio src={staticFile("reels/audio/bouncy_120.wav")} volume={(f) => musicVolume(meme.sfx, f)} />
      <Sequence from={PUNCH_AT} layout="none">
        <Audio src={staticFile(`reels/audio/${meme.sfx}.wav`)} volume={() => (meme.sfx === "boom" ? 0.9 : 0.8)} />
      </Sequence>
    </AbsoluteFill>
  );
};
