import { SceneLights, TerminalAssembly } from "@/components/three/TerminalAssembly";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/** Slow orbital ring that rotates continuously — lightweight. */
function OrbitalRings({ animate }: { animate: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!animate || !g.current) return;
    const t = s.clock.elapsedTime;
    g.current.rotation.y = t * 0.07;
    g.current.rotation.x = Math.sin(t * 0.12) * 0.1;
  });
  return (
    <group ref={g} rotation={[1.05, 0.2, 0.18]}>
      {[3.0, 4.2, 5.5].map((r, i) => (
        <mesh key={r} rotation={[i * 0.32, i * 0.55, 0]}>
          <torusGeometry args={[r, 0.011, 8, 96]} />
          <meshBasicMaterial
            color={i === 1 ? "#8fd7f0" : "#aab3dd"}
            transparent
            opacity={i === 1 ? 0.48 : 0.28}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Floating particles / stars that drift slowly. */
function StarField({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geom = useRef<THREE.BufferGeometry | null>(null);
  if (!geom.current) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 9 + Math.random() * 7;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.7;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.current = g;
  }
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.0006;
  });
  return (
    <points ref={ref} geometry={geom.current!}>
      <pointsMaterial size={0.06} color="#cbd5f5" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function LoginRig({ animate }: { animate: boolean }) {
  const [pose, setPose] = useState({ az: 5, el: -2, taz: -3, tel: 2.5 });
  useEffect(() => {
    if (!animate) return;
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      const p = step / 14;
      setPose({
        az: Math.sin(p * 0.45) * 7,
        el: Math.cos(p * 0.33) * 3.2,
        taz: 4.5 * Math.cos(p * 0.22) + 0.8,
        tel: -2.2 + Math.sin(p * 0.38) * 2.2,
      });
    }, 520);
    return () => window.clearInterval(id);
  }, [animate]);
  return (
    <group position={[0, -0.4, 0]}>
      <TerminalAssembly
        azimuthDeg={pose.az}
        elevationDeg={pose.el}
        targetAzimuthDeg={pose.taz}
        targetElevationDeg={pose.tel}
        beamProgress={0.82}
        errorMagnitudeDeg={Math.hypot(pose.taz - pose.az, pose.tel - pose.el)}
        animate={animate}
      />
    </group>
  );
}

export default function LoginScene({ animate = true }: { animate?: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [5.4, 3.2, 6.4], fov: 42 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true }}
        frameloop={animate ? "always" : "demand"}
        style={{ touchAction: "none" }}
      >
        <SceneLights intensity={0.95} />
        <StarField />
        <OrbitalRings animate={animate} />
        <LoginRig animate={animate} />
        <fog attach="fog" args={["#e9ecf8", 9, 21]} />
      </Canvas>
    </div>
  );
}
