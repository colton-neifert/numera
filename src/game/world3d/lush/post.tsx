import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { fieldHeight } from "../field";
import { live } from "../live";
import { atmo, gfxLevel } from "./atmo";

/** Display-space finish: warm split-tone, gentle S-curve, vignette. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uWarm: { value: 1 },
    uVignette: { value: 0.32 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uWarm; uniform float uVignette;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      // Split tone: honey highlights, cool teal-violet shadows.
      vec3 hi = vec3(1.06, 1.0, 0.90);
      vec3 lo = vec3(0.94, 0.98, 1.08);
      c *= mix(vec3(1.0), mix(lo, hi, smoothstep(0.15, 0.75, l)), uWarm);
      // Saturation + soft contrast.
      c = mix(vec3(l), c, 1.12);
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
      vec2 q = vUv - 0.5;
      float v = smoothstep(0.35, 0.95, length(q * vec2(1.0, 0.82)) * 1.35);
      c *= 1.0 - v * uVignette;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
};

/**
 * Owns the frame. Several gameplay systems subscribe to useFrame with a positive priority, which turns
 * off react-three-fiber's built-in render — so something must draw, every frame, on every machine.
 */
export function LushRender() {
  const { gl, scene, camera, size, viewport } = useThree();
  const high = gfxLevel(gl) === "high";

  const pipe = useMemo(() => {
    if (!high) return null;
    const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(gl, target);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.7, 1.0);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    return { composer, bloom, grade, target };
  }, [gl, scene, camera, high]);

  useEffect(() => {
    if (!pipe) return;
    pipe.composer.setPixelRatio(viewport.dpr);
    pipe.composer.setSize(size.width, size.height);
  }, [pipe, gl, size.width, size.height, viewport.dpr]);

  useEffect(
    () => () => {
      pipe?.composer.dispose();
      pipe?.target.dispose();
    },
    [pipe],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __shot?: (type?: string, q?: number) => string; __groundAt?: (x: number, z: number) => number };
    w.__groundAt = fieldHeight;
    // QA hook: draw one frame and read it back before the browser can clear the buffer.
    w.__shot = (type = "image/jpeg", q = 0.92) => {
      if (pipe) pipe.composer.render(0);
      else gl.render(scene, camera);
      return gl.domElement.toDataURL(type, q);
    };
    return () => {
      delete w.__shot;
    };
  }, [pipe, gl, scene, camera]);

  // Frame governor: trade resolution first, then grass density, to hold a playable frame rate.
  const gov = useRef({ t: 0, n: 0, dpr: 1.5, cool: 0 });
  useFrame((state, dt) => {
    if (!high || live.shotCam || document.hidden) return;
    const g = gov.current;
    g.t += dt;
    g.n += 1;
    if (g.t < 2) return;
    const fps = g.n / g.t;
    g.t = 0;
    g.n = 0;
    if (g.cool > 0) {
      g.cool -= 1;
      return;
    }
    const maxDpr = Math.min(1.5, window.devicePixelRatio || 1);
    if (g.dpr > maxDpr) g.dpr = maxDpr;
    if (fps < 42) {
      if (g.dpr > 1) {
        g.dpr = Math.max(1, g.dpr - 0.25);
        state.setDpr(g.dpr);
      } else if (atmo.grass > 0.4) atmo.grass = Math.max(0.35, atmo.grass - 0.2);
      g.cool = 1;
    } else if (fps > 57) {
      if (atmo.grass < 1) atmo.grass = Math.min(1, atmo.grass + 0.1);
      else if (g.dpr < maxDpr) {
        g.dpr = Math.min(maxDpr, g.dpr + 0.25);
        state.setDpr(g.dpr);
        g.cool = 2;
      }
    }
  });

  useFrame((_, dt) => {
    if (!pipe) {
      gl.render(scene, camera);
      return;
    }
    const indoors = Boolean(live.house) || live.dungeon;
    pipe.bloom.strength = indoors ? 0.16 : 0.34 + atmo.dusk * 0.12;
    pipe.grade.uniforms.uWarm.value = indoors ? 0.5 : 1 - atmo.dusk * 0.6;
    pipe.composer.render(dt);
  }, 1000);

  return null;
}
