import { DEG, beamTransform, targetPosition } from "@/components/three/geometry";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The optical terminal assembly used by both 3D scenes.
 *
 * Materials are matte and pastel so the 3D content reads as the same
 * claymorphism language as the 2D interface, rather than a glossy game scene.
 */
export interface TerminalAssemblyProps {
  /** Boresight orientation in degrees. */
  azimuthDeg: number;
  elevationDeg: number;
  /** Virtual target bearing in degrees, relative to the camera frame centre. */
  targetAzimuthDeg: number;
  targetElevationDeg: number;
  /** 0 → no beam, 1 → full acquisition beam. */
  beamProgress?: number;
  showBeam?: boolean;
  showTarget?: boolean;
  showFieldOfView?: boolean;
  showAxes?: boolean;
  /** When false the 3D scene renders a single static frame. */
  animate?: boolean;
}

function Beam({
  start,
  end,
  opacity,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  opacity: number;
}) {
  const transform = useMemo(() => beamTransform(start, end), [start, end]);

  return (
    <mesh position={transform.midpoint} quaternion={transform.quaternion}>
      <cylinderGeometry args={[0.022, 0.055, transform.length, 16, 1, true]} />
      <meshBasicMaterial
        color="#7fd4ee"
        transparent
        opacity={0.5 * opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function TerminalAssembly({
  azimuthDeg,
  elevationDeg,
  targetAzimuthDeg,
  targetElevationDeg,
  beamProgress = 1,
  showBeam = true,
  showTarget = true,
  showFieldOfView = true,
  showAxes = true,
  animate = true,
}: TerminalAssemblyProps) {
  const outer = useRef<THREE.Group>(null);
  const target = useRef<THREE.Group>(null);

  const boresight = useMemo(
    () => new THREE.Vector3(...targetPosition(azimuthDeg, elevationDeg)),
    [azimuthDeg, elevationDeg],
  );
  const targetPos = useMemo(
    () => new THREE.Vector3(...targetPosition(targetAzimuthDeg, targetElevationDeg)),
    [targetAzimuthDeg, targetElevationDeg],
  );

  useFrame((state) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    if (outer.current) {
      outer.current.rotation.y = Math.sin(t * 0.22) * 0.06;
    }
    if (target.current) {
      const pulse = 1 + Math.sin(t * 1.6) * 0.045;
      target.current.scale.setScalar(pulse);
    }
  });

  const aperture = [0, 0, 0.72] as const;
  const fovHalfAngle = 6 * DEG;
  const fovLength = 6.4;

  return (
    <group ref={outer}>
      {/* Coordinate axes at the mount origin */}
      {showAxes && <axesHelper args={[2.3]} />}

      {/* Mobile terminal body — a chunky, rounded chassis */}
      <RoundedBox args={[1.75, 0.62, 1.35]} radius={0.16} smoothness={4} position={[0, -0.62, 0]}>
        <meshStandardMaterial color="#b9bdf5" roughness={0.95} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[1.15, 0.22, 1.0]} radius={0.09} smoothness={4} position={[0, -0.26, 0]}>
        <meshStandardMaterial color="#9ea6ee" roughness={0.9} metalness={0.03} />
      </RoundedBox>

      {/* Status strip on the chassis */}
      <mesh position={[0, -0.3, 0.51]}>
        <planeGeometry args={[0.72, 0.1]} />
        <meshStandardMaterial color="#7fd4ee" emissive="#3fb6d8" emissiveIntensity={0.55} />
      </mesh>

      {/* Gimbal yoke */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <torusGeometry args={[0.5, 0.075, 18, 48]} />
        <meshStandardMaterial color="#e2e6fb" roughness={0.9} />
      </mesh>

      {/* Rotating head: azimuth about Y, elevation about X */}
      <group rotation={[elevationDeg * DEG, azimuthDeg * DEG, 0]}>
        <RoundedBox args={[0.86, 0.78, 0.86]} radius={0.14} smoothness={4}>
          <meshStandardMaterial color="#eef1ff" roughness={0.92} metalness={0.02} />
        </RoundedBox>

        {/* Camera module */}
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.55, 32]} />
          <meshStandardMaterial color="#cdd3f8" roughness={0.88} />
        </mesh>

        {/* Optical aperture ring and lens */}
        <mesh position={[0, 0, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.05, 16, 40]} />
          <meshStandardMaterial color="#8f97ea" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.23, 40]} />
          <meshStandardMaterial
            color="#252b52"
            roughness={0.35}
            metalness={0.15}
            emissive="#1b4a63"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* Field-of-view cone along the boresight */}
        {showFieldOfView && (
          <mesh position={[0, 0, fovLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry
              args={[Math.tan(fovHalfAngle) * fovLength, fovLength, 44, 1, true]}
            />
            <meshBasicMaterial
              color="#8fd7f0"
              transparent
              opacity={0.075}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Acquisition beam toward the estimated target bearing */}
        {showBeam && beamProgress > 0.02 && (
          <Beam
            start={new THREE.Vector3(aperture[0], aperture[1], aperture[2])}
            end={targetPos}
            opacity={beamProgress}
          />
        )}
      </group>

      {/* Virtual partner terminal / beacon */}
      {showTarget && (
        <group ref={target} position={targetPos.toArray()}>
          <mesh>
            <sphereGeometry args={[0.26, 32, 32]} />
            <meshStandardMaterial
              color="#8fe3c8"
              emissive="#39b892"
              emissiveIntensity={0.55}
              roughness={0.6}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.44, 0.016, 10, 40]} />
            <meshStandardMaterial
              color="#a9ecd6"
              emissive="#4ecfa4"
              emissiveIntensity={0.4}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.44, 0.016, 10, 40]} />
            <meshStandardMaterial
              color="#a9ecd6"
              emissive="#4ecfa4"
              emissiveIntensity={0.4}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )}

      {/* Boresight direction indicator */}
      <mesh
        position={[
          (boresight.x / boresight.length()) * 1.05,
          (boresight.y / boresight.length()) * 1.05,
          (boresight.z / boresight.length()) * 1.05,
        ]}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#7c8bff" />
      </mesh>
    </group>
  );
}

/** Soft clay-friendly lighting rig shared by both scenes. */
export function SceneLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.85 * intensity} color="#eef1ff" />
      <directionalLight position={[4, 6, 5]} intensity={1.5 * intensity} color="#ffffff" />
      <directionalLight position={[-5, 2.5, -3]} intensity={0.55 * intensity} color="#bcd4ff" />
      <pointLight position={[0, -2.4, 2.4]} intensity={0.7 * intensity} color="#c9b8ff" />
    </>
  );
}
