import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import CanvasLoader from "../loader";
import { useDeviceOrientation } from "../../hooks/use-device-orientation";
import { useInCenterViewport } from "../../hooks/use-in-center-viewport";

// Use the .glb (single-file binary glTF) instead of the .gltf + .bin
// multi-file form. GitHub Pages does not serve .bin files, so the
// multi-file form was 404'ing on the GLTFLoader buffer request.
// .glb is a self-contained binary that's served as application/octet-
// stream and Pages has no problem with it.
const computerUrl = `${import.meta.env.BASE_URL}desktop_pc/scene.glb`;

type ComputersProps = {
  isMobile: boolean;
  inCenter: boolean;
  gyro: { beta: number; gamma: number } | null;
};

// Smoothly lerps toward a target value with a damping factor.
// Returns a stable callback suitable for useFrame.
const useLerp = (initial = 0) => {
  const ref = useRef(initial);
  return (target: number, factor = 0.08) => {
    ref.current += (target - ref.current) * factor;
    return ref.current;
  };
};

// Computers
const Computers = ({ isMobile, inCenter, gyro }: ComputersProps) => {
  const computer = useGLTF(computerUrl);
  const groupRef = useRef<THREE.Group>(null);
  const baseRotY = useRef<number>(-0.2);
  const baseRotX = useRef<number>(-0.01);
  const lerpY = useLerp(baseRotY.current);
  const lerpX = useLerp(baseRotX.current);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Idle drift: model slowly rotates when in viewport.
    const idleSpeed = inCenter ? 0.6 : 0.15;
    baseRotY.current += delta * idleSpeed;

    // Add gyro tilt on top of the idle rotation when present.
    // beta/gamma come from DeviceOrientation in degrees; we map
    // them to a small rotation offset (±0.3 rad ≈ ±17°).
    let targetX = baseRotX.current;
    let targetY = baseRotY.current;
    if (gyro) {
      // gamma is left/right; map to Y rotation. beta is front/back; map to X.
      targetY += (gyro.gamma / 45) * 0.3;
      targetX += ((gyro.beta - 30) / 45) * 0.3;
      // Clamp X so the model doesn't flip upside down.
      targetX = Math.max(-0.8, Math.min(0.8, targetX));
    }

    const newY = lerpY(targetY, inCenter ? 0.12 : 0.04);
    const newX = lerpX(targetX, inCenter ? 0.12 : 0.04);
    groupRef.current.rotation.y = newY;
    groupRef.current.rotation.x = newX;
  });

  return (
    <group ref={groupRef}>
      {/* Lights */}
      <hemisphereLight intensity={0.15} groundColor="black" />
      <pointLight intensity={1} />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.12}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />
      <primitive
        object={computer.scene}
        scale={isMobile ? 0.6 : 0.75}
        position={isMobile ? [0, -1, -1] : [0, -3.25, -1.5]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
};

// Computer Canvas
const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  const gyro = useDeviceOrientation();
  const [sectionRef, inCenter] = useInCenterViewport<HTMLDivElement>(0.25);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 500px)");
    setIsMobile(mediaQuery.matches);
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setIsMobile(event?.matches);
    };
    mediaQuery.addEventListener("change", handleMediaQueryChange);
    return () => mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  return (
    <div
      ref={sectionRef}
      className="absolute inset-0 w-full h-full"
    >
      <Canvas
        frameloop="always"
        shadows
        camera={
          isMobile
            ? { position: [0, 0, 8], fov: 35 }
            : { position: [20, 3, 5], fov: 25 }
        }
        gl={{ preserveDrawingBuffer: true, alpha: true }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
          {/* The model auto-rotates faster when the section is in the
              central 25% of the viewport. On mobile, if DeviceOrientation
              is granted, gyro tilt is added on top of the rotation. */}
          <Computers
            isMobile={isMobile}
            inCenter={inCenter}
            gyro={gyro?.granted ? { beta: gyro.beta, gamma: gyro.gamma } : null}
          />
        </Suspense>
        <Preload all />
      </Canvas>
    </div>
  );
};

export default ComputersCanvas;
