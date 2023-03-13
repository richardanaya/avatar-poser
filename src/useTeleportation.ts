import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useCallback, useEffect, useState } from "react";
import { Quaternion, Vector3 } from "three";

export function useTeleportation() {
  const [baseReferenceSpace, setBaseReferenceSpace] =
    useState<XRReferenceSpace | null>(null);
  const gl = useThree((state) => state.gl);
  const { session } = useXR();

  useEffect(() => {
    const b = gl.xr.getReferenceSpace();
    if (b) {
      setBaseReferenceSpace(b);
    }
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
    async (worldPosition: Vector3) => {
      if (baseReferenceSpace && session) {
        const pose = await new Promise<XRViewerPose | undefined>((resolve) => {
          session.requestAnimationFrame((_, xrFrame) => {
            const pose = xrFrame.getViewerPose(baseReferenceSpace);
            resolve(pose);
          });
        });

        const offsetX = pose?.transform.position.x || 0;
        const offsetZ = pose?.transform.position.z || 0;

        const offsetFromBase = {
          x: -worldPosition.x + offsetX,
          y: -worldPosition.y,
          z: -worldPosition.z + offsetZ,
        };
        const transform = new XRRigidTransform(
          offsetFromBase,
          new Quaternion()
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
