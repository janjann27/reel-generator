import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BG, enter, fontFamily, PINK, ProgressDots, SlideBg, Wordmark } from "./ui";

const pad2 = (n: number) => (n < 10 ? "0" + n : String(n));

export const QuestionSlide: React.FC<{
  index: number;
  total: number;
  question: string;
}> = ({ index, total, question }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Question text: fade-up with slight scale settle (the star of the slide).
  const qP = spring({ frame: frame - 12, fps, config: { damping: 18, mass: 1, stiffness: 90 } });
  const qStyle: React.CSSProperties = {
    opacity: interpolate(qP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
    transform: `translateY(${interpolate(qP, [0, 1], [50, 0])}px) scale(${interpolate(qP, [0, 1], [0.96, 1])})`,
    transformOrigin: "left center",
  };

  return (
    <AbsoluteFill style={{ background: BG, fontFamily }}>
      <SlideBg />
      <AbsoluteFill
        style={{
          zIndex: 2,
          padding: "92px 80px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* top: wordmark */}
        <div style={{ ...enter(frame, 0, 14, -22) }}>
          <Wordmark size={38} />
        </div>

        {/* question block */}
        <div style={{ margin: "auto 0" }}>
          <div
            style={{
              color: PINK,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.16em",
              marginBottom: 24,
              ...enter(frame, 8, 14, 24),
            }}
          >
            {pad2(index)} <span style={{ color: "rgba(255,255,255,0.4)" }}>/ {pad2(total)}</span>
          </div>
          <p
            style={{
              margin: 0,
              color: "#fff",
              fontSize: 78,
              fontWeight: 600,
              lineHeight: 1.16,
              letterSpacing: "-0.015em",
              ...qStyle,
            }}
          >
            {question}
          </p>
        </div>

        {/* bottom: reel progress */}
        <div style={{ display: "flex", justifyContent: "center", ...enter(frame, 30, 16, 20) }}>
          <ProgressDots index={index} total={total} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
