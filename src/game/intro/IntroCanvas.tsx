import { Canvas } from "@react-three/fiber";
import { AcademyScene } from "./AcademyWorld";

export function IntroCanvas() {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      camera={{ position: [18, 7.2, 46], fov: 48, near: 0.1, far: 180 }}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMappingExposure: 1.35 }}
    >
      <AcademyScene />
    </Canvas>
  );
}
