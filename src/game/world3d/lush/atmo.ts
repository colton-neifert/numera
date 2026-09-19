import * as THREE from "three";

/** Shared atmosphere state. DayNight writes it each frame; sky, grass, water and post read it. */
export const atmo = {
  /** Unit vector pointing from the world toward the sun. */
  sunDir: new THREE.Vector3(-0.6, 0.42, 0.68).normalize(),
  sunColor: new THREE.Color("#ffc47a"),
  sunI: 1,
  horizon: new THREE.Color("#f7d49a"),
  zenith: new THREE.Color("#86a9c6"),
  cloud: new THREE.Color("#fff1d6"),
  cloudShade: new THREE.Color("#b9a08e"),
  fog: new THREE.Color("#ecd2a2"),
  /** 0 day … 1 night. */
  dusk: 0,
  time: 0,
  /** 0.35 … 1 — share of grass instances drawn; the frame governor lowers it on slow GPUs. */
  grass: 1,
};

export type Gfx = "high" | "low";

let gfxCache: Gfx | null = null;

/** High unless the GPU is a software rasteriser. `?gfx=high|low` or localStorage `numera.gfx` override. */
export function gfxLevel(gl?: THREE.WebGLRenderer): Gfx {
  if (gfxCache) return gfxCache;
  if (typeof window === "undefined") return "high";
  let forced: string | null = null;
  try {
    forced = new URLSearchParams(window.location.search).get("gfx") ?? window.localStorage.getItem("numera.gfx");
  } catch {
    forced = null;
  }
  if (forced === "high" || forced === "low") {
    gfxCache = forced;
    return forced;
  }
  if (!gl) return "high";
  let name = "";
  try {
    const ctx = gl.getContext();
    const ext = ctx.getExtension("WEBGL_debug_renderer_info");
    name = String(ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER));
  } catch {
    name = "";
  }
  gfxCache = /swiftshader|llvmpipe|software|basic render/i.test(name) ? "low" : "high";
  return gfxCache;
}
