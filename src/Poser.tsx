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
import { Group } from "three";

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

export const Poser = ({ url }: PoserProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [animation, setAnimation] = useState<PoseAnimation | null>({
    length: 15,
    keyframes: [],
  });
  const [currentPose, setCurrentPose] = useState<AvatarPose>({});

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
      setCurrentPose(newPose);
    }
  }, [currentTime, animation]);

  const [width, height] = useWindowSize();

  const offsetY = -height / 3;
  const editorHeight = height / 4;
  const editorWidth = width * 0.9;

  const [interacting, setInteracting] = useState(false);

  const { isPresenting } = useXR();

  return (
    <>
      {!isPresenting && (
        <>
          <OrbitControls enableDamping={false} enabled={!interacting} />
          <Avatar
            url={url}
            position={[0, -5, 0]}
            pose={currentPose}
            scale={[4, 4, 4]}
          />
          <Hud renderPriority={4}>
            <OrthographicCamera makeDefault position={[0, 0, 100]} />
            <PoserHud
              width={editorWidth}
              height={Math.max(editorHeight, 200)}
              position={[0, offsetY, 0]}
              onTimeChange={(_) => setCurrentTime(_)}
              onAnimationChange={(_) => setAnimation(_)}
              onPointerDown={(_) => {
                setInteracting(true);
              }}
              onPointerUp={(_) => {
                setInteracting(false);
              }}
              onInteractingChanged={(_) => {
                setInteracting(_);
              }}
            />
            <ambientLight intensity={1} />
            <pointLight position={[200, 200, 100]} intensity={0.5} />
          </Hud>
          <EffectComposer>
            <DepthOfField
              focusDistance={0}
              focalLength={0.02}
              bokehScale={2}
              height={480}
            />
            <Bloom luminanceThreshold={0} luminanceSmoothing={2} height={300} />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </>
      )}
      {isPresenting && (
        <group position={[0, 0, -1]}>
          <Avatar url={url} pose={currentPose} />
          <PoserHud
            width={1200}
            height={250}
            position={[0, 1.2, 0.5]}
            rotation={[-Math.PI / 4, 0, 0]}
            scale={0.001}
            onTimeChange={(_) => setCurrentTime(_)}
            onAnimationChange={(_) => setAnimation(_)}
            onPointerDown={(_) => {
              setInteracting(true);
            }}
            onPointerUp={(_) => {
              setInteracting(false);
            }}
            onInteractingChanged={(_) => {
              setInteracting(_);
            }}
          />
        </group>
      )}
    </>
  );
};
