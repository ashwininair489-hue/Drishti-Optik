import { SceneLights, TerminalAssembly } from "@/components/three/TerminalAssembly";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Landing hero visualisation: a slowly sweeping optical terminal acquiring a
 * virtual partner terminal, with orbital reference rings.
 *
 * All motion is celebratory rather than data-driven; the values shown beside it
 * are labelled as simulation output.
 */

function OrbitalRings({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!animate || !group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.09;
    group.current.rotation.x = Math.sin(t * 0.16) * 0.12;
  });

  return (
    <group ref={group} rotation={[1.15, 0, 0.22]}>
      {[3.4, 4.6, 5.8].map((radius, index) => (
        <mesh key={radius} rotation={[index * 0.35, index * 0.6, 0]}>
          <torusGeometry args={[radius, 0.012, 8, 96]} />
          <meshBasicMaterial
            color={index === 1 ? "#8fd7f0" : "#aab3dd"}
            transparent
            opacity={index === 1 ? 0.5 : 0.32}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Drives the acquisition sweep without re-rendering React every frame. */
function HeroRig({ animate }: { animate: boolean }) {
  const [pose, setPose] = useState({
    azimuth: -4.2,
    elevation: 2.6,
    targetAzimuth: 5.4,
    targetElevation: -3.1,
  });

  useEffect(() => {
    if (!animate) return;
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      const phase = step / 12;
      setPose({
        azimuth: Math.sin(phase * 0.42) * 7.5,
        elevation: Math.cos(phase * 0.31) * 3.6,
        targetAzimuth: 5.4 * Math.cos(phase * 0.24) + 1.2,
        targetElevation: -3.1 + Math.sin(phase * 0.36) * 2.4,
      });
    }, 420);
    return () => window.clearInterval(id);
  }, [animate]);

  return (
    <group position={[0, -0.55, 0]}>
      <TerminalAssembly
        azimuthDeg={pose.azimuth}
        elevationDeg={pose.elevation}
        targetAzimuthDeg={pose.targetAzimuth}
        targetElevationDeg={pose.targetElevation}
        beamProgress={0.85}
        animate={animate}
      />
    </group>
  );
}

function HeroCanvas({ animate }: { animate: boolean }) {
  return (
    <Canvas
      camera={{ position: [5.6, 3.4, 6.6], fov: 40 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: true }}
      frameloop={animate ? "always" : "demand"}
      style={{ touchAction: "pan-y" }}
    >
      <SceneLights />
      <HeroRig animate={animate} />
      <OrbitalRings animate={animate} />
      <fog attach="fog" args={["#e9ecf8", 9, 20]} />
    </Canvas>
  );
}

export default function HeroScene() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.15 }}
      className="size-full"
      role="img"
      aria-label="3D visualisation of a mobile optical terminal sweeping toward a virtual partner terminal, showing the acquisition beam and field-of-view cone. Illustrative animation — not measured hardware data."
    >
      <HeroCanvas animate={!reduced} />
    </motion.div>
  );
}
