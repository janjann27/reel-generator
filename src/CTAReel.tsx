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

const StatCol: React.FC<{ w: number; label: string }> = ({ w, label }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <div
      style={{
        width: w,
        height: 26,
        borderRadius: 7,
        background: "rgba(255,255,255,0.16)",
      }}
    />
    <div
      style={{
        color: "#c9c4cc",
        fontSize: 21,
        fontWeight: 500,
        marginTop: 9,
      }}
    >
      {label}
    </div>
  </div>
);

/** 9:16 (1080x1920) reel variant of the CTA end card. */
export const CTAReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone rise (gentle spring with slight overshoot).
  const phoneP = spring({
    frame: frame - 8,
    fps,
    config: { damping: 18, mass: 1, stiffness: 150 },
  });
  const phoneStyle: React.CSSProperties = {
    opacity: interpolate(phoneP, [0, 0.4], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(phoneP, [0, 1], [440, 0])}px) scale(${interpolate(
      phoneP,
      [0, 1],
      [0.92, 1],
    )})`,
    transformOrigin: "50% 100%",
  };

  // Follow-button pulse (starts after phone lands).
  const pulse = frame > 34 ? 1 + Math.sin((frame - 34) / 8) * 0.025 : 1;
  const glow =
    frame > 34 ? 0.35 + (Math.sin((frame - 34) / 8) + 1) * 0.25 : 0;

  // Bio-link attention glow.
  const linkGlow =
    frame > 42 ? (Math.sin((frame - 42) / 7) + 1) * 0.5 : 0;

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
  const tapP = spring({
    frame: frame - 64,
    fps,
    config: { damping: 10, mass: 0.8, stiffness: 130 },
  });
  const tapStyle: React.CSSProperties = {
    opacity: interpolate(tapP, [0, 0.35], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `rotate(${interpolate(tapP, [0, 1], [8, -6])}deg) scale(${interpolate(
      tapP,
      [0, 1],
      [0.4, 1],
    )})`,
    transformOrigin: "left center",
  };

  // Bio pointer 👇 bob.
  const bob = Math.sin(frame / 6) * 5;

  // One-shot glare sweep across the screen after landing.
  const glare = interpolate(frame, [36, 60], [-120, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glareOpacity = interpolate(
    frame,
    [36, 44, 54, 60],
    [0, 0.5, 0.5, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: "#050507", fontFamily }}>
      {/* ===== background: dots + floating question marks ===== */}
      <AbsoluteFill
        style={{
          zIndex: 0,
          backgroundColor: "#08070a",
          backgroundImage: DOTS,
        }}
      >
        <QMark
          size={660}
          stroke={7}
          color="rgba(255,78,150,0.16)"
          rotate={12}
          style={{ top: -150, right: -60 }}
        />
        <QMark
          size={520}
          stroke={7}
          color="rgba(255,78,150,0.10)"
          rotate={-8}
          style={{ bottom: -190, left: -50 }}
        />
        <QMark
          size={130}
          stroke={3.5}
          color="rgba(255,78,150,0.12)"
          rotate={8}
          style={{ top: 620, right: 150 }}
        />
      </AbsoluteFill>

      {/* ===== wordmark ===== */}
      <div
        style={{
          position: "absolute",
          zIndex: 2,
          left: 80,
          top: 110,
          fontSize: 38,
          fontWeight: 700,
          ...fadeUp(frame, 0, 8, -24),
        }}
      >
        <span style={{ color: "#fff" }}>flamin</span>
        <span style={{ color: PINK }}>go</span>
      </div>

      {/* ===== headline ===== */}
      <div
        style={{ position: "absolute", zIndex: 2, left: 80, top: 340, width: 920, textAlign: "center" }}
      >
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

      {/* ===== phone mockup ===== */}
      <div style={{ position: "absolute", zIndex: 2, left: 216, top: 660, width: 648, ...phoneStyle }}>
        <div
          style={{
            borderRadius: 78,
            padding: 16,
            background:
              "linear-gradient(150deg, #f1f1f4 0%, #b9b9c0 24%, #ededf0 50%, #aeaeb6 72%, #e6e6ea 100%)",
            boxShadow:
              "0 -2px 0 rgba(255,255,255,0.4) inset, 0 40px 90px rgba(0,0,0,0.6)",
          }}
        >
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
                <StatCol w={64} label="posts" />
                <StatCol w={78} label="followers" />
                <StatCol w={58} label="following" />
              </div>
            </div>

            {/* name + bio */}
            <div style={{ padding: "20px 30px 0 30px" }}>
              <div style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>Flamingo</div>
              <div style={{ color: "#c9c4cc", fontSize: 24, fontWeight: 500, marginTop: 2 }}>
                Relationship app
              </div>
              <div style={{ color: "#e7e2ea", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginTop: 10 }}>
                Want more questions. The good ones.
                <br />
                Download the app{" "}
                <span style={{ display: "inline-block", transform: `translateY(${bob}px)` }}>👇</span>
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
                <span>apps.apple.com/app/flamingo-cards</span>
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
          </div>
        </div>
      </div>

      {/* ===== hand-drawn arrow → bio link ===== */}
      <svg
        style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 3, pointerEvents: "none" }}
        viewBox="0 0 1080 1920"
        fill="none"
      >
        <path
          d="M118 1384 C 56 1274, 92 1214, 262 1191"
          stroke={PINK}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - curveP}
        />
        <path
          d="M262 1191 l -34 -14"
          stroke={PINK}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - headP}
        />
        <path
          d="M262 1191 l -26 26"
          stroke={PINK}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - headP}
        />
      </svg>

      {/* ===== "tap the link!" ===== */}
      <div
        style={{
          position: "absolute",
          zIndex: 3,
          left: 34,
          top: 1380,
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
  );
};
