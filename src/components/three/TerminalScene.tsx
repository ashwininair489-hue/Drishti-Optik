import { SceneLights, TerminalAssembly } from "@/components/three/TerminalAssembly";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";

export interface TerminalSceneProps {
  azimuthDeg: number;
  elevationDeg: number;
  targetAzimuthDeg: number;
  targetElevationDeg: number;
  /** 0 → target not in view, 1 → full acquisition beam. */
  beamProgress: number;
  className?: string;
}

/**
 * The interactive 3D view of the virtual terminal.
 *
 * Orientation is driven directly by the simulation state — the same azimuth and
 * elevation shown in the numeric readouts — so the model and the numbers can
 * never disagree.
 */
export default function TerminalScene({
  azimuthDeg,
  elevationDeg,
  targetAzimuthDeg,
  targetElevationDeg,
  beamProgress,
  className,
}: TerminalSceneProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={className}
      role="img"
      aria-label={`3D terminal model. Simulated boresight azimuth ${azimuthDeg.toFixed(
        2,
      )} degrees, elevation ${elevationDeg.toFixed(
        2,
      )} degrees, aiming at a virtual target ${targetAzimuthDeg.toFixed(
        2,
      )} by ${targetElevationDeg.toFixed(2)} degrees.`}
    >
      <Canvas
        camera={{ position: [5.2, 3.1, 6.2], fov: 40 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true }}
        frameloop={reduced ? "demand" : "always"}
        style={{ touchAction: "pan-y" }}
      >
        <SceneLights />
        <group position={[0, -0.55, 0]}>
          <TerminalAssembly
            azimuthDeg={azimuthDeg}
            elevationDeg={elevationDeg}
            targetAzimuthDeg={targetAzimuthDeg}
            targetElevationDeg={targetElevationDeg}
            beamProgress={beamProgress}
            animate={!reduced}
          />
        </group>
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={5}
          maxDistance={15}
          autoRotate={!reduced}
          autoRotateSpeed={0.45}
          maxPolarAngle={Math.PI / 1.85}
          target={[0, -0.2, 0]}
        />
      </Canvas>
    </div>
  );
}
