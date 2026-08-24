import { Composition } from "remotion";
import { CTA } from "./CTA";
import { CTAReel } from "./CTAReel";
import { CTAReelBoost } from "./CTAReelBoost";
import { CTAFlashcard } from "./CTAFlashcard";
import { Reel, REEL_DURATION } from "./Reel";

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
