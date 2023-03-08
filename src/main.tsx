import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import "./index.css";
import { Poser } from "./Poser";
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { Environment, OrbitControls } from "@react-three/drei";
import { useMemo, useState } from "react";
import { Controllers, Hands, useXR, VRButton, XR } from "@react-three/xr";
import { eigengrau, eigenlumin } from "./colors";

const ROTATION_STEP = Math.PI / 180;

const App = () => {
  const model = useMemo(
    () =>
      Math.random() < 0.5
        ? "https://models.readyplayer.me/640765d93e6d860c1d738326.glb"
        : "https://models.readyplayer.me/6407fbec0ed60d89a2c64367.glb",
    []
  );
  return (
    <>
      <VRButton
        className="vr-button"
        style={{
          position: "absolute",
          bottom: "24px",
          padding: "12px 24px",
          width: "auto",
          border: "1px solid " + eigenlumin,
          borderRadius: "4px",
          background: "rgba(0, 0, 0, 0.1)",
          color: "white",
          font: "0.8125rem sans-serif",
          outline: "none",
          zIndex: 99999,
          cursor: "pointer",
          top: "10px",
          right: "10px",
          height: "40px",
          opacity: 0.5,
        }}
      >
        VR
      </VRButton>
      <Canvas>
        <color attach="background" args={["#16161b"]} />
        <ambientLight />
        <XR>
          <Controllers />
          <Hands />
          <Poser url={model} />
          <Environment preset="city" />
        </XR>
      </Canvas>
    </>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
