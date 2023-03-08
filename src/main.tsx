import { createRoot } from 'react-dom/client'
import { Canvas, } from '@react-three/fiber'
import "./index.css";
import { Poser } from './Poser';
import { EffectComposer, DepthOfField, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { Environment, OrbitControls } from '@react-three/drei';
import { useState } from 'react';

const ROTATION_STEP = Math.PI / 180;


const App = () => {
  const [interacting, setInteracting] = useState(false);
  return <Canvas>
    <color attach="background" args={['#16161b']} />
    <ambientLight />
    <OrbitControls enableDamping={false} enabled={!interacting} />
    <Poser url="https://models.readyplayer.me/640765d93e6d860c1d738326.glb" onInteractingChanged={_ => {
      setInteracting(_);
    }} />
    <Environment preset="city" />
    <EffectComposer>
      <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
      <Bloom luminanceThreshold={0} luminanceSmoothing={2} height={300} />
      <Noise opacity={0.02} />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  </Canvas>;
}

createRoot(document.getElementById('root')!).render(
  <App />,
)