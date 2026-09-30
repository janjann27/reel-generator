import { Composition } from "remotion";
import { CTA } from "./CTA";
import { CTAReel } from "./CTAReel";
import { CTAReelBoost } from "./CTAReelBoost";
import { CTAFlashcard } from "./CTAFlashcard";
import { Reel, REEL_DURATION } from "./Reel";
import { PauseDare, PAUSE_DARE_DURATION } from "./reels/PauseDare";
import { ScreenshotRoulette, ROULETTE_DURATION } from "./reels/ScreenshotRoulette";
import { OweYou, OWE_YOU_BF, OWE_YOU_DURATION, OWE_YOU_MC } from "./reels/OweYou";
import { MemeReel, MEMES, MEME_DURATION } from "./reels/Memes";
import { ThisOrThat, THIS_OR_THAT_DURATION } from "./reels/ThisOrThat";
import { ExQuiz, EX_QUIZ, MAD_QUIZ, quizDuration } from "./reels/convos/ExQuiz";
import { PickOne, PICK_ONE, PICK_SHORT, pickOneDuration } from "./reels/abcd/PickOne";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={REEL_DURATION}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="CTA"
        component={CTA}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="CTAReel"
        component={CTAReel}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CTAReelBoost"
        component={CTAReelBoost}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CTAReelBoost4x5"
        component={CTAReelBoost}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="PauseDare"
        component={PauseDare}
        durationInFrames={PAUSE_DARE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ScreenshotRoulette"
        component={ScreenshotRoulette}
        durationInFrames={ROULETTE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="OweYou"
        component={OweYou}
        defaultProps={OWE_YOU_MC}
        durationInFrames={OWE_YOU_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="OweYouBoyfriend"
        component={OweYou}
        defaultProps={OWE_YOU_BF}
        durationInFrames={OWE_YOU_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ThisOrThat"
        component={ThisOrThat}
        durationInFrames={THIS_OR_THAT_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ExQuiz"
        component={ExQuiz}
        defaultProps={EX_QUIZ}
        durationInFrames={quizDuration(EX_QUIZ)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MadQuiz"
        component={ExQuiz}
        defaultProps={MAD_QUIZ}
        durationInFrames={quizDuration(MAD_QUIZ)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PickOne"
        component={PickOne}
        defaultProps={PICK_ONE}
        durationInFrames={pickOneDuration(PICK_ONE)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PickShort"
        component={PickOne}
        defaultProps={PICK_SHORT}
        durationInFrames={pickOneDuration(PICK_SHORT)}
        fps={30}
        width={1080}
        height={1920}
      />
      {MEMES.map((m) => (
        <Composition
          key={m.id}
          id={m.id}
          component={MemeReel}
          defaultProps={{ meme: m }}
          durationInFrames={MEME_DURATION}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
      <Composition
        id="CTAFlashcard"
        component={CTAFlashcard}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1350}
      />
    </>
  );
};
