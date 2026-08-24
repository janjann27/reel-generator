import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { TitleSlide } from "./TitleSlide";
import { QuestionSlide } from "./QuestionSlide";
import { CTA } from "./CTA";
import { BG } from "./ui";

const TITLE = "Top 5 questions your partner can't lie about";

const QUESTIONS = [
  "Would you rather kiss someone else for $10M, or kiss me for $10?",
  "Do you love me because I'm pretty, or think I'm pretty because you love me?",
  "Would you drop all your opposite-sex friends, or drop me?",
  "What's the biggest lie you've told to protect my feelings?",
  "What's your most honest ick about me?",
];

// Per-slide frame lengths (30fps).
const TITLE_LEN = 96;
const Q_LEN = 120;
const CTA_LEN = 180;
const TR = 28; // swipe transition length

// Reel duration = sum(sequences) - sum(transitions). Auto-computed so the
// composition never drifts when questions are added/removed.
export const REEL_DURATION =
  TITLE_LEN + QUESTIONS.length * Q_LEN + CTA_LEN - (QUESTIONS.length + 1) * TR;

const swipe = () => (
  <TransitionSeries.Transition
    timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })}
    presentation={slide({ direction: "from-right" })}
  />
);

export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BG }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_LEN}>
          <TitleSlide title={TITLE} />
        </TransitionSeries.Sequence>

        {QUESTIONS.map((q, i) => (
          <React.Fragment key={i}>
            {swipe()}
            <TransitionSeries.Sequence durationInFrames={Q_LEN}>
              <QuestionSlide index={i + 1} total={QUESTIONS.length} question={q} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}

        {swipe()}
        <TransitionSeries.Sequence durationInFrames={CTA_LEN}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
