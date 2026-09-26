import * as THREE from "three";

/**
 * Pure geometry helpers for the 3D scenes, kept out of the component files so
 * they can be reused (and unit tested) without pulling in React Three Fiber.
 */
export const DEG = Math.PI / 180;
export const TARGET_RADIUS = 7.5;

/** Position of the virtual target for a given bearing, on a fixed sphere. */
export function targetPosition(
  azimuthDeg: number,
  elevationDeg: number,
  radius = TARGET_RADIUS,
): [number, number, number] {
  const az = azimuthDeg * DEG;
  const el = elevationDeg * DEG;
  return [
    radius * Math.cos(el) * Math.sin(az),
    radius * Math.sin(el),
    radius * Math.cos(el) * Math.cos(az),
  ];
}

/** Unit vector along a y-up cylinder rotated to span two points. */
export function beamTransform(start: THREE.Vector3, end: THREE.Vector3) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return { length, midpoint, quaternion };
}

/** Signed azimuth/elevation error from boresight to target, in degrees. */
export function alignmentErrorDeg(
  boresightAz: number,
  boresightEl: number,
  targetAz: number,
  targetEl: number,
): { az: number; el: number; magnitude: number } {
  const az = targetAz - boresightAz;
  const el = targetEl - boresightEl;
  return { az, el, magnitude: Math.hypot(az, el) };
}
