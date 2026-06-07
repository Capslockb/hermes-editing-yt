import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import CanvasLoader from "../loader";
import { useDeviceOrientation } from "../../hooks/use-device-orientation";
import { useInCenterViewport } from "../../hooks/use-in-center-viewport";

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
// own.
type EarthProps = {
  inCenter: boolean;
  gyro: { beta: number; gamma: number } | null;
};

const Earth = ({ inCenter, gyro }: EarthProps) => {
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

  const groupRef = useRef<THREE.Group>(null);
  const rotY = useRef(0);
  const lerpY = useRef(0);
  const lerpX = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Faster rotation when in the center 25% of the viewport.
    const speed = inCenter ? 0.4 : 0.1;
    rotY.current += delta * speed;
    lerpY.current += (rotY.current - lerpY.current) * 0.1;

    let targetX = 0;
    if (gyro) {
      targetX = ((gyro.beta - 30) / 45) * 0.2;
      targetX = Math.max(-0.6, Math.min(0.6, targetX));
    }
    lerpX.current += (targetX - lerpX.current) * 0.08;

    groupRef.current.rotation.y = lerpY.current;
    groupRef.current.rotation.x = lerpX.current;
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={2.5}
        position-y={0}
        rotation-y={0}
      />
    </group>
  );
};

// Earth Canvas
const EarthCanvas = () => {
  const [sectionRef, inCenter] = useInCenterViewport<HTMLDivElement>(0.25);
  const gyro = useDeviceOrientation();

  // Recompute on resize so the observer picks up the new element size.
  useEffect(() => {
    // no-op; IntersectionObserver auto-updates on resize.
  }, []);

  return (
    <div
      ref={sectionRef}
      className="absolute inset-0 w-full h-full"
    >
      <Canvas
        shadows
        frameloop="always"
        gl={{ preserveDrawingBuffer: true }}
        camera={{ fov: 45, near: 0.1, far: 200, position: [-4, 3, 6] }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls
            autoRotate={false}
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
          <Earth
            inCenter={inCenter}
            gyro={gyro?.granted ? { beta: gyro.beta, gamma: gyro.gamma } : null}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EarthCanvas;
