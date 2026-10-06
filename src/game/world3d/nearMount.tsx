import { useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { live } from "./live";

/** Mount children only when the player is nearby. Cheap-path friendly. */
export function Near({
  x,
  z,
  r,
  follow,
  children,
}: {
  x?: number;
  z?: number;
  r: number;
  follow?: boolean;
  children: ReactNode;
}) {
  const [on, setOn] = useState(() => {
    const ax = follow ? live.x : (x ?? 0);
    const az = follow ? live.z : (z ?? 0);
    return Math.hypot(live.x - ax, live.z - az) < r;
  });
  useFrame(() => {
    const ax = follow ? live.x : (x ?? 0);
    const az = follow ? live.z : (z ?? 0);
    const d = Math.hypot(live.x - ax, live.z - az);
    const v = follow ? true : d < r + (on ? 14 : 0);
    if (v !== on) setOn(v);
  });
  if (!on) return null;
  return <>{children}</>;
}
