import { Composition } from "remotion";
import { DoodleListicle, JEALOUS_BF, WEIRD_BF, CRY_BF, HUNGRY_BF, CRASHOUT_GF, doodleDuration } from "./reels/doodle/DoodleListicle";

const DOODLES = [
  { id: "DoodleJealousBf", props: JEALOUS_BF },
  { id: "DoodleWeirdBf", props: WEIRD_BF },
  { id: "DoodleCryBf", props: CRY_BF },
  { id: "DoodleHungryBf", props: HUNGRY_BF },
  { id: "DoodleCrashoutGf", props: CRASHOUT_GF },
];

export const MyComposition = () => {
  return (
    <>
      {DOODLES.map(({ id, props }) => (
        <Composition
          key={id}
          id={id}
          component={DoodleListicle}
          durationInFrames={doodleDuration(props)}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={props}
        />
      ))}
    </>
  );
};
