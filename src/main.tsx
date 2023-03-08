import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import "./index.css";
import { Poser } from "./Poser";
import { Environment } from "@react-three/drei";
import { useMemo } from "react";
import { Controllers, VRButton, XR } from "@react-three/xr";
import { eigenlumin } from "./colors";

const queryParams = new URLSearchParams(window.location.search);
const modelUrl = queryParams.get("model");

const App = () => {
  const model = useMemo(
    () =>
      modelUrl
        ? modelUrl
        : Math.random() < 0.5
        ? "https://models.readyplayer.me/640765d93e6d860c1d738326.glb"
        : "https://models.readyplayer.me/6407fbec0ed60d89a2c64367.glb",
    []
  );
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "white",
          font: "0.8125rem sans-serif",
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        ＡＶＡＴＡＲ　ＰＯＳＥＲ
      </div>
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
          userSelect: "none",
        }}
      >
        VR
      </VRButton>
      <Canvas>
        <XR>
          <Poser url={model} />
          <color attach="background" args={["#16161b"]} />
          <ambientLight />
          <Controllers />
          <Environment preset="city" />
        </XR>
      </Canvas>
    </>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
