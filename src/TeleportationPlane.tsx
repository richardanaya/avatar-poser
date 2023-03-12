import { Interactive } from "@react-three/xr";
import { useState } from "react";
import { Vector3 } from "three";
import { useTeleportation } from "./useTeleportation";

export function TeleportationPlane() {
  const { teleportTo } = useTeleportation();
  const [intersection, setIntersection] = useState<Vector3 | null>(null);

  return (
    <>
      {intersection && (
        <mesh position={intersection} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry attach="geometry" args={[0.5, 32]} />
          <meshBasicMaterial attach="material" color="white" />
        </mesh>
      )}
      <Interactive
        onMove={(e) => {
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
        onSelectEnd={(e) => {
          if (e.intersection) {
            teleportTo(
              new Vector3(
                e.intersection?.point.x,
                e.intersection?.point.y,
                e.intersection?.point.z
              )
            );
          }
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[100, 100, 100]}>
          <planeBufferGeometry attach="geometry" args={[1, 1]} />
          <meshBasicMaterial attach="material" transparent opacity={0} />
        </mesh>
      </Interactive>
    </>
  );
}
