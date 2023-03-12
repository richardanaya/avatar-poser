import { Avatar, AvatarPose, SimpleEuler } from "react-three-avatar";
import {
  Hud,
  OrbitControls,
  OrthographicCamera,
  Plane,
} from "@react-three/drei";
import { useEffect, useState } from "react";
import { useWindowSize } from "@react-hook/window-size";
import { PoserHud } from "./PoserHud";
import { Interactive, useXR } from "@react-three/xr";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import create from "zustand";
import { useTeleportation } from "./useTeleportation";
import { Vector3 } from "three";

export type PoseKeyframe = {
  time: number;
  pose: AvatarPose;
};

export type PoseAnimation = {
  length: number;
  keyframes: PoseKeyframe[];
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

      const newPose: AvatarPose = {};

      const allBoneNamesOfAllKeyframes: Set<keyof AvatarPose> = new Set();
      keyframes.forEach((keyframe) => {
        Object.keys(keyframe.pose).forEach((boneName) => {
          allBoneNamesOfAllKeyframes.add(boneName as keyof AvatarPose);
        });
      });

      allBoneNamesOfAllKeyframes.forEach((boneName) => {
        // sort from earliest to latest
        const boneKeyframes = keyframes
          .filter((keyframe) => keyframe.pose[boneName] !== undefined)
          .sort((a, b) => a.time - b.time);

        if (boneKeyframes.length === 0) {
          return;
        }

        const lastFrameWithBoneBeforeCurrentTime = boneKeyframes.reduce<
          PoseKeyframe | undefined
        >((prev, curr) => {
          if (curr.time <= currentTime) {
            return curr;
          }
          return prev;
        }, undefined);

        if (!lastFrameWithBoneBeforeCurrentTime) {
          return;
        }

        const nextFrameWithBoneAfterCurrentTime = boneKeyframes.find(
          (keyframe) => keyframe.time > currentTime
        );

        if (!nextFrameWithBoneAfterCurrentTime) {
          // @ts-ignore
          newPose[boneName] = lastFrameWithBoneBeforeCurrentTime.pose[boneName];
          return;
        }

        const timeDiff =
          nextFrameWithBoneAfterCurrentTime.time -
          lastFrameWithBoneBeforeCurrentTime.time;
        const timeDiffFromLastFrame =
          currentTime - lastFrameWithBoneBeforeCurrentTime.time;

        const lerp = timeDiffFromLastFrame / timeDiff;

        // @ts-ignore
        const lastFrameValue =
          lastFrameWithBoneBeforeCurrentTime.pose[boneName];
        // @ts-ignore
        const nextFrameValue = nextFrameWithBoneAfterCurrentTime.pose[boneName];

        if (typeof lastFrameValue === "number") {
          const nextValue = nextFrameValue as number;
          // @ts-ignore
          newPose[boneName] =
            lastFrameValue + (nextValue - lastFrameValue) * lerp;
          return;
        }

        if (typeof lastFrameValue === "object") {
          const nextVector = nextFrameValue as SimpleEuler;
          // @ts-ignore
          newPose[boneName] = {
            x: lastFrameValue.x + (nextVector.x - lastFrameValue.x) * lerp,
            y: lastFrameValue.y + (nextVector.y - lastFrameValue.y) * lerp,
            z: lastFrameValue.z + (nextVector.z - lastFrameValue.z) * lerp,
          };
          return;
        }

        throw new Error("Unknown type");
      });

      setCurrentPose(newPose);
    }
  }, [currentTime, animation]);

  const [width, height] = useWindowSize();
  fancy;
  const offsetY = -height / 3;
  const editorHeight = height / 4;
  const editorWidth = width * 0.9;

  const { isPresenting } = useXR();
  const { teleportTo } = useTeleportation();

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
            <Interactive
              onSelectEnd={(e) => {
                const worldPosition = new Vector3();
                e.intersections[0].object.getWorldPosition(worldPosition);
                teleportTo(worldPosition);
              }}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[100, 100, 100]}>
                <planeBufferGeometry attach="geometry" args={[1, 1]} />
                <meshBasicMaterial
                  attach="material"
                  color="white"
                  transparent
                  opacity={0.5}
                />
              </mesh>
            </Interactive>
          </>
        )}
      </group>
    </>
  );
};
