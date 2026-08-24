import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BG, enter, fontFamily, PINK, SlideBg } from "./ui";

export const TitleSlide: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeP = spring({ frame, fps, config: { damping: 12, mass: 0.8, stiffness: 120 } });
  const badgeStyle: React.CSSProperties = {
    opacity: interpolate(badgeP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
    transform: `scale(${interpolate(badgeP, [0, 1], [0.4, 1])}) rotate(${interpolate(badgeP, [0, 1], [-12, 0])}deg)`,
  };

  const arrowNudge = Math.sin(frame / 7) * 6;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily }}>
      <SlideBg />
      <AbsoluteFill
        style={{
          zIndex: 2,
          padding: "92px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* logo badge */}
        <div
          style={{
            width: 134,
            height: 134,
            borderRadius: 32,
            background: "linear-gradient(160deg, #1c1c1f 0%, #0c0c0e 100%)",
            boxShadow: "0 14px 34px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...badgeStyle,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#fff" }}>flamin</span>
            <span style={{ color: PINK }}>go</span>
          </div>
        </div>

        {/* headline */}
        <div style={{ margin: "auto 0" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 104,
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#fff",
              ...enter(frame, 8, 26, 40),
            }}
          >
            {title}
          </h1>
        </div>

        {/* teaser line */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, ...enter(frame, 28, 16, 24) }}>
          <span style={{ color: "#fff", fontSize: 36, fontWeight: 600 }}>no lying allowed</span>
          <span style={{ fontSize: 40, display: "inline-block", transform: `translateY(${arrowNudge * 0.5}px)` }}>👀</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
