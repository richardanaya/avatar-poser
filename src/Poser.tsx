import { Avatar, AvatarPose } from "react-three-avatar";
import { Hud, OrthographicCamera } from "@react-three/drei";
import { useEffect, useState } from "react";
import { useWindowSize } from "@react-hook/window-size";
import { PoserHud } from "./PoserHud";

export type PoseAnimation = {
  length: number;
  keyframes: {
    time: number;
    pose: AvatarPose;
  }[];
};

export type PoserProps = {
  url: string;
  onInteractingChanged?: (interacting: boolean) => void;
};

export const Poser = ({ url, onInteractingChanged }: PoserProps) => {
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

  return (
    <>
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
          height={editorHeight}
          position={[0, offsetY, 0]}
          onTimeChange={(_) => setCurrentTime(_)}
          onAnimationChange={(_) => setAnimation(_)}
          onPointerDown={(_) => {
            onInteractingChanged?.(true);
          }}
          onPointerUp={(_) => {
            onInteractingChanged?.(false);
          }}
          onInteractingChanged={(_) => {
            onInteractingChanged?.(_);
          }}
        />
        <ambientLight intensity={1} />
        <pointLight position={[200, 200, 100]} intensity={0.5} />
      </Hud>
    </>
  );
};
