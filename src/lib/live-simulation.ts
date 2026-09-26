import type { SimulationContext } from "@/shared/knowledge";
import { useEffect, useState } from "react";

/**
 * Publishes the live simulation snapshot so the assistant can answer "what is
 * happening right now". A tiny module store is enough — this is one producer,
 * one consumer, and it avoids threading props through the whole console.
 */
let current: SimulationContext | null = null;
const listeners = new Set<(value: SimulationContext | null) => void>();

export function setLiveSimulation(context: SimulationContext | null) {
  current = context;
  listeners.forEach((listener) => listener(context));
}

export function getLiveSimulation() {
  return current;
}

export function useLiveSimulation() {
  const [value, setValue] = useState<SimulationContext | null>(current);
  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}
