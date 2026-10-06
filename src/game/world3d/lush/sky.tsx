import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { atmo, gfxLevel } from "./atmo";

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_HEAD = /* glsl */ `
  uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uHorizon; uniform vec3 uZenith;
  uniform vec3 uCloud; uniform vec3 uShade; uniform float uTime; uniform float uDusk;
  uniform vec2 uRes; uniform mat4 uInvProj; uniform mat4 uInvView;
  varying vec3 vDir;
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec3 skyDir() {
    vec2 ndc = gl_FragCoord.xy / max(uRes, vec2(1.0)) * 2.0 - 1.0;
    vec4 view = uInvProj * vec4(ndc, 1.0, 1.0);
    vec3 dirV = view.xyz / max(abs(view.w), 0.0001);
    vec3 world = (uInvView * vec4(dirV, 0.0)).xyz;
    float len2 = dot(world, world);
    if (len2 < 1e-5) return normalize(vDir);
    return normalize(world);
  }
`;

const FRAG_NIGHT = /* glsl */ `
  if (uDusk > 0.35 && d.y > 0.22) {
    float night = smoothstep(0.35, 0.82, uDusk);
    vec2 sp = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * vec2(36.0, 22.0);
    float h = hash(floor(sp));
    float tw = 0.55 + 0.45 * hash(vec2(h, floor(uTime * 2.2 + h * 9.0)));
    float star = smoothstep(0.994, 0.9992, h) * tw * night * smoothstep(0.22, 0.4, d.y);
    sky += vec3(0.9, 0.94, 1.0) * star * 0.7;
    vec3 moonDir = normalize(vec3(0.42, 0.72, -0.48));
    float md = max(dot(d, moonDir), 0.0);
    float disc = smoothstep(0.9986, 0.9995, md);
    float halo = pow(md, 64.0) * 0.12;
    sky += vec3(0.96, 0.97, 0.9) * disc * night;
    sky += vec3(0.42, 0.5, 0.72) * halo * night;
  }
`;

const FRAG_LOW = /* glsl */ `
  ${FRAG_HEAD}
  void main() {
    vec3 d = skyDir();
    float up = max(d.y, 0.0);
    vec3 sky = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.62, up), 0.7));
    float sd = max(dot(d, uSunDir), 0.0);
    float day = 1.0 - uDusk;
    sky += uSunColor * (pow(sd, 6.0) * 0.38 + pow(sd, 48.0) * 0.55) * (0.35 + day * 0.65);
    sky += uSunColor * smoothstep(0.9994, 0.9998, sd) * 3.0 * day;
    sky = mix(sky, uHorizon, smoothstep(0.0, -0.08, d.y));
    ${FRAG_NIGHT}
    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const FRAG_HIGH = /* glsl */ `
  ${FRAG_HEAD}
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
    vec3 d = skyDir();
    float up = max(d.y, 0.0);
    vec3 sky = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.62, up), 0.7));
    float sd = max(dot(d, uSunDir), 0.0);
    float day = 1.0 - uDusk;
    sky += uSunColor * (pow(sd, 6.0) * 0.38 + pow(sd, 48.0) * 0.55) * (0.35 + day * 0.65);
    sky += uSunColor * smoothstep(0.9994, 0.9998, sd) * 3.0 * day;
    if (d.y > 0.015) {
      vec2 cp = d.xz / (d.y + 0.16) * 1.35;
      float c = clouds(cp);
      vec2 toSun = normalize(uSunDir.xz + 0.0001) * 0.22;
      float lit = clamp(c - clouds(cp + toSun) + 0.55, 0.0, 1.0);
      vec3 cc = mix(uShade, uCloud, lit);
      cc += uSunColor * pow(sd, 3.0) * 0.45 * lit;
      float horizonFade = smoothstep(0.015, 0.2, d.y);
      float nightCut = 1.0 - smoothstep(0.2, 0.55, uDusk);
      sky = mix(sky, cc, c * horizonFade * 0.9 * nightCut);
    }
    sky = mix(sky, uHorizon, smoothstep(0.0, -0.08, d.y));
    ${FRAG_NIGHT}
    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Painted golden-hour sky. Low gfx skips the fbm cloud deck so SwiftShader can keep a playable frame. */
export function LushSky() {
  const mesh = useRef<THREE.Mesh>(null);
  const { gl, camera, size } = useThree();
  const high = gfxLevel(gl) === "high";
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
          uRes: { value: new THREE.Vector2(1, 1) },
          uInvProj: { value: new THREE.Matrix4() },
          uInvView: { value: new THREE.Matrix4() },
        },
        vertexShader: VERT,
        fragmentShader: high ? FRAG_HIGH : FRAG_LOW,
      }),
    [high],
  );
  useFrame(({ camera, clock }) => {
    if (mesh.current) mesh.current.position.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uDusk.value = atmo.dusk;
    mat.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
    mat.uniforms.uInvView.value.copy(camera.matrixWorld);
    const pr = gl.getPixelRatio();
    mat.uniforms.uRes.value.set(Math.max(1, size.width * pr), Math.max(1, size.height * pr));
  });
  return (
    <mesh ref={mesh} material={mat} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={high ? [2000, 48, 32] : [2000, 36, 24]} />
    </mesh>
  );
}
