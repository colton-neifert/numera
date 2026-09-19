import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atmo } from "./atmo";

/** Painted golden-hour sky: gradient, sun bloom, and soft drifting cloud banks lit from the sun side. */
export function LushSky() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        uniforms: {
          uSunDir: { value: atmo.sunDir },
          uSunColor: { value: atmo.sunColor },
          uHorizon: { value: atmo.horizon },
          uZenith: { value: atmo.zenith },
          uCloud: { value: atmo.cloud },
          uShade: { value: atmo.cloudShade },
          uTime: { value: 0 },
          uDusk: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uHorizon; uniform vec3 uZenith;
          uniform vec3 uCloud; uniform vec3 uShade; uniform float uTime; uniform float uDusk;
          varying vec3 vDir;
          float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float noise(vec2 p){
            vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
            return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
          }
          float fbm(vec2 p){
            float v = 0.0; float a = 0.5;
            for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
            return v;
          }
          float clouds(vec2 p){
            float base = fbm(p * 0.55 + vec2(uTime * 0.006, 0.0));
            float detail = fbm(p * 1.9 - vec2(uTime * 0.011, uTime * 0.004));
            return smoothstep(0.4, 0.74, base * 0.8 + detail * 0.34);
          }
          void main() {
            vec3 d = normalize(vDir);
            float up = max(d.y, 0.0);
            vec3 sky = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.62, up), 0.7));
            // Warm wash around the sun, wide and soft.
            float sd = max(dot(d, uSunDir), 0.0);
            float day = 1.0 - uDusk;
            sky += uSunColor * (pow(sd, 6.0) * 0.38 + pow(sd, 48.0) * 0.55) * (0.35 + day * 0.65);
            sky += uSunColor * smoothstep(0.9994, 0.9998, sd) * 3.0 * day;
            // Cloud deck on a plane above; thin out toward the zenith so it reads as banks.
            if (d.y > 0.015) {
              vec2 cp = d.xz / (d.y + 0.16) * 1.35;
              float c = clouds(cp);
              vec2 toSun = normalize(uSunDir.xz + 0.0001) * 0.22;
              float lit = clamp(c - clouds(cp + toSun) + 0.55, 0.0, 1.0);
              vec3 cc = mix(uShade, uCloud, lit);
              cc += uSunColor * pow(sd, 3.0) * 0.45 * lit;
              float horizonFade = smoothstep(0.015, 0.2, d.y);
              sky = mix(sky, cc, c * horizonFade * 0.92);
            }
            // Below the horizon: haze colour so the far terrain edge never shows a seam.
            sky = mix(sky, uHorizon, smoothstep(0.0, -0.08, d.y));
            gl_FragColor = vec4(sky, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );
  useFrame(({ camera, clock }) => {
    if (mesh.current) mesh.current.position.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uDusk.value = atmo.dusk;
  });
  return (
    <mesh ref={mesh} material={mat} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[2000, 32, 20]} />
    </mesh>
  );
}
