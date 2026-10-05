/* Hallmark · redesign (video): native-reel · tone: casual/typed-on-phone
 * Screenshot-on-photo: a plain post screenshot laid over a static couple photo, the way
 * people repost a post they saw. TikTok Sans upright, shared.tsx tokens, left-biased.
 *
 * flamingoappreels "this is so us" series: one relatable couple post per reel, 8s, loops.
 *
 * Why this content: shares drive reach on this account, and the post people share is the
 * one they send to their partner with "this is you". Couple-humor POV memes were the
 * reel winners on morecouplesss; aesthetic quotes were the losers on flamingoconvos
 * (median 260 reach) and the quote_cards carousel run was stopped. So: specific,
 * relatable, mostly funny, one sweet. Judge on reach/shares, not taps.
 *
 * Look (v1 pink card read as AI-made, fixed on purpose):
 *   - one text weight in the post, like a real one; grey timestamp, no emoji action row
 *   - the account's real logo as avatar (public/reels/flamingo-logo.jpg), @flamingoappreels
 *   - static dimmed photo behind; no gradient, grain, glow, badge, bar or CTA stack
 *   - a hand-swiped highlighter on the punch phrase, one deadpan sticker line at 2.8s
 *   - the send ask lives in `caption`, never in the video (same rule as Memes)
 *
 * Beats (30fps): 0 everything but the sticker is up (frame 0 = thumbnail) ·
 * 16-34 highlighter · 84 sticker lands.
 * Copy is gender-neutral so either partner can send it.
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
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import { outlineText, PHOTOS, T } from "./shared";

const emoji = loadEmoji("normal", { ignoreTooManyRequestsWarning: true }).fontFamily;

export const COUPLE_POST_DURATION = 240;
const BEAT = 84; // ~2.8s: after one read of the post, before the scroll

const C = {
  font: `${T.font}, ${emoji}`,
  card: "#ffffff",
  ink: T.ink,
  meta: "#71767b",
  rule: "#eff3f4",
  highlight: "rgba(255,224,64,0.9)",
  dim: "rgba(0,0,0,0.38)",
};

export type CouplePost = {
  id: string;
  photo: string;
  focus?: string;
  /** The post. `hot` is the phrase the highlighter swipes; "
" breaks a line. */
  before: string;
  hot: string;
  after: string;
  /** Post time on the card, written like the app prints it. */
  time: string;
  /** The deadpan follow-up sticker. */
  beat: string;
  caption: string;
};

export const COUPLE_POSTS: CouplePost[] = [
  {
    id: "CouplePostReel",
    photo: PHOTOS.phoneScroll,
    focus: "52% 50%",
    before: "my love language is sending you a reel and then ",
    hot: "watching you watch it",
    after: "",
    time: "11:47 PM · Sep 28, 2026",
    beat: "every. single. time.",
    caption: "this is so us 😭 send it to your person (then watch them watch it). more couple questions → link in bio",
  },
  {
    id: "CouplePostFries",
    photo: PHOTOS.couchRemote,
    focus: "50% 50%",
    before: "them: i'm not hungry\nalso them: ",
    hot: "eating half my fries",
    after: "",
    time: "8:19 PM · Sep 29, 2026",
    beat: "it's called sharing apparently",
    caption: "tag the fry thief 🍟 more couple questions → link in bio",
  },
  {
    id: "CouplePostBlanket",
    photo: PHOTOS.hiding,
    focus: "50% 55%",
    before: "dating someone who steals the whole blanket and then says ",
    hot: "\"you're so warm\"",
    after: " like it's my fault",
    time: "1:12 AM · Sep 30, 2026",
    beat: "blanket thief behavior",
    caption: "send this to the blanket thief 🛌 more couple questions → link in bio",
  },
  {
    id: "CouplePostMorning",
    photo: PHOTOS.kissBed,
    focus: "38% 50%",
    before: "i don't need a perfect relationship. i need someone who still kisses me with ",
    hot: "morning breath",
    after: "",
    time: "7:26 AM · Sep 30, 2026",
    beat: "the bar is low and i'm happy",
    caption: "send this to the one who kisses you anyway 😭 more couple questions → link in bio",
  },
  {
    id: "CouplePost2am",
    photo: PHOTOS.sleeping,
    focus: "50% 50%",
    before: "the safest place in the world is 2am, ",
    hot: "your arms",
    after: ", and nowhere to be tomorrow",
    time: "2:04 AM · Oct 1, 2026",
    beat: "don't wake me up",
    caption: "send this to your safe place 🥹 more couple questions → link in bio",
  },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Static photo, evenly dimmed so the white card doesn't glare. No blur, no drift. */
const Photo: React.FC<{ photo: string; focus?: string }> = ({ photo, focus = "50% 50%" }) => (
  <AbsoluteFill style={{ backgroundColor: T.ink }}>
    <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus }} />
    <AbsoluteFill style={{ background: C.dim }} />
  </AbsoluteFill>
);

