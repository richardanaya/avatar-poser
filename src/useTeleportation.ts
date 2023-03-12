import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { Quaternion, Vector3 } from "three";

export function useTeleportation() {
  const [baseReferenceSpace, setBaseReferenceSpace] =
    useState<XRReferenceSpace | null>(null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const onSessionStart = () => {
      if (gl.xr) {
        setBaseReferenceSpace(gl.xr.getReferenceSpace());
      }
    };
    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => {
      gl.xr.removeEventListener("sessionstart", onSessionStart);
    };
  }, [gl]);

  const teleportTo = useCallback(
    (worldPosition: Vector3, offsetRotation?: Quaternion) => {
      if (baseReferenceSpace) {
        const offsetFromBase = {
          x: -worldPosition.x,
          y: -worldPosition.y,
          z: -worldPosition.z,
        };
        const transform = new XRRigidTransform(
          offsetFromBase,
          offsetRotation || new Quaternion()
        );
        const teleportSpaceOffset =
          baseReferenceSpace.getOffsetReferenceSpace(transform);
        gl.xr.setReferenceSpace(teleportSpaceOffset);
      }
    },
    [baseReferenceSpace]
  );

  return {
    teleportTo,
  };
}
