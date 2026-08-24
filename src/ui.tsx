import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const PINK = "#FF4E96";
export const BG = "#050507";
export const DOTS =
  "url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2254%22%20height=%2254%22%3E%3Ccircle%20cx=%2227%22%20cy=%2227%22%20r=%221.8%22%20fill=%22%23ff4e96%22%20fill-opacity=%220.08%22/%3E%3C/svg%3E')";

/** Fade + directional slide entrance. */
export const enter = (
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

type QMarkDef = {
  size: number;
  stroke: number;
  color: string;
  rotate: number;
  phase: number;
  amp: number;
  pos: React.CSSProperties;
};

// The 7 stroked "?" marks shared by the hook + question slides.
const QMARKS: QMarkDef[] = [
  { size: 660, stroke: 7, color: "rgba(255,78,150,0.16)", rotate: 12, phase: 0, amp: 14, pos: { top: -150, right: -60 } },
  { size: 540, stroke: 7, color: "rgba(255,78,150,0.12)", rotate: -8, phase: 120, amp: 18, pos: { bottom: -210, left: -40 } },
  { size: 170, stroke: 4, color: "rgba(255,78,150,0.18)", rotate: -12, phase: 40, amp: 10, pos: { top: 150, left: 100 } },
  { size: 130, stroke: 3.5, color: "rgba(255,78,150,0.15)", rotate: 8, phase: 200, amp: 9, pos: { top: 470, right: 150 } },
  { size: 110, stroke: 3.5, color: "rgba(255,78,150,0.14)", rotate: 6, phase: 90, amp: 8, pos: { bottom: 360, left: 70 } },
  { size: 150, stroke: 4, color: "rgba(255,78,150,0.16)", rotate: -7, phase: 260, amp: 11, pos: { bottom: 250, right: 90 } },
  { size: 90, stroke: 3, color: "rgba(255,78,150,0.13)", rotate: 14, phase: 160, amp: 7, pos: { top: 760, left: 200 } },
];

/** Shared slide background: dark base, pink dots, floating question marks. */
export const SlideBg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ zIndex: 0, backgroundColor: "#08070a", backgroundImage: DOTS }}>
      {QMARKS.map((q, i) => {
        const drift = Math.sin((frame + q.phase) / 34) * q.amp;
        const spin = q.rotate + Math.sin((frame + q.phase) / 48) * 1.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              fontSize: q.size,
              fontWeight: 800,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: `${q.stroke}px ${q.color}`,
              transform: `translateY(${drift}px) rotate(${spin}deg)`,
              ...q.pos,
            }}
          >
            ?
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Flamingo wordmark. */
export const Wordmark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.02em" }}>
    <span style={{ color: "#fff" }}>flamin</span>
    <span style={{ color: PINK }}>go</span>
  </div>
);

/** Reel progress indicator: one pill per slide, active one pink + wide. */
export const ProgressDots: React.FC<{ index: number; total: number }> = ({ index, total }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    {Array.from({ length: total }).map((_, i) => {
      const active = i === index - 1;
      return (
        <div
          key={i}
          style={{
            width: active ? 48 : 14,
            height: 14,
            borderRadius: 999,
            background: active ? PINK : "rgba(255,255,255,0.22)",
          }}
        />
      );
    })}
  </div>
);

/** "1,000+ more in our bio 👇" pink pill (with bobbing pointer). */
export const BioPill: React.FC<{ bob?: number }> = ({ bob = 0 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "18px 32px",
      borderRadius: 999,
      background: PINK,
    }}
  >
    <span style={{ color: "#fff", fontSize: 32, fontWeight: 600 }}>1,000+ more in our bio</span>
    <span style={{ fontSize: 32, display: "inline-block", transform: `translateY(${bob}px)` }}>👇</span>
  </div>
);
