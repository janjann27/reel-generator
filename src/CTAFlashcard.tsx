import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// ── Flamingo Flashcard palette (from the standalone HTML CTA slide) ──
const MAROON = "#2E1520"; // slide background
const CREAM = "#FBF2EE"; // front card + light text
const PINK = "#FF3D7F"; // accent
const INK = "#26161C"; // dark text on card
const TAUPE = "#a8988f"; // muted subtext
const CARD_B1 = "#d8b5bd"; // deepest stacked card
const CARD_B2 = "#ecd2d7"; // middle stacked card

/** Fade + slide-up entrance, returns {opacity, transform}. */
const fadeUp = (
  frame: number,
  start: number,
  dur: number,
  dist = 34,
): React.CSSProperties => {
  const p = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

/** Right-pointing arrow used inside the CTA button. */
const Arrow: React.FC = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    stroke={CREAM}
    strokeWidth="3.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const CTAFlashcard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Card stack rise (gentle spring with slight overshoot) ──
  const cardP = spring({
    frame: frame - 6,
    fps,
    config: { damping: 18, mass: 1, stiffness: 150 },
  });
  const cardStackStyle: React.CSSProperties = {
    opacity: interpolate(cardP, [0, 0.4], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(cardP, [0, 1], [440, 0])}px) scale(${interpolate(
      cardP,
      [0, 1],
      [0.92, 1],
    )})`,
    transformOrigin: "50% 100%",
  };
  // Behind cards fan out from flat as the stack lands.
  const fan = (target: number) => `rotate(${target * cardP}deg)`;

  // ── "GET THE DECK" pill pop-in (overshoot, after card lands) ──
  const pillP = spring({
    frame: frame - 30,
    fps,
    config: { damping: 11, mass: 0.8, stiffness: 140 },
  });
  const pillStyle: React.CSSProperties = {
    opacity: interpolate(pillP, [0, 0.35], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `translateX(-50%) scale(${interpolate(pillP, [0, 1], [0.5, 1])})`,
  };

  // ── CTA button: pulse + pink glow once it has appeared ──
  const pulse = frame > 62 ? 1 + Math.sin((frame - 62) / 8) * 0.02 : 1;
  const glow = frame > 62 ? 0.4 + (Math.sin((frame - 62) / 8) + 1) * 0.22 : 0.4;
  // Arrow nudges right in time with the pulse.
  const nudge = frame > 62 ? Math.max(0, Math.sin((frame - 62) / 8)) * 8 : 0;

  // ── Star twinkle: each pops in staggered, then breathes ──
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const s = spring({
      frame: frame - (6 + i * 3),
      fps,
      config: { damping: 10, mass: 0.6, stiffness: 160 },
    });
    const twinkle = frame > 40 ? 1 + Math.sin((frame + i * 20) / 9) * 0.12 : 1;
    return {
      opacity: interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      transform: `scale(${interpolate(s, [0, 1], [0.2, 1]) * twinkle})`,
    } as React.CSSProperties;
  });

  // ── One-shot glare sweep across the front card after it lands ──
  const glare = interpolate(frame, [34, 60], [-140, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glareOpacity = interpolate(
    frame,
    [34, 42, 54, 60],
    [0, 0.45, 0.45, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: MAROON,
        fontFamily,
        padding: "84px 88px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===== header: wordmark + star rating ===== */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: CREAM,
            ...fadeUp(frame, 0, 8, -24),
          }}
        >
          flamin<span style={{ color: PINK }}>go</span>
        </div>
        <div style={{ display: "flex", gap: 6, color: PINK, fontSize: 34 }}>
          {stars.map((st, i) => (
            <span key={i} style={{ display: "inline-block", ...st }}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* ===== stacked cards, vertically centred ===== */}
      <div
        style={{
          margin: "auto 0",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          ...cardStackStyle,
        }}
      >
        {/* deepest card */}
        <div
          style={{
            position: "absolute",
            top: 32,
            width: 800,
            height: 800,
            borderRadius: 48,
            background: CARD_B1,
            transform: fan(5),
          }}
        />
        {/* middle card */}
        <div
          style={{
            position: "absolute",
            top: 16,
            width: 820,
            height: 800,
            borderRadius: 48,
            background: CARD_B2,
            transform: fan(-3),
          }}
        />

        {/* front card */}
        <div
          style={{
            position: "relative",
            width: 840,
            borderRadius: 48,
            background: CREAM,
            boxShadow: "0 44px 90px rgba(0,0,0,0.45)",
            padding: "88px 72px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* glare clip layer (rounded, does not clip the pill above) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 48,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)",
                transform: `translateX(${glare}%)`,
                opacity: glareOpacity,
                mixBlendMode: "screen",
              }}
            />
          </div>

          {/* "GET THE DECK" pill */}
          <div
            style={{
              position: "absolute",
              top: -34,
              left: "50%",
              display: "inline-flex",
              alignItems: "center",
              height: 68,
              padding: "0 38px",
              borderRadius: 999,
              background: PINK,
              color: CREAM,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "0.1em",
              ...pillStyle,
            }}
          >
            GET THE DECK
          </div>

          <div
            style={{
              color: PINK,
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "0.14em",
              ...fadeUp(frame, 30, 8, 22),
            }}
          >
            WANT 1,000+ MORE?
          </div>

          <h1
            style={{
              margin: "26px 0 0 0",
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 0.96,
              letterSpacing: "-0.035em",
              color: INK,
              ...fadeUp(frame, 34, 10, 28),
            }}
          >
            connect deeper, <span style={{ color: PINK }}>talk better.</span>
          </h1>

          <div
            style={{
              color: TAUPE,
              fontSize: 30,
              fontWeight: 600,
              marginTop: 24,
              ...fadeUp(frame, 40, 8, 20),
            }}
          >
            4.9 · loved by couples &amp; friends
          </div>

          {/* CTA button */}
          <div
            style={{
              marginTop: 52,
              display: "inline-flex",
              alignItems: "center",
              gap: 20,
              height: 120,
              padding: "0 56px",
              borderRadius: 999,
              background: PINK,
              boxShadow: `0 20px 44px rgba(255,61,127,0.4), 0 0 ${glow * 46}px rgba(255,61,127,${glow})`,
              ...fadeUp(frame, 46, 10, 26),
              transform: `${fadeUp(frame, 46, 10, 26).transform} scale(${pulse})`,
            }}
          >
            <span
              style={{
                color: CREAM,
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: "-0.01em",
              }}
            >
              Get Flamingo card
            </span>
            <span style={{ display: "inline-flex", transform: `translateX(${nudge}px)` }}>
              <Arrow />
            </span>
          </div>

          <p
            style={{
              margin: "28px 0 0 0",
              color: TAUPE,
              fontSize: 29,
              fontWeight: 600,
              ...fadeUp(frame, 52, 8, 18),
            }}
          >
            3-day free trial · link in bio
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
