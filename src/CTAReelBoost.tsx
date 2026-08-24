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

const PINK = "#FF4E96";
const DOTS =
  "url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2254%22%20height=%2254%22%3E%3Ccircle%20cx=%2227%22%20cy=%2227%22%20r=%221.8%22%20fill=%22%23ff4e96%22%20fill-opacity=%220.08%22/%3E%3C/svg%3E')";

/** Fade + slide-up entrance, returns {opacity, transform}. */
const fadeUp = (
  frame: number,
  start: number,
  dur: number,
  dist = 40,
): React.CSSProperties => {
  const p = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

/** Static stroked "?" mark in the background. */
const QMark: React.FC<{
  style: React.CSSProperties;
  size: number;
  stroke: number;
  color: string;
  rotate: number;
}> = ({ style, size, stroke, color, rotate }) => (
  <div
    style={{
      position: "absolute",
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1,
      color: "transparent",
      WebkitTextStroke: `${stroke}px ${color}`,
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}
  >
    ?
  </div>
);

/** Profile stat with a real number (social proof) instead of a blank bar. */
const StatNum: React.FC<{ value: string; label: string; highlight?: boolean }> = ({
  value,
  label,
  highlight,
}) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div
      style={{
        color: highlight ? PINK : "#fff",
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: "-0.01em",
      }}
    >
      {value}
    </div>
    <div style={{ color: "#c9c4cc", fontSize: 21, fontWeight: 500, marginTop: 6 }}>{label}</div>
  </div>
);

const fmtK = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  if (n >= 10000) return Math.round(n / 1000) + "K";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
};

/** Vertical position of the rising phone at frame f (spring, drops from +440). */
const phoneYAt = (f: number, fps: number): number =>
  interpolate(
    spring({ frame: f - 8, fps, config: { damping: 18, mass: 1, stiffness: 150 } }),
    [0, 1],
    [440, 0],
  );

