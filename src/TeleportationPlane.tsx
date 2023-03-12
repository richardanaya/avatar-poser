import { useThree } from "@react-three/fiber";
import { Interactive, useXR } from "@react-three/xr";
import { useState } from "react";
import { Vector3 } from "three";
import { useTeleportation } from "./useTeleportation";

export type TeleportationPlaneProps = {
  leftHand?: boolean;
  rightHand?: boolean;
  maxDistance?: number;
};

const MARKER_SIZE = 0.25;

export function TeleportationPlane(props: TeleportationPlaneProps) {
  const { teleportTo } = useTeleportation();
  const [intersection, setIntersection] = useState<Vector3 | null>(null);
  const { controllers } = useXR();
  const [size, setSize] = useState(MARKER_SIZE);
  const maxDistanceTeleport = props.maxDistance || 10;
  const { camera } = useThree();

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
            const distanceFromCamera = e.intersection.point.distanceTo(
              camera.position
            );
            if (distanceFromCamera > maxDistanceTeleport) {
              setSize(0);
            } else {
              setSize(MARKER_SIZE);
            }
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
            const distanceFromCamera = e.intersection.point.distanceTo(
              camera.position
            );
            if (distanceFromCamera > maxDistanceTeleport) {
              setSize(0);
            } else {
              setSize(MARKER_SIZE);
            }
            setSize(MARKER_SIZE);
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
          if (e.intersection) {
            const distanceFromCamera = e.intersection.point.distanceTo(
              camera.position
            );
            if (distanceFromCamera > maxDistanceTeleport) {
              setSize(0);
            } else {
              setSize(MARKER_SIZE * 1.1);
            }
          }
        }}
        onSelectEnd={(e) => {
          setSize(MARKER_SIZE);
          if (
            (e.target.inputSource.handedness === "left" && !props.leftHand) ||
            (e.target.inputSource.handedness === "right" && !props.rightHand)
          ) {
            return;
          }
          if (intersection) {
            const distanceFromCamera = intersection.distanceTo(camera.position);
            if (distanceFromCamera <= maxDistanceTeleport) {
              teleportTo(intersection);
            }
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
