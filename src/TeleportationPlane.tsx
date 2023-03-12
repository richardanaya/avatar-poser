import { Interactive, useXR } from "@react-three/xr";
import { useState } from "react";
import { Vector3 } from "three";
import { useTeleportation } from "./useTeleportation";

export type TeleportationPlaneProps = {
  leftHand?: boolean;
  rightHand?: boolean;
};

export function TeleportationPlane(props: TeleportationPlaneProps) {
  const { teleportTo } = useTeleportation();
  const [intersection, setIntersection] = useState<Vector3 | null>(null);
  const { controllers } = useXR();
  const [size, setSize] = useState(0.3);

  return (
    <>
      {intersection && (
        <mesh position={intersection} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry attach="geometry" args={[size, 32]} />
          <meshBasicMaterial attach="material" color="white" />
        </mesh>
      )}
      <Interactive
        onMove={(e) => {
          if (
            (e.target.inputSource.handedness === "left" && !props.leftHand) ||
            (e.target.inputSource.handedness === "right" && !props.rightHand)
          ) {
            return;
          }
          if (e.intersection) {
            setIntersection(
              new Vector3(
                e.intersection.point.x,
                e.intersection.point.y,
                e.intersection.point.z
              )
            );
          }
        }}
        onHover={(e) => {
          if (
            (e.target.inputSource.handedness === "left" && !props.leftHand) ||
            (e.target.inputSource.handedness === "right" && !props.rightHand)
          ) {
            return;
          }
          if (e.intersection) {
            setSize(0.3);
          }
        }}
        onBlur={(e) => {
          if (
            (e.target.inputSource.handedness === "left" && !props.leftHand) ||
            (e.target.inputSource.handedness === "right" && !props.rightHand)
          ) {
            return;
          }
          setSize(0);
        }}
        onSelectStart={(e) => {
          if (
            (e.target.inputSource.handedness === "left" && !props.leftHand) ||
            (e.target.inputSource.handedness === "right" && !props.rightHand)
          ) {
            return;
          }
          setSize(0.35);
        }}
        onSelectEnd={(e) => {
          setSize(0.3);
          if (
            (e.target.inputSource.handedness === "left" && !props.leftHand) ||
            (e.target.inputSource.handedness === "right" && !props.rightHand)
          ) {
            return;
          }
          if (intersection) {
            teleportTo(intersection);
          }
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1000, 1000, 1000]}>
          <planeBufferGeometry attach="geometry" args={[1, 1]} />
          <meshBasicMaterial attach="material" transparent opacity={0} />
        </mesh>
      </Interactive>
    </>
  );
}
