import { DEG, beamTransform, targetPosition } from "@/components/three/geometry";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The optical terminal assembly used by both 3D scenes.
 *
 * Two FSOC terminals are rendered: the local (gimballed) terminal and a
 * compact remote terminal at the partner bearing. An optical beam spans them
 * and a dashed alignment vector shows the residual pointing error.
 *
 * Materials are matte and pastel so the 3D content reads as the same
 * claymorphism language as the 2D interface, rather than a glossy game scene.
 */
export interface TerminalAssemblyProps {
  /** Boresight orientation in degrees. */
  azimuthDeg: number;
  elevationDeg: number;
  /** Virtual partner bearing in degrees, relative to the camera frame centre. */
  targetAzimuthDeg: number;
  targetElevationDeg: number;
  /** 0 → no beam, 1 → full acquisition beam. */
  beamProgress?: number;
  showBeam?: boolean;
  showTarget?: boolean;
  showFieldOfView?: boolean;
  showAxes?: boolean;
  /** Alignment error magnitude (deg) — controls the vector arrow. 0 hides it. */
  errorMagnitudeDeg?: number;
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

function AlignmentVector({
  start,
  end,
  visible,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  visible: boolean;
}) {
  const dir = useMemo(() => new THREE.Vector3().subVectors(end, start).normalize(), [start, end]);
  const len = useMemo(() => start.distanceTo(end), [start, end]);
  const arrowLen = Math.min(1.1, Math.max(0.35, len * 0.42));
  const headLen = 0.22;
  const headWidth = 0.09;
  const shaftLen = Math.max(0, arrowLen - headLen);
  const mid = useMemo(
    () => new THREE.Vector3().copy(start).addScaledVector(dir, shaftLen / 2),
    [start, dir, shaftLen],
  );
  const headPos = useMemo(
    () => new THREE.Vector3().copy(start).addScaledVector(dir, shaftLen + headLen / 2),
    [start, dir, shaftLen, headLen],
  );
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
    [dir],
  );

  if (!visible || len < 0.01) return null;

  return (
    <group>
      <mesh position={mid} quaternion={quat}>
        <cylinderGeometry args={[0.02, 0.02, shaftLen, 12]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh position={headPos} quaternion={quat}>
        <coneGeometry args={[headWidth, headLen, 14]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  );
}

function RemoteTerminal({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position.toArray()}>
      <RoundedBox args={[0.92, 0.44, 0.78]} radius={0.11} smoothness={4} position={[0, -0.18, 0]}>
        <meshStandardMaterial color="#b9e8d5" roughness={0.92} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.16, 0.58]} radius={0.07} smoothness={4} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#8fd4ba" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.22, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.32, 24]} />
        <meshStandardMaterial color="#d6f0e6" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.22, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.028, 14, 32]} />
        <meshStandardMaterial color="#5ec49a" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.22, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 32]} />
        <meshStandardMaterial
          color="#123e2e"
          roughness={0.4}
          emissive="#1a6b4a"
          emissiveIntensity={0.45}
        />
      </mesh>
      {/* Subtle halo so the remote terminal reads at a distance. */}
      <mesh>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshBasicMaterial color="#a7f3d0" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
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
  errorMagnitudeDeg = 0,
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
  const apertureLocal: [number, number, number] = [0, 0, 0.72];
  // Aperture world position: head rotation applied.
  const apertureWorld = useMemo(() => {
    const az = azimuthDeg * DEG;
    const el = elevationDeg * DEG;
    const m = new THREE.Matrix4()
      .makeRotationY(az)
      .multiply(new THREE.Matrix4().makeRotationX(el));
    const p = new THREE.Vector3(...apertureLocal).applyMatrix4(m);
    return p;
  }, [azimuthDeg, elevationDeg]);

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

  const fovHalfAngle = 6 * DEG;
  const fovLength = 6.4;

  const showAlignmentVector = showTarget && errorMagnitudeDeg > 0.08;

  return (
    <group ref={outer}>
      {showAxes && <axesHelper args={[2.3]} />}

      {/* Local (gimballed) terminal — chunky clay chassis */}
      <RoundedBox args={[1.75, 0.62, 1.35]} radius={0.16} smoothness={4} position={[0, -0.62, 0]}>
        <meshStandardMaterial color="#b9bdf5" roughness={0.95} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[1.15, 0.22, 1.0]} radius={0.09} smoothness={4} position={[0, -0.26, 0]}>
        <meshStandardMaterial color="#9ea6ee" roughness={0.9} metalness={0.03} />
      </RoundedBox>
      <mesh position={[0, -0.3, 0.51]}>
        <planeGeometry args={[0.72, 0.1]} />
        <meshStandardMaterial color="#7fd4ee" emissive="#3fb6d8" emissiveIntensity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <torusGeometry args={[0.5, 0.075, 18, 48]} />
        <meshStandardMaterial color="#e2e6fb" roughness={0.9} />
      </mesh>

      {/* Rotating head */}
      <group rotation={[elevationDeg * DEG, azimuthDeg * DEG, 0]}>
        <RoundedBox args={[0.86, 0.78, 0.86]} radius={0.14} smoothness={4}>
          <meshStandardMaterial color="#eef1ff" roughness={0.92} metalness={0.02} />
        </RoundedBox>
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.55, 32]} />
          <meshStandardMaterial color="#cdd3f8" roughness={0.88} />
        </mesh>
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
        {showFieldOfView && (
          <mesh position={[0, 0, fovLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[Math.tan(fovHalfAngle) * fovLength, fovLength, 44, 1, true]} />
            <meshBasicMaterial
              color="#8fd7f0"
              transparent
              opacity={0.075}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
        {showBeam && beamProgress > 0.02 && (
          <Beam start={new THREE.Vector3(...apertureLocal)} end={targetPos} opacity={beamProgress} />
        )}
      </group>

      {/* Remote FSOC terminal at the partner bearing */}
      {showTarget && (
        <>
          <group ref={target} position={targetPos.toArray()}>
            <RemoteTerminal position={new THREE.Vector3(0, 0, 0)} />
            {/* Beacon sphere retained for close-up legibility */}
            <mesh position={[0, 0.9, 0]}>
              <sphereGeometry args={[0.12, 20, 20]} />
              <meshStandardMaterial color="#8fe3c8" emissive="#39b892" emissiveIntensity={0.6} />
            </mesh>
          </group>
          {/* Subtle ground link cue between terminals */}
          <mesh position={[(targetPos.x * 0.5), -0.61, targetPos.z * 0.5]} rotation={[0, Math.atan2(targetPos.x, targetPos.z), 0]}>
            <planeGeometry args={[Math.hypot(targetPos.x, targetPos.z), 0.02]} />
            <meshBasicMaterial color="#cbd5f5" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </>
      )}

      {/* Alignment vector — boresight aperture → partner (residual error). */}
      <AlignmentVector start={apertureWorld} end={targetPos} visible={showAlignmentVector} />

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
