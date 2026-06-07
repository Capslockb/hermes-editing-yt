import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

import CanvasLoader from "../loader";

// Use the .glb (single-file binary glTF) instead of the .gltf + .bin
// multi-file form. See ComputersCanvas for the rationale.
const earthUrl = `${import.meta.env.BASE_URL}planet/scene.glb`;

// The GLB contains a "Clouds" mesh layered on top of the "Planet"
// mesh. The cloud material's baseColorTexture is a 1024x1024 RGB PNG
// (no alpha channel) — the cloud shapes are white-ish on a black
// background. With the default OPAQUE alpha mode this renders as a
// black sphere with white splotches, occluding the planet body.
//
// Fix: traverse the loaded scene and remove any mesh whose material
// is named "Clouds". The planet body underneath looks fine on its
// own. (Earlier we tried setting transparent + alphaTest on the
// material, but the source PNG's lack of alpha makes any alpha-based
// fix look wrong without also baking an alpha channel.)
const Earth = () => {
  const gltf = useGLTF(earthUrl);
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!(mesh as THREE.Mesh).isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (mats.some((m) => m?.name === "Clouds")) {
        mesh.visible = false;
      }
    });
    return cloned;
  }, [gltf]);

  return (
    <primitive object={scene} scale={2.5} position-y={0} rotation-y={0} />
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
