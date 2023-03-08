import { Avatar, AvatarPose } from "react-three-avatar";
import { Hud, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useEffect, useState } from "react";
import { useWindowSize } from "@react-hook/window-size";
import { PoserHud } from "./PoserHud";
import { useXR } from "@react-three/xr";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import create from "zustand";

export type PoseAnimation = {
  length: number;
  keyframes: {
    time: number;
    pose: AvatarPose;
  }[];
};

export type PoserProps = {
  url: string;
};

const queryParams = new URLSearchParams(window.location.search);
const animationBase64 = queryParams.get("animation");
const animLength = queryParams.get("length");
const fancy = queryParams.get("fancy") === "true";
export interface IPoserStore {
  currentTime: number;
  currentPose: AvatarPose;
  animation: PoseAnimation;
  interacting: boolean;
  setInteracting: (interacting: boolean) => void;
  setCurrentTime: (update: (p: IPoserStore) => Partial<IPoserStore>) => void;
  setCurrentPose: (currentPose: AvatarPose) => void;
  setAnimation: (animation: PoseAnimation) => void;
}
export const usePoserStore = create<IPoserStore>((set) => ({
  currentTime: 0,
  currentPose: {},
  animation:
    animationBase64 === null
      ? {
          length: animLength !== null ? parseFloat(animLength) : 15,
          keyframes: [
            {
              time: 0,
              pose: {
                MouthOpen: 0.5,
                MouthSmile: 0.5,
                Neck: {
                  x: 0.6385,
                  y: -0.3685,
                  z: 0,
                },
              },
            },
          ],
        }
      : JSON.parse(atob(animationBase64)),
  interacting: false,
  setInteracting: (interacting: boolean) => set((_) => ({ interacting })),
  getCurrenttime: () => 0,
  setCurrentTime: (update: (p: IPoserStore) => Partial<IPoserStore>) =>
    set(update),
  setCurrentPose: (currentPose: AvatarPose) => set((_) => ({ currentPose })),
  setAnimation: (animation: PoseAnimation) => set((_) => ({ animation })),
}));

export const Poser = ({ url }: PoserProps) => {
  const { currentTime, currentPose, animation, setCurrentPose, interacting } =
    usePoserStore();

  useEffect(() => {
    if (animation) {
      const { keyframes } = animation;

      const newPose = {};
      for (let i = 0; i < keyframes.length; i++) {
        const { time, pose } = keyframes[i];
        if (time > currentTime) {
          break;
        }
        Object.assign(newPose, pose);
      }

      const nextKeyframe = keyframes.find((_) => _.time > currentTime);
      if (nextKeyframe) {
        const { time: nextTime, pose: nextPose } = nextKeyframe;
        // get the last most recent
        const mostRecentKeyframe = keyframes
          .filter((_) => _.time < currentTime)
          .sort((a, b) => a.time - b.time)
          .pop();

        if (mostRecentKeyframe) {
          const { time: mostRecentTime, pose } = mostRecentKeyframe;
          const timeDiff = nextTime - mostRecentTime;
          const timeSince = currentTime - mostRecentTime;
          const timeRatio = timeSince / timeDiff;
          for (const key in pose) {
            // @ts-ignore
            const value = pose[key] as
              | number
              | undefined
              | { x: number; y: number; z: number };
            if (value) {
              // @ts-ignore
              const nextValue = nextPose[key] as
                | number
                | undefined
                | { x: number; y: number; z: number };
              if (nextValue) {
                if (typeof value === "number") {
                  // @ts-ignore
                  newPose[key] = value + (nextValue - value) * timeRatio;
                } else {
                  if (typeof nextValue === "number") {
                  } else {
                    // @ts-ignore
                    newPose[key] = {
                      x: value.x + (nextValue.x - value.x) * timeRatio,
                      y: value.y + (nextValue.y - value.y) * timeRatio,
                      z: value.z + (nextValue.z - value.z) * timeRatio,
                    };
                  }
                }
              }
            }
          }
        }
      }

      setCurrentPose(newPose);
    }
  }, [currentTime, animation]);

  const [width, height] = useWindowSize();
  fancy;
  const offsetY = -height / 3;
  const editorHeight = height / 4;
  const editorWidth = width * 0.9;

  const { isPresenting } = useXR();

  return (
    <>
      <group position={isPresenting ? [0, 0, -1] : [0, 0, 0]}>
        <Avatar
          url={url}
          pose={currentPose}
          position={!isPresenting ? [0, -5, 0] : [0, 0, 0]}
          scale={!isPresenting ? [4, 4, 4] : [1, 1, 1]}
        />
        {!isPresenting && (
          <>
            <OrbitControls enableDamping={false} enabled={!interacting} />

            <Hud renderPriority={fancy ? 4 : 1}>
              <OrthographicCamera makeDefault position={[0, 0, 100]} />
              <PoserHud
                url={url}
                width={editorWidth}
                height={Math.max(editorHeight, 200)}
                position={[0, offsetY, 0]}
              />
              <ambientLight intensity={1} />
              <pointLight position={[200, 200, 100]} intensity={0.5} />
            </Hud>
            {fancy && (
              <EffectComposer>
                <DepthOfField
                  focusDistance={0}
                  focalLength={0.02}
                  bokehScale={2}
                  height={480}
                />
                <Bloom
                  luminanceThreshold={0}
                  luminanceSmoothing={2}
                  height={300}
                />
                <Noise opacity={0.02} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
              </EffectComposer>
            )}
          </>
        )}
        {isPresenting && (
          <>
            <PoserHud
              url={url}
              width={1200}
              height={250}
              position={[0, 1.2, 0.5]}
              rotation={[-Math.PI / 4, 0, 0]}
              scale={0.001}
            />
          </>
        )}
      </group>
    </>
  );
};