const Card: React.FC<{ post: CouplePost }> = ({ post }) => {
  const f = useCurrentFrame();
  const hi = interpolate(f, [16, 34], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        top: 360,
        background: C.card,
        borderRadius: 28,
        padding: "40px 48px 36px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        fontFamily: C.font,
        color: C.ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Img
          src={staticFile("reels/flamingo-logo.jpg")}
          style={{ width: 92, height: 92, borderRadius: "50%", objectFit: "cover", transform: "scale(1.04)" }}
        />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, fontSize: 38 }}>flamingo</div>
          <div style={{ fontWeight: 500, fontSize: 34, color: C.meta }}>@flamingoappreels</div>
        </div>
      </div>

      <div style={{ marginTop: 30, fontWeight: 500, fontSize: 64, lineHeight: 1.22, letterSpacing: "-0.01em", whiteSpace: "pre-line" }}>
        {post.before}
        {/* Inline background so the swipe follows every wrapped line (clone = per-line box). */}
        <span
          style={{
            backgroundImage: `linear-gradient(transparent 40%, ${C.highlight} 40%, ${C.highlight} 94%, transparent 94%)`,
            backgroundSize: `${hi * 100}% 100%`,
            backgroundRepeat: "no-repeat",
            padding: "0 4px",
            margin: "0 -4px",
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
          }}
        >
          {post.hot}
        </span>
        {post.after}
      </div>

      <div style={{ marginTop: 30, paddingTop: 22, borderTop: `2px solid ${C.rule}`, fontWeight: 500, fontSize: 32, color: C.meta }}>
        {post.time}
      </div>
    </div>
  );
};

/** The follow-up sticker: drops in with a small settle, like a second text layer. */
const Beat: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - BEAT, fps, config: { damping: 15, stiffness: 240, mass: 0.6 } });
  if (f < BEAT) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: T.x,
        width: T.width,
        top: 1360,
        ...outlineText(78),
        opacity: interpolate(p, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${(1 - p) * 26}px) rotate(-2deg)`,
        transformOrigin: "left center",
      }}
    >
      {text}
    </div>
  );
};

export const CouplePostReel: React.FC<{ post: CouplePost }> = ({ post }) => (
  <AbsoluteFill>
    <Photo photo={post.photo} focus={post.focus} />
    <Card post={post} />
    <Beat text={post.beat} />

    <Audio src={staticFile("reels/audio/love_90.wav")} loop volume={0.6} />
    <Sequence from={16} durationInFrames={12} layout="none">
      <Audio src={staticFile("reels/audio/swish.wav")} volume={0.45} />
    </Sequence>
    <Sequence from={BEAT} durationInFrames={10} layout="none">
      <Audio src={staticFile("reels/audio/pop.wav")} volume={0.5} />
    </Sequence>
  </AbsoluteFill>
);
