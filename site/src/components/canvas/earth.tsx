import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import CanvasLoader from "../loader";

// Use the .glb (single-file binary glTF) instead of the .gltf + .bin
// multi-file form. See ComputersCanvas for the rationale.
const earthUrl = `${import.meta.env.BASE_URL}planet/scene.glb`;

// Earth
const Earth = () => {
  // import earth scene
  const earth = useGLTF(earthUrl);

  return (
    <primitive object={earth.scene} scale={2.5} position-y={0} rotation-y={0} />
  );
};

// Earth Canvas
const EarthCanvas = () => {
  return (
    <Canvas
      shadows
      frameloop="demand"
      gl={{ preserveDrawingBuffer: true }}
      camera={{ fov: 45, near: 0.1, far: 200, position: [-4, 3, 6] }}
    >
      {/* Suspense show Canvas Loader on fallback */}
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          autoRotate
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />

        {/* Earth */}
        <Earth />
      </Suspense>
    </Canvas>
  );
};

export default EarthCanvas;
