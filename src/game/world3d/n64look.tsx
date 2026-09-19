import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Bright, clean grade — no 288p, no dither. */
export function N64Look() {
  const { gl, scene, camera, size } = useThree();
  const target = useMemo(
    () =>
      new THREE.WebGLRenderTarget(16, 16, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        generateMipmaps: false,
        depthBuffer: true,
        stencilBuffer: false,
      }),
    [],
  );
  const blit = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          c *= 1.08;
          float g = dot(c, vec3(0.22, 0.68, 0.10));
          c = mix(vec3(g), c, 1.06);
          c = (c - 0.5) * 1.02 + 0.5;
          c += 0.02;
          gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    const blitScene = new THREE.Scene();
    blitScene.add(mesh);
    const blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { mat, blitScene, blitCam, mesh };
  }, []);

  useEffect(() => {
    return () => {
      target.dispose();
      blit.mat.dispose();
      blit.mesh.geometry.dispose();
    };
  }, [target, blit]);

  useFrame(() => {
    const h = Math.min(size.height, 720);
    const w = Math.max(160, Math.round((h * size.width) / Math.max(1, size.height)));
    if (target.width !== w || target.height !== h) {
      target.setSize(w, h);
    }
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(prev);
    blit.mat.uniforms.tDiffuse.value = target.texture;
    gl.setRenderTarget(null);
    gl.render(blit.blitScene, blit.blitCam);
  }, 1);

  return null;
}