export const CTAReelBoost: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  // ── Layout adapts to canvas ratio (9:16 tall vs 4:5 short) ──
  const isTall = height >= 1600;
  const L = isTall
    ? { canvasH: 1920, wordmarkTop: 110, headlineTop: 340, phoneTop: 660, qmarkTop: 620 }
    : { canvasH: 1350, wordmarkTop: 76, headlineTop: 250, phoneTop: 486, qmarkTop: 470 };
  const bioY = L.phoneTop + 531; // bio-link anchor (arrow head / tap contact)
  const tapTop = L.phoneTop + 720;
  const stickerTop = L.canvasH - 310;
  const rippleTop = bioY - 13;
  const cursorTop = bioY - 15;

  // ── Phone rise with velocity-driven motion blur + smear ──
  const phoneP = spring({ frame: frame - 8, fps, config: { damping: 18, mass: 1, stiffness: 150 } });
  const py = phoneYAt(frame, fps);
  const pvel = py - phoneYAt(frame - 1, fps); // px / frame
  const pBlur = Math.min(Math.abs(pvel) * 0.5, 16);
  const pStretch = 1 + Math.min(Math.abs(pvel) * 0.004, 0.16);
  const phoneStyle: React.CSSProperties = {
    opacity: interpolate(phoneP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
    transform: `translateY(${py}px) scale(${interpolate(phoneP, [0, 1], [0.92, 1])}) scaleY(${pStretch})`,
    transformOrigin: "50% 100%",
    filter: pBlur > 0.4 ? `blur(${pBlur}px)` : "none",
    willChange: "transform, filter",
  };

  // ── Ticking follower count (momentum / social proof) ──
  const followers = Math.round(
    interpolate(frame, [14, 66], [0, 1000000], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );

  // ── Rating stars twinkle ──
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const st = spring({ frame: frame - (44 + i * 3), fps, config: { damping: 10, mass: 0.6, stiffness: 160 } });
    return interpolate(st, [0, 1], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  });

  // Follow-button pulse (starts after phone lands).
  const pulse = frame > 34 ? 1 + Math.sin((frame - 34) / 8) * 0.025 : 1;
  const glow = frame > 34 ? 0.35 + (Math.sin((frame - 34) / 8) + 1) * 0.25 : 0;

  // ── Finger tap on the bio link (two taps, with ripples) ──
  const TAP_A = 84;
  const TAP_B = 106;
  // Finger flies in from lower-right and settles by the link.
  const fingerIn = spring({ frame: frame - 68, fps, config: { damping: 16, mass: 0.9, stiffness: 120 } });
  // Press curve: 0→1→0 over 9 frames at each tap moment.
  const pressAt = (t: number): number => {
    const d = frame - t;
    return d >= 0 && d < 9 ? Math.sin((d / 9) * Math.PI) : 0;
  };
  const press = Math.max(pressAt(TAP_A), pressAt(TAP_B));
  // Ripple ring emanating from the contact point on each tap.
  const rippleAt = (t: number): { scale: number; opacity: number } | null => {
    const d = frame - t;
    if (d < 0 || d > 24) return null;
    const p = d / 24;
    return { scale: 0.2 + p * 1.8, opacity: (1 - p) * 0.6 };
  };
  const ripples = [rippleAt(TAP_A), rippleAt(TAP_B)].filter(Boolean) as { scale: number; opacity: number }[];

  // Bio-link glow: idle shimmer, spiked by each tap.
  const linkShimmer = frame > 42 ? (Math.sin((frame - 42) / 7) + 1) * 0.5 : 0;
  const linkGlow = Math.max(linkShimmer, press * 1.6);

  // Hand-drawn arrow draw-on.
  const curveP = interpolate(frame, [46, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const headP = interpolate(frame, [62, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "tap the link!" pop-in with overshoot.
  const tapP = spring({ frame: frame - 64, fps, config: { damping: 10, mass: 0.8, stiffness: 130 } });
  const tapStyle: React.CSSProperties = {
    opacity: interpolate(tapP, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
    transform: `rotate(${interpolate(tapP, [0, 1], [8, -6])}deg) scale(${interpolate(tapP, [0, 1], [0.4, 1])})`,
    transformOrigin: "left center",
  };

  // One-shot glare sweep across the screen after landing.
  const glare = interpolate(frame, [36, 60], [-120, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glareOpacity = interpolate(frame, [36, 44, 54, 60], [0, 0.5, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Trial sticker wobble.
  const stickerP = spring({ frame: frame - 20, fps, config: { damping: 9, mass: 0.7, stiffness: 150 } });
  const stickerWobble = Math.sin(frame / 10) * 3;

  return (
    <AbsoluteFill style={{ background: "#050507", fontFamily }}>
      {/* ===== background: dots + floating question marks ===== */}
      <AbsoluteFill style={{ zIndex: 0, backgroundColor: "#08070a", backgroundImage: DOTS }}>
        <QMark size={660} stroke={7} color="rgba(255,78,150,0.16)" rotate={12} style={{ top: -150, right: -60 }} />
        <QMark size={520} stroke={7} color="rgba(255,78,150,0.10)" rotate={-8} style={{ bottom: -190, left: -50 }} />
        <QMark size={130} stroke={3.5} color="rgba(255,78,150,0.12)" rotate={8} style={{ top: L.qmarkTop, right: 150 }} />
      </AbsoluteFill>

      {/* ===== scene ===== */}
      <AbsoluteFill>
        {/* wordmark */}
        <div
          style={{
            position: "absolute",
            zIndex: 2,
            left: 80,
            top: L.wordmarkTop,
            fontSize: 38,
            fontWeight: 700,
            ...fadeUp(frame, 0, 8, -24),
          }}
        >
          <span style={{ color: "#fff" }}>flamin</span>
          <span style={{ color: PINK }}>go</span>
        </div>

        {/* headline */}
        <div style={{ position: "absolute", zIndex: 2, left: 80, top: L.headlineTop, width: 920, textAlign: "center" }}>
          <div
            style={{
              color: PINK,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.16em",
              ...fadeUp(frame, 3, 8, 24),
            }}
          >
            WANT 1,000+ MORE?
          </div>
          <h1
            style={{
              margin: "16px 0 0 0",
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 1.03,
              letterSpacing: "-0.03em",
              color: "#fff",
              ...fadeUp(frame, 7, 10, 30),
            }}
          >
            We saved the best for the app.
          </h1>
        </div>

        {/* phone mockup */}
        <div style={{ position: "absolute", zIndex: 2, left: 216, top: L.phoneTop, width: 648, ...phoneStyle }}>
          <div
            style={{
              position: "relative",
              borderRadius: 78,
              padding: 16,
              background:
                "linear-gradient(150deg, #f1f1f4 0%, #b9b9c0 24%, #ededf0 50%, #aeaeb6 72%, #e6e6ea 100%)",
              boxShadow: "0 -2px 0 rgba(255,255,255,0.4) inset, 0 40px 90px rgba(0,0,0,0.6)",
            }}
          >
            {/* physical side buttons */}
            {/* mute switch */}
            <div style={{ position: "absolute", left: -5, top: 196, width: 6, height: 40, borderRadius: 3, background: "linear-gradient(270deg,#9a9aa0 0%,#d8d8de 55%,#a6a6ac 100%)", boxShadow: "-1px 0 2px rgba(0,0,0,0.35)" }} />
            {/* volume up */}
            <div style={{ position: "absolute", left: -5, top: 256, width: 6, height: 98, borderRadius: 3, background: "linear-gradient(270deg,#9a9aa0 0%,#d8d8de 55%,#a6a6ac 100%)", boxShadow: "-1px 0 2px rgba(0,0,0,0.35)" }} />
            {/* volume down */}
            <div style={{ position: "absolute", left: -5, top: 368, width: 6, height: 98, borderRadius: 3, background: "linear-gradient(270deg,#9a9aa0 0%,#d8d8de 55%,#a6a6ac 100%)", boxShadow: "-1px 0 2px rgba(0,0,0,0.35)" }} />
            {/* power / side button */}
            <div style={{ position: "absolute", right: -5, top: 300, width: 6, height: 150, borderRadius: 3, background: "linear-gradient(90deg,#9a9aa0 0%,#d8d8de 55%,#a6a6ac 100%)", boxShadow: "1px 0 2px rgba(0,0,0,0.35)" }} />

            <div
              style={{
                position: "relative",
                borderRadius: 64,
                overflow: "hidden",
                background: "#000",
                height: 1170,
              }}
            >
              {/* status bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "22px 42px 0 42px",
                }}
              >
                <span style={{ color: "#fff", fontSize: 26, fontWeight: 600 }}>9:41</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="30" height="20" viewBox="0 0 30 20" fill="#fff">
                    <rect x="0" y="12" width="5" height="8" rx="1" />
                    <rect x="7" y="8" width="5" height="12" rx="1" />
                    <rect x="14" y="4" width="5" height="16" rx="1" />
                    <rect x="21" y="0" width="5" height="20" rx="1" />
                  </svg>
                  <svg width="28" height="20" viewBox="0 0 24 18" fill="#fff">
                    <path d="M12 3.5c3 0 5.7 1.1 7.8 3l-2 2.1A8.4 8.4 0 0 0 12 6.4a8.4 8.4 0 0 0-5.8 2.2l-2-2.1A11.4 11.4 0 0 1 12 3.5zm0 5.2c1.6 0 3.1.6 4.2 1.7l-2 2.1c-.6-.6-1.4-.9-2.2-.9s-1.6.3-2.2.9l-2-2.1A6 6 0 0 1 12 8.7zm0 4.9l2.1 2.2-2.1 2.2-2.1-2.2z" />
                  </svg>
                  <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                    <rect x="1" y="3" width="32" height="14" rx="4" stroke="#fff" strokeWidth="2" />
                    <rect x="34" y="7" width="3" height="6" rx="1.5" fill="#fff" />
                    <rect x="3.5" y="5.5" width="26" height="9" rx="2" fill="#fff" />
                  </svg>
                </div>
              </div>

              {/* dynamic island */}
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 134,
                  height: 36,
                  borderRadius: 20,
                  background: "#000",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                  zIndex: 6,
                }}
              />

              {/* IG top bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "34px 30px 18px 30px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span style={{ color: "#fff", fontSize: 30, fontWeight: 700 }}>flamingo.app</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={PINK}>
                    <path d="M12 2l2.4 1.8 3-.2 .9 2.9 2.5 1.7-1 2.9 1 2.9-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 16l1-2.9-1-2.9 2.5-1.7.9-2.9 3 .2z" />
                    <path d="M9.2 12.2l2 2 3.8-4" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                  </svg>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                </div>
              </div>

              {/* profile row */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "4px 26px 0 30px" }}>
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 132,
                    height: 132,
                    borderRadius: 999,
                    padding: 5,
                    background: "linear-gradient(135deg, #FF4E96, #ffb14e)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 999,
                      padding: 5,
                      background: "#000",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(160deg, #1c1c1f 0%, #0c0c0e 100%)",
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "space-between", textAlign: "center" }}>
                  <StatNum value="342" label="posts" />
                  <StatNum value={fmtK(followers)} label="followers" highlight />
                  <StatNum value="87" label="following" />
                </div>
              </div>

              {/* name + bio */}
              <div style={{ padding: "20px 30px 0 30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>Flamingo</span>
                  <span style={{ display: "flex", gap: 3 }}>
                    {stars.map((sc, i) => (
                      <span key={i} style={{ color: PINK, fontSize: 22, display: "inline-block", transform: `scale(${sc})` }}>
                        ★
                      </span>
                    ))}
                    <span style={{ color: "#c9c4cc", fontSize: 22, fontWeight: 600, marginLeft: 4 }}>4.9</span>
                  </span>
                </div>
                <div style={{ color: "#c9c4cc", fontSize: 24, fontWeight: 500, marginTop: 2 }}>
                  Relationship app
                </div>
                <div style={{ color: "#e7e2ea", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginTop: 10 }}>
                  Want more questions. The good ones.
                  <br />
                  Download the app
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                    color: "#7cc2ff",
                    fontSize: 26,
                    fontWeight: 600,
                    padding: "2px 6px",
                    marginLeft: -6,
                    borderRadius: 8,
                    background: `rgba(124,194,255,${linkGlow * 0.14})`,
                    boxShadow: `0 0 ${linkGlow * 22}px rgba(124,194,255,${linkGlow * 0.5})`,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7cc2ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                  </svg>
                  <span>go.flamingoscards.com</span>
                </div>
              </div>

              {/* action buttons */}
              <div style={{ display: "flex", gap: 12, padding: "22px 30px 0 30px" }}>
                <div
                  style={{
                    flex: 1,
                    height: 62,
                    borderRadius: 12,
                    background: PINK,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 26,
                    fontWeight: 700,
                    transform: `scale(${pulse})`,
                    boxShadow: `0 0 ${glow * 40}px rgba(255,78,150,${glow})`,
                  }}
                >
                  Follow
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 62,
                    borderRadius: 12,
                    background: "#262629",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 26,
                    fontWeight: 600,
                  }}
                >
                  Message
                </div>
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 12,
                    background: "#262629",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </div>
              </div>

              {/* tabs */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  padding: "26px 0 0 0",
                  borderBottom: "1px solid #262629",
                }}
              >
                <div style={{ paddingBottom: 16, borderBottom: "2px solid #fff" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="1" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6b6b73" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6b6b73" strokeWidth="2">
                    <circle cx="12" cy="9" r="4" />
                    <path d="M4 20a8 8 0 0 1 16 0" />
                  </svg>
                </div>
              </div>

              {/* grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
                {[
                  "rgba(255,78,150,0.16)",
                  "rgba(255,255,255,0.06)",
                  "rgba(255,78,150,0.10)",
                  "rgba(255,255,255,0.05)",
                  "rgba(255,78,150,0.14)",
                  "rgba(255,255,255,0.07)",
                ].map((bg, i) => (
                  <div key={i} style={{ aspectRatio: "1", background: bg }} />
                ))}
              </div>

              {/* one-shot glare sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 7,
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                  transform: `translateX(${glare}%)`,
                  opacity: glareOpacity,
                  mixBlendMode: "screen",
                }}
              />

              {/* IG bottom nav bar + iOS home indicator */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 5,
                  background: "#000",
                  borderTop: "1px solid #1c1c1f",
                  paddingBottom: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    padding: "18px 30px 14px 30px",
                  }}
                >
                  {/* home (active) */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round">
                    <path d="M3 11.5 12 3l9 8.5V21H3z" />
                  </svg>
                  {/* search */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                  </svg>
                  {/* reels */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <path d="M3 8h18M9 3l3 5M15 3l3 5" />
                    <polygon points="10 11 16 14 10 17" fill="#fff" stroke="none" />
                  </svg>
                  {/* shop */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8h12l-1 12H7z" />
                    <path d="M9 8a3 3 0 0 1 6 0" />
                  </svg>
                  {/* profile (active tab) */}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      padding: 2,
                      boxSizing: "border-box",
                      background: "linear-gradient(135deg,#FF4E96,#ffb14e)",
                    }}
                  >
                    <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "linear-gradient(160deg,#1c1c1f,#0c0c0e)" }} />
                  </div>
                </div>
                {/* home indicator */}
                <div style={{ width: 200, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.55)", margin: "4px auto 0" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ===== hand-drawn arrow → bio link ===== */}
        <svg
          style={{ position: "absolute", left: 0, top: 0, width: 1080, height: L.canvasH, zIndex: 3, pointerEvents: "none" }}
          viewBox={`0 0 1080 ${L.canvasH}`}
          fill="none"
        >
          <path
            d={`M118 ${bioY + 193} C 56 ${bioY + 83}, 92 ${bioY + 23}, 262 ${bioY}`}
            stroke={PINK}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - curveP}
          />
          <path
            d={`M262 ${bioY} l -34 -14`}
            stroke={PINK}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - headP}
          />
          <path
            d={`M262 ${bioY} l -26 26`}
            stroke={PINK}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - headP}
          />
        </svg>

        {/* ===== tap ripples at the bio link ===== */}
        {ripples.map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              zIndex: 3,
              left: 470,
              top: rippleTop,
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              borderRadius: 999,
              border: `4px solid ${PINK}`,
              transform: `scale(${r.scale})`,
              opacity: r.opacity,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* ===== animated cursor tapping the link ===== */}
        <div
          style={{
            position: "absolute",
            zIndex: 4,
            left: 458,
            top: cursorTop,
            opacity: interpolate(fingerIn, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translate(${interpolate(fingerIn, [0, 1], [170, 0]) + press * 6}px, ${
              interpolate(fingerIn, [0, 1], [190, 0]) + press * 10
            }px) scale(${1 - press * 0.16})`,
            transformOrigin: "top left",
            filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.55))",
            pointerEvents: "none",
          }}
        >
          <svg width="66" height="66" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 3 L4 18 L7.6 14.4 L9.8 19.3 L12.1 18.3 L10 13.5 L14.9 13.5 Z"
              fill="#fff"
              stroke="#1a1a1a"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ===== "tap the link!" ===== */}
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            left: 34,
            top: tapTop,
            color: "#fff",
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.01em",
            ...tapStyle,
          }}
        >
          tap the
          <br />
          link!
        </div>
      </AbsoluteFill>

      {/* ===== "3-day free trial" sticker (bottom-right, clear of the headline) ===== */}
      <div
        style={{
          position: "absolute",
          zIndex: 6,
          right: 60,
          top: stickerTop,
          opacity: interpolate(stickerP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
          transform: `rotate(${stickerWobble - 5}deg) scale(${interpolate(stickerP, [0, 1], [0.3, 1])})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 96,
            padding: "0 34px",
            borderRadius: 999,
            background: PINK,
            color: "#fff",
            boxShadow: "0 16px 40px rgba(255,78,150,0.5)",
            border: "4px dashed rgba(255,255,255,0.7)",
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>3 DAYS</span>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.14em", marginTop: 3 }}>FREE TRIAL</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
