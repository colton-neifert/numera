import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();
let loader: THREE.TextureLoader | null = null;

function getLoader() {
  if (!loader) loader = new THREE.TextureLoader();
  return loader;
}

export function worldTex(path: string, rx = 1, ry = rx) {
  const k = `${path}:${rx}x${ry}`;
  const hit = cache.get(k);
  if (hit) return hit;
  if (typeof document === "undefined") return null;
  const t = getLoader().load(path);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 1;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  if (rx !== 1 || ry !== 1) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
  }
  cache.set(k, t);
  return t;
}
