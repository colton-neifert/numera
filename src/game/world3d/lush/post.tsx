import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { fieldHeight } from "../field";
import { live } from "../live";
import { atmo, gfxLevel } from "./atmo";

/**
 * Owns the frame (other systems use positive-priority useFrame, which turns off r3f's auto-render).
 * No bloom composer — it double-tonemapped the ACES output and strobed on slower machines.
 */
export function LushRender() {
  const { gl, scene, camera } = useThree();
  const high = gfxLevel(gl) === "high";

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as {
      __shot?: (type?: string, q?: number) => string;
      __groundAt?: (x: number, z: number) => number;
      __gfx?: string;
    };
    w.__groundAt = fieldHeight;
    w.__gfx = gfxLevel(gl);
    w.__shot = (type = "image/jpeg", q = 0.92) => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL(type, q);
    };
    return () => {
      delete w.__shot;
    };
  }, [gl, scene, camera]);

  const gov = useRef({ t: 0, n: 0, dpr: 1, cool: 0 });
  useFrame((state, dt) => {
    if (live.shotCam || document.hidden) return;
    const g = gov.current;
    g.t += dt;
    g.n += 1;
    if (g.t < 1.2) return;
    const fps = g.n / g.t;
    g.t = 0;
    g.n = 0;
    if (g.cool > 0) {
      g.cool -= 1;
      return;
    }
    if (fps < 28) {
      if (gl.shadowMap.enabled) {
        gl.shadowMap.enabled = false;
        g.cool = 2;
        return;
      }
      if (atmo.grass > 0.2) {
        atmo.grass = 0;
        g.cool = 1;
      }
    }
    if (!high) return;
    const maxDpr = Math.min(1.15, window.devicePixelRatio || 1);
    if (fps < 40) {
      if (g.dpr > 1) {
        g.dpr = 1;
        state.setDpr(1);
      } else if (atmo.grass > 0.28) atmo.grass = Math.max(0.28, atmo.grass - 0.22);
      g.cool = 1;
    } else if (fps > 56 && !live.house) {
      if (atmo.grass < 0.85) atmo.grass = Math.min(0.85, atmo.grass + 0.08);
      else if (g.dpr < maxDpr) {
        g.dpr = maxDpr;
        state.setDpr(g.dpr);
        g.cool = 2;
      }
    }
  });

  useFrame(() => {
    gl.render(scene, camera);
  }, 1000);

  return null;
}
