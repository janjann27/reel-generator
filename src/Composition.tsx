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
import { ViralGame, VIRAL_GAMES, viralGameDuration } from "./reels/viral/ViralGame";
import { QuestionFor, QUESTIONS_FOR, QUESTION_FOR_DURATION, QUESTION_FOR_FPS } from "./reels/viral/QuestionFor";
import { VERDICTS } from "./reels/viral/Verdict";
import { QuestionCard, QUESTION_CARDS, QUESTION_CARD_DURATION, QUESTION_CARD_FPS } from "./reels/viral/QuestionCard";
import { CouplePostReel, COUPLE_POSTS, COUPLE_POST_DURATION } from "./reels/CouplePost";

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
      {VIRAL_GAMES.map(({ id, ...p }) => (
        <Composition
          key={id}
          id={id}
          component={ViralGame}
          defaultProps={p}
          durationInFrames={viralGameDuration(p)}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
      {QUESTIONS_FOR.map(({ id, ...p }) => (
        <Composition
          key={id}
          id={id}
          component={QuestionFor}
          defaultProps={p}
          durationInFrames={QUESTION_FOR_DURATION}
          fps={QUESTION_FOR_FPS}
          width={1080}
          height={1920}
        />
      ))}
      {VERDICTS.map(({ id, ...p }) => (
        <Composition
          key={id}
          id={id}
          component={QuestionFor}
          defaultProps={p}
          durationInFrames={QUESTION_FOR_DURATION}
          fps={QUESTION_FOR_FPS}
          width={1080}
          height={1920}
        />
      ))}
      {QUESTION_CARDS.map(({ id, ...p }) => (
        <Composition
          key={id}
          id={id}
          component={QuestionCard}
          defaultProps={p}
          durationInFrames={QUESTION_CARD_DURATION}
          fps={QUESTION_CARD_FPS}
          width={1080}
          height={1920}
        />
      ))}
      {COUPLE_POSTS.map((t) => (
        <Composition
          key={t.id}
          id={t.id}
          component={CouplePostReel}
          defaultProps={{ post: t }}
          durationInFrames={COUPLE_POST_DURATION}
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
