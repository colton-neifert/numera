// @ts-nocheck
import { useRef, useState, type ReactNode } from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
const CanvasTexture = THREE.CanvasTexture;
const RepeatWrapping = THREE.RepeatWrapping;
const NearestFilter = THREE.NearestFilter;
const SRGBColorSpace = THREE.SRGBColorSpace;
import { N64Person, type HumanLook, Humanoid, Flame } from "./actors";
import { N64Foe } from "./n64";
import { heightAt, vWorld, KEEP_Z, JAIL_Z, VX, VZ, TREE_HOME, TREE_TRUNK, TREE_HOUSE_H, TREE_HW, TREE_HD, TREE_DOOR, TREE_DECK_D } from "./field";
import { live, gameClock, afterMeal } from "./live";
import { GEM_META, type GemId, playerMaxHp } from "../content";
import { useGame } from "../store";
import { sfx } from "../audio";
import { revealItem } from "../items";
import { hasMailWaiting } from "../mail";
import { NPCS } from "../dialogue";
import { TreeHouse } from "./treeHouse";
import { worldTex } from "./tex";

export const HOUSES = [
	{
		id: "home",
		world: "meadow",
		...vWorld(-24, -66),
		name: "Pip’s house",
		kind: "home"
	},
	{
		id: "yours",
		world: "meadow",
		...TREE_HOME,
		name: "Your treehouse",
		kind: "tree",
		w: TREE_HW * 2 + 0.4,
		d: TREE_HD * 2 + 0.4
	},
	{
		id: "ash",
		world: "meadow",
		...vWorld(16, -52),
		name: "Ash’s hall",
		kind: "dojo",
		w: 16.4,
		d: 14.6
	},
	{
		id: "cabin",
		world: "meadow",
		...vWorld(24, -66),
		name: "Nana’s house",
		kind: "cabin"
	},
	{
		id: "shop",
		world: "meadow",
		...vWorld(18, -42),
		name: "Oakstead stall",
		kind: "shop",
		w: 14.8,
		d: 13.2
	},
	{
		id: "oak0",
		world: "meadow",
		...vWorld(-14, -74),
		name: "Wren’s house",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak1",
		world: "meadow",
		...vWorld(-4, -64),
		name: "Cole’s house",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak2",
		world: "meadow",
		...vWorld(14, -74),
		name: "Tess’s house",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak3",
		world: "meadow",
		...vWorld(-24, -88),
		name: "Brin’s house",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak4",
		world: "meadow",
		...vWorld(8, -96),
		name: "Oat’s house",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak5",
		world: "meadow",
		...vWorld(-6, -92),
		name: "Nell’s house",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak6",
		world: "meadow",
		...vWorld(22, -90),
		name: "Reed’s house",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak7",
		world: "meadow",
		...vWorld(-36, -78),
		name: "West cottage",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "oak8",
		world: "meadow",
		...vWorld(34, -98),
		name: "East cottage",
		kind: "cottage",
		w: 9.2,
		d: 8.4
	},
	{
		id: "mill",
		world: "meadow",
		...vWorld(2, -116),
		name: "Oakstead mill",
		kind: "mill",
		w: 10.4,
		d: 9.6
	},
	{
		id: "inn",
		world: "meadow",
		...vWorld(-34, -126),
		name: "Lila’s inn",
		kind: "inn",
		w: 16.4,
		d: 14.2
	},
	{
		id: "eatery",
		world: "meadow",
		...vWorld(32, -112),
		name: "Pell’s table",
		kind: "eatery",
		w: 32,
		d: 28
	},
	{
		id: "loft",
		world: "meadow",
		...vWorld(46, -94),
		name: "The Counting Loft",
		kind: "cottage",
		w: 11.2,
		d: 10.4
	},
	{
		id: "smith",
		world: "meadow",
		x: 40,
		z: -52,
		name: "Flint’s forge",
		kind: "smith",
		w: 12.6,
		d: 11.2
	},
	{
		id: "farm",
		world: "meadow",
		x: 50,
		z: -98,
		name: "Bramble’s farm",
		kind: "farm",
		w: 10.8,
		d: 9.6
	},
	{
		id: "manor",
		world: "meadow",
		x: -48,
		z: -124,
		name: "The shuttered house",
		kind: "cottage",
		locked: true,
		lockSay: "Boards on the door. Someone still lives in there.",
		w: 12.8,
		d: 11.4
	},
	{
		id: "keep-hall",
		world: "meadow",
		x: 0,
		z: KEEP_Z,
		name: "The Castle",
		kind: "keep",
		w: 22.4,
		d: 16.8
	},
	{
		id: "jail",
		world: "meadow",
		x: 0,
		z: JAIL_Z,
		name: "Lizard Jail",
		kind: "keep",
		w: 18,
		d: 16
	},
	{
		id: "sum-shrine",
		world: "meadow",
		x: -82,
		z: 12,
		name: "Sun Shrine",
		kind: "shrine",
		w: 22.4,
		d: 42
	}
];
export const KEEP_ALTAR: { id: GemId; x: number; z: number }[] = [
	{
		id: "emerald",
		x: -1.55,
		z: -28.85
	},
	{
		id: "ruby",
		x: 0,
		z: -29.15
	},
	{
		id: "sapphire",
		x: 1.55,
		z: -28.85
	}
];
export const KEEP_INNER = {
	x: 0,
	z: -30.35
};
export const CAVE_MOUTH = {
	x: 22.6,
	z: 9.4
};
export const HOUSE_W = 10.8;
export const HOUSE_D = 9.6;
var BRICK_MAP = null;
var PLANK_MAP = null;
var KEEP_BRICK = null;
var CONCRETE_MAP = null;
function brickMap() {
	if (BRICK_MAP) return BRICK_MAP;
	const c = document.createElement("canvas");
	c.width = 64;
	c.height = 64;
	const g = c.getContext("2d");
	g.fillStyle = "#5c3a2e";
	g.fillRect(0, 0, 64, 64);
	const cols = [
		"#b85a44",
		"#c4684c",
		"#a84c38",
		"#bc6048",
		"#c07058"
	];
	const bw = 14;
	const bh = 6;
	let i = 0;
	for (let y = 0; y < 64; y += 8) {
		const shift = y / 8 % 2 * (bw * .5);
		for (let x = -14; x < 64; x += 16) {
			g.fillStyle = cols[i++ % cols.length];
			g.fillRect(x + shift, y, bw, bh);
		}
	}
	const t = new CanvasTexture(c);
	t.wrapS = RepeatWrapping;
	t.wrapT = RepeatWrapping;
	t.repeat.set(3.2, 2.4);
	t.magFilter = NearestFilter;
	t.minFilter = NearestFilter;
	t.colorSpace = SRGBColorSpace;
	BRICK_MAP = t;
	return t;
}
export function brickTex() {
	return brickMap();
}
export function woodPlanks() {
	return plankMap();
}
function keepBrickMap() {
	if (KEEP_BRICK) return KEEP_BRICK;
	const t = brickMap().clone();
	t.repeat.set(8.4, 5.2);
	t.needsUpdate = true;
	KEEP_BRICK = t;
	return t;
}
function concreteMap() {
	if (CONCRETE_MAP) return CONCRETE_MAP;
	const c = document.createElement("canvas");
	c.width = 64;
	c.height = 64;
	const g = c.getContext("2d");
	g.fillStyle = "#8a8680";
	g.fillRect(0, 0, 64, 64);
	g.strokeStyle = "#74706a";
	g.lineWidth = 1;
	for (let i = 0; i <= 64; i += 16) {
		g.beginPath();
		g.moveTo(i, 0);
		g.lineTo(i, 64);
		g.stroke();
		g.beginPath();
		g.moveTo(0, i);
		g.lineTo(64, i);
		g.stroke();
	}
	g.fillStyle = "rgba(40,38,36,0.14)";
	for (let i = 0; i < 20; i++) g.fillRect(i * 13 % 64, i * 17 % 64, 3, 2);
	const t = new CanvasTexture(c);
	t.wrapS = RepeatWrapping;
	t.wrapT = RepeatWrapping;
	t.repeat.set(8, 7);
	t.magFilter = NearestFilter;
	t.minFilter = NearestFilter;
	t.colorSpace = SRGBColorSpace;
	CONCRETE_MAP = t;
	return t;
}
function plankMap() {
	if (PLANK_MAP) return PLANK_MAP;
	const c = document.createElement("canvas");
	c.width = 128;
	c.height = 128;
	const g = c.getContext("2d");
	g.fillStyle = "#3a2414";
	g.fillRect(0, 0, 128, 128);
	const cols = [
		"#8a5a32",
		"#7a4a28",
		"#9a6840",
		"#6a4224",
		"#855830",
		"#7a5530"
	];
	const ph = 16;
	let i = 0;
	for (let y = 0; y < 128; y += ph) {
		g.fillStyle = cols[i++ % cols.length];
		g.fillRect(0, y + 1, 128, 14);
		g.fillStyle = "#2a1810";
		g.fillRect(0, y, 128, 1);
		g.fillStyle = "rgba(40,22,10,0.22)";
		for (let x = 6 + i % 3 * 4; x < 128; x += 18) g.fillRect(x, y + 3, 1, 10);
		g.fillStyle = "rgba(180,130,70,0.12)";
		g.fillRect(10 + i % 5 * 18, y + 4, 22, 2);
	}
	const t = new CanvasTexture(c);
	t.wrapS = RepeatWrapping;
	t.wrapT = RepeatWrapping;
	t.repeat.set(7, 7);
	t.magFilter = NearestFilter;
	t.minFilter = NearestFilter;
	t.colorSpace = SRGBColorSpace;
	PLANK_MAP = t;
	return t;
}
var LOG_TONE = [
	"#6a4628",
	"#573820",
	"#7a5230",
	"#624028",
	"#6e4a26"
];
function WallLogs({ w, h = 3.4, axis }) {
	const n = 8;
	const r = h / 16;
	return _jsx("group", { children: Array.from({ length: n }, (_, i) => _jsxs("mesh", {
		position: [
			0,
			r + i * 2 * r,
			0
		],
		rotation: axis === "x" ? [
			0,
			0,
			Math.PI / 2
		] : [
			Math.PI / 2,
			0,
			0
		],
		castShadow: true,
		receiveShadow: true,
		children: [_jsx("cylinderGeometry", { args: [
			r * .96,
			r * .9,
			w,
			8
		] }), _jsx("meshStandardMaterial", { color: LOG_TONE[i % LOG_TONE.length] })]
	}, i)) });
}
export function houseSize(h) {
	return {
		w: h.w ?? 10.8,
		d: h.d ?? 9.6
	};
}
export function interiorHalf(h) {
	const kind = h.kind ?? "home";
	const { w, d } = houseSize(h);
	if (h.id === "yours") return { hx: TREE_HW - 0.22, hz: TREE_HD - 0.22 };
	if (h.id === "jail") return { hx: 5.2, hz: 4.8 };
	if (kind === "keep") return {
		hx: 6.55,
		hz: 5.65
	};
	if (kind === "shrine") return {
		hx: 8.05,
		hz: 17.15
	};
	if (kind === "eatery") return {
		hx: 15.6,
		hz: 14.4
	};
	if (kind === "mill") {
		const r = Math.min(3.25, Math.max(2.4, w * .32));
		return {
			hx: r,
			hz: r
		};
	}
	if (kind === "inn" || kind === "shop" || kind === "dojo") return {
		hx: Math.max(7.7, w * .42),
		hz: Math.max(7.15, d * .44)
	};
	return {
		hx: Math.max(5.15, w * .42),
		hz: Math.max(4.85, d * .44)
	};
}
export const EATERY_TABLES = [
	{
		id: 0,
		kind: "two",
		x: -10.4,
		z: 3.2,
		w: 1.7
	},
	{
		id: 1,
		kind: "four",
		x: 10.4,
		z: 3.2,
		w: 3.35
	},
	{
		id: 2,
		kind: "four",
		x: -10.4,
		z: -3.6,
		w: 3.35
	},
	{
		id: 3,
		kind: "six",
		x: 0,
		z: -9.2,
		w: 5.7
	},
	{
		id: 4,
		kind: "two",
		x: 10.4,
		z: -3.6,
		w: 1.7
	}
];
export const EATERY_KITCHEN = {
	x: 14.8,
	z: -1.6
};
export const EATERY_PELL = {
	x: 2.55,
	z: 12.2
};
export function pickTableIndex(party, all = false) {
	if (all || party >= 5) return 3;
	if (party >= 3) return 1;
	return 0;
}
export function seatsForTable(hut, t) {
	const n = t.kind === "two" ? 1 : t.kind === "four" ? 2 : 3;
	const span = t.kind === "two" ? .55 : t.kind === "four" ? 1.05 : 1.7;
	const seats = [];
	for (let i = 0; i < n; i++) {
		const ox = n === 1 ? 0 : -span + i * 2 * span / Math.max(1, n - 1);
		seats.push({
			x: hut.x + t.x + ox,
			z: hut.z + t.z + .92,
			yaw: 0
		});
	}
	for (let i = 0; i < n; i++) {
		const ox = n === 1 ? 0 : -span + i * 2 * span / Math.max(1, n - 1);
		seats.push({
			x: hut.x + t.x + ox,
			z: hut.z + t.z - .92,
			yaw: Math.PI
		});
	}
	return seats;
}
export function homeMailSpot() {
	const h = HOUSES.find((x) => x.id === "yours");
	if (!h) return { x: 0, z: 0 };
	return {
		x: TREE_TRUNK.x + 2.4,
		z: TREE_TRUNK.z + 2.8
	};
}
export function homeWoodSpot() {
	const h = HOUSES.find((x) => x.id === "yours");
	if (!h) return {
		x: 0,
		z: 0
	};
	const { d } = houseSize(h);
	return {
		x: h.x - 2.55,
		z: h.z + d * .5 + .72
	};
}
export function LogStack({ n, scale = 1 }) {
	const logs = Math.min(12, Math.max(0, Math.floor(n)));
	if (logs <= 0) return null;
	return _jsx("group", { children: Array.from({ length: logs }).map((_, i) => {
		const row = Math.floor(i / 3);
		const col = i % 3;
		return _jsxs("mesh", {
			position: [
				(col - 1) * .2 * scale,
				.08 + row * .14 * scale,
				row % 2 * .06
			],
			rotation: [
				.05,
				col * .18 + row * .4,
				Math.PI / 2
			],
			castShadow: true,
			children: [_jsx("cylinderGeometry", { args: [
				.07 * scale,
				.08 * scale,
				.62 * scale,
				6
			] }), _jsx("meshStandardMaterial", { color: i % 2 ? "#5a3d24" : "#6a4a28" })]
		}, i);
	}) });
}
export function pushAabb(nx, nz, cx, cz, hw, hd, rad = .5) {
	const dx = nx - cx;
	const dz = nz - cz;
	const hx = hw + rad;
	const hz = hd + rad;
	if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
	if (hx - Math.abs(dx) < hz - Math.abs(dz)) return {
		x: cx + Math.sign(dx || 1) * hx,
		z: nz
	};
	return {
		x: nx,
		z: cz + Math.sign(dz || 1) * hz
	};
}
export function collideHouses(nx, nz, worldId, forNpc = false) {
	if (!forNpc && (live.house || live.doorUse)) return null;
	let x = nx;
	let z = nz;
	let hitAny = false;
	for (const h of HOUSES) {
		if (h.world !== worldId) continue;
		if (h.kind === "keep") continue;
		const gy = heightAt(h.x, h.z);
		if (!forNpc && live.y > gy + roofLift(h) - 0.5) continue;
		if (h.id === "yours" && live.y < gy + TREE_HOUSE_H - 1.15) continue;
		if (h.id === "yours" && live.y > gy + TREE_HOUSE_H - 1.15) {
			const door = Math.abs(x - h.x) < TREE_DOOR && z > h.z + TREE_HD - 0.85 && z < h.z + TREE_HD + 0.55;
			if (!door) {
				const hit = pushAabb(x, z, h.x, h.z, TREE_HW + 0.16, TREE_HD + 0.16, forNpc ? 0.28 : 0.16);
				if (hit) {
					x = hit.x;
					z = hit.z;
					hitAny = true;
				}
			}
			const deckZ = h.z + TREE_HD + TREE_DECK_D * 0.5;
			const hw = TREE_HW + 0.38;
			const rails = [
				[h.x - hw, deckZ, 0.12, TREE_DECK_D * 0.5],
				[h.x + hw, deckZ, 0.12, TREE_DECK_D * 0.5],
				[h.x - (hw + TREE_DOOR) * 0.5, h.z + TREE_HD + TREE_DECK_D, (hw - TREE_DOOR) * 0.5, 0.12],
				[h.x + (hw + TREE_DOOR) * 0.5, h.z + TREE_HD + TREE_DECK_D, (hw - TREE_DOOR) * 0.5, 0.12],
			];
			for (const [cx, cz, hwR, hd] of rails) {
				const rh = pushAabb(x, z, cx, cz, hwR, hd, 0.14);
				if (rh) {
					x = rh.x;
					z = rh.z;
					hitAny = true;
				}
			}
			continue;
		}
		if (h.kind === "mill") {
			const hx = forNpc ? 3.3 : 2.4;
			const hz = forNpc ? 3.0 : 2.2;
			const millHit = pushAabb(x, z, h.x, h.z, hx, hz, forNpc ? 0.28 : 0.18);
			if (millHit) {
				x = millHit.x;
				z = millHit.z;
				hitAny = true;
			}
			continue;
		}
		const { w, d } = houseSize(h);
		const eatery = h.kind === "eatery";
		const pad = forNpc ? 0.52 : 0.44;
		const hit = pushAabb(x, z, h.x, h.z, eatery ? (forNpc ? 6.4 : 4.4) : w * pad, eatery ? (forNpc ? 5.4 : 3.6) : d * pad, forNpc ? 0.28 : 0.16);
		if (hit) {
			x = hit.x;
			z = hit.z;
			hitAny = true;
		}
	}
	const box = homeMailSpot();
	const mdx = x - box.x;
	const mdz = z - box.z;
	const md2 = mdx * mdx + mdz * mdz;
	if (md2 < .1024) {
		const d = Math.sqrt(md2) || .001;
		x = box.x + mdx / d * .32;
		z = box.z + mdz / d * .32;
		hitAny = true;
	}
	if (!hitAny) return null;
	return {
		x,
		z
	};
}

function roofLift(h) {
	if (h.kind === "mill") return 4.2;
	if (h.kind === "cottage") return 2.85;
	if (h.kind === "cabin") return 3.05;
	if (h.kind === "shop" || h.kind === "dojo" || h.kind === "inn" || h.kind === "smith") return 3.45;
	if (h.kind === "farm") return 2.9;
	if (h.kind === "home") return 3.2;
	if (h.kind === "tree") return TREE_HOUSE_H + 2.4;
	if (h.kind === "keep") return h.id === "jail" ? 5.1 : 6.5;
	return 3.1;
}

/** Standable roof height at x,z, or 0 if not over a roof. */
export function roofAt(x, z, worldId) {
	let best = 0;
	for (const h of HOUSES) {
		if (h.world !== worldId) continue;
		if (h.kind === "shrine" || h.kind === "eatery") continue;
		const gy = heightAt(h.x, h.z);
		const lift = roofLift(h);
		if (h.kind === "mill") {
			if (Math.hypot(x - h.x, z - h.z) < 2.8) best = Math.max(best, gy + lift);
			continue;
		}
		if (h.kind === "tree") {
			const onHouse = Math.abs(x - h.x) < TREE_HW + 0.2 && Math.abs(z - h.z) < TREE_HD + 0.2;
			const onDeck =
				Math.abs(x - h.x) < TREE_HW + 0.55 &&
				z > h.z + TREE_HD - 0.35 &&
				z < h.z + TREE_HD + TREE_DECK_D + 0.05;
			if (onHouse || onDeck) best = Math.max(best, gy + TREE_HOUSE_H);
			continue;
		}
		const { w, d } = houseSize(h);
		if (Math.abs(x - h.x) < w * 0.4 && Math.abs(z - h.z) < d * 0.4) best = Math.max(best, gy + lift);
	}
	return best;
}
export function collideInterior(nx, nz) {
	if (!live.house || live.doorUse) return null;
	const hut = HOUSES.find((h) => h.id === live.house);
	if (!hut) return null;
	const kind = hut.kind ?? "home";
	const { hx, hz } = interiorHalf(hut);
	const dx = nx - hut.x;
	const dz = nz - hut.z;
	if (kind === "mill") {
		const r = hx;
		const dist = Math.hypot(dx, dz) || .001;
		if (dist > r) return {
			x: hut.x + dx / dist * r,
			z: hut.z + dz / dist * r
		};
		return null;
	}
	let x = nx;
	let z = nz;
	const southDoor = hut.id === "yours" && Math.abs(dx) < TREE_DOOR && dz > 0;
	if (dx > hx) x = hut.x + hx;
	if (dx < -hx) x = hut.x - hx;
	if (dz < -hz) z = hut.z - hz;
	if (dz > hz && !southDoor) z = hut.z + hz;
	if (x === nx && z === nz) return null;
	return {
		x,
		z
	};
}
export function collideFurniture(nx, nz) {
	if (!live.house || live.doorUse || live.bed) return null;
	const hut = HOUSES.find((h) => h.id === live.house);
	if (!hut) return null;
	let x = nx;
	let z = nz;
	const bump = (hit) => {
		if (!hit) return;
		x = hit.x;
		z = hit.z;
	};
	const kind = hut.kind ?? "home";
	if (kind === "keep" || kind === "shrine") {
		if (kind === "shrine") bump(pushAabb(x, z, hut.x - 5.8, hut.z - 14.8, .55, .55, .38));
		if (hut.id === "jail") {
			bump(pushAabb(x, z, hut.x + live.jail.cx, hut.z + live.jail.cz, .46, .46, .42));
			bump(pushAabb(x, z, hut.x + 3.05, hut.z - 2.55, .55, .42, .4));
			if (!live.jail.doorOpen) bump(pushAabb(x, z, hut.x, hut.z + 4.55, 1.35, .18, .4));
		}
		if (x === nx && z === nz) return null;
		return { x, z };
	}
	if (kind !== "shop" && kind !== "mill" && kind !== "inn" && kind !== "eatery" && hut.id !== "yours") {
		bump(pushAabb(x, z, hut.x - 3.35, hut.z - 3.98, 1.82, 1.14, .42));
		bump(pushAabb(x, z, hut.x + 2.35, hut.z + 1.15, .95, .58, .4));
		bump(pushAabb(x, z, hut.x + 3.6, hut.z - 3.4, .42, .28, .38));
	}
	if (hut.id === "yours") {
		bump(pushAabb(x, z, hut.x - 2.2, hut.z - 3.35, 1.2, 0.68, .32));
		bump(pushAabb(x, z, hut.x - 4.15, hut.z + 0.15, 0.52, 1.12, .28));
		bump(pushAabb(x, z, hut.x + 3.55, hut.z - 2.85, 0.74, 0.52, .28));
	}
	if (kind === "shop") bump(pushAabb(x, z, hut.x, hut.z - 2.4, 3.5, .7, .42));
	if (kind === "mill") bump(pushAabb(x, z, hut.x, hut.z, .55, .55, .4));
	if (kind === "inn") {
		if (live.innInRoom) bump(pushAabb(x, z, hut.x - 1.25, hut.z - .7, 1.25, .8, .4));
		else if (live.innFloor === 0) {
			bump(pushAabb(x, z, hut.x - .6, hut.z - 3.5, 2.1, .55, .42));
			bump(pushAabb(x, z, hut.x + 3.05, hut.z + 0.95, .1, 1.05, .4));
			bump(pushAabb(x, z, hut.x + 4.65, hut.z + 0.95, .1, 1.05, .4));
		} else if (live.innFloor === 1) bump(pushAabb(x, z, hut.x + 4.55, hut.z - 1.2, .12, 1.2, .4));
		else bump(pushAabb(x, z, hut.x, hut.z - 7.15, 5.4, .18, .4));
	}
	if (kind === "eatery") {
		for (const t of EATERY_TABLES) bump(pushAabb(x, z, hut.x + t.x, hut.z + t.z, t.w * .5, .62, .42));
		bump(pushAabb(x, z, hut.x + EATERY_KITCHEN.x, hut.z + EATERY_KITCHEN.z, .55, .9, .45));
	}
	if (!live.sit) for (const c of chairSpots(hut)) bump(pushAabb(x, z, c.x, c.z, .26, .26, .38));
	if (x === nx && z === nz) return null;
	return {
		x,
		z
	};
}
export function innStairAlong(hut, ox, oz, yaw, x, z, len = 1.7) {
	const dx = x - (hut.x + ox);
	const dz = z - (hut.z + oz);
	const ux = -Math.sin(yaw);
	const uz = -Math.cos(yaw);
	const s = dx * ux + dz * uz;
	const lat = dx * uz - dz * ux;
	if (Math.abs(lat) > 0.85) return -1;
	if (s < -0.2 || s > len + 0.15) return -1;
	return Math.max(0, Math.min(1, s / len));
}

export function innStairLift(hut, x, z) {
	if (!hut || hut.kind !== "inn" || live.innInRoom) return 0;
	if (live.innFloor === 0) {
		const u = innStairAlong(hut, 3.85, 1.7, 0, x, z);
		if (u >= 0) return 0.08 + u * 1.12;
	} else if (live.innFloor === 1) {
		const up = innStairAlong(hut, 2.55, -1.45, Math.PI / 2, x, z);
		if (up >= 0) return 0.08 + up * 1.12;
		const down = innStairAlong(hut, 3.85, 0.15, Math.PI, x, z, 1.4);
		if (down >= 0) return 1.12 - down * 1.12;
	} else if (live.innFloor === 2) {
		const d = innStairAlong(hut, 3.7, -5.85, -Math.PI / 2, x, z);
		if (d >= 0) return 1.12 - d * 1.12;
	}
	return 0;
}

export function innStairArrive(hut, x, z) {
	if (!hut || hut.kind !== "inn" || live.innInRoom) return null;
	if (live.innFloor === 0) {
		const u = innStairAlong(hut, 3.85, 1.7, 0, x, z);
		if (u > 0.9) return { floor: 1, x: hut.x + 3.7, z: hut.z - 1.2, yaw: Math.PI / 2 };
	} else if (live.innFloor === 1) {
		const up = innStairAlong(hut, 2.55, -1.45, Math.PI / 2, x, z);
		if (up > 0.9) return { floor: 2, x: hut.x + 2.8, z: hut.z - 5.55, yaw: Math.PI };
		const down = innStairAlong(hut, 3.85, 0.15, Math.PI, x, z, 1.4);
		if (down > 0.88) return { floor: 0, x: hut.x + 3.85, z: hut.z + 2.15, yaw: Math.PI };
	} else if (live.innFloor === 2) {
		const d = innStairAlong(hut, 3.7, -5.85, -Math.PI / 2, x, z);
		if (d > 0.88) return { floor: 1, x: hut.x + 3.7, z: hut.z - 1.2, yaw: -Math.PI / 2 };
	}
	return null;
}

export function collideSheep(nx, nz) {
	if (live.house || live.doorUse) return null;
	let x = nx;
	let z = nz;
	let hit = false;
	for (const s of Object.values(live.sheep)) {
		const dx = x - s.x;
		const dz = z - s.z;
		const d2 = dx * dx + dz * dz;
		const r = s.r;
		if (d2 < r * r && d2 > 1e-5) {
			const d = Math.sqrt(d2);
			x = s.x + dx / d * r;
			z = s.z + dz / d * r;
			hit = true;
		}
	}
	return hit ? { x, z } : null;
}
export function collidePeople(nx, nz) {
	if (live.bed || live.sit || live.doorUse) return null;
	let x = nx;
	let z = nz;
	for (const [id, p] of Object.entries(live.npcPos)) {
		if (id.startsWith("sign") || id.startsWith("gossip") || id.includes("note") || id === "well" || id === "rook") continue;
		const dx = x - p.x;
		const dz = z - p.z;
		const rad = id === "rook" && live.rookFight ? 2.15 : .68;
		const d2 = dx * dx + dz * dz;
		if (d2 < rad * rad && d2 > 1e-4) {
			const d = Math.sqrt(d2);
			x = p.x + dx / d * rad;
			z = p.z + dz / d * rad;
		}
	}
	if (x === nx && z === nz) return null;
	return {
		x,
		z
	};
}
export function Houses({ worldId }) {
	const [inside, setInside] = useState(false);
	useFrame(() => {
		const hide = Boolean(live.house) && live.house !== "yours" && !live.doorUse;
		if (hide !== inside) setInside(hide);
	});
	if (inside) return null;
	return _jsxs("group", { children: [
		HOUSES.filter((h) => h.world === worldId && h.kind !== "mill" && h.kind !== "keep" && h.kind !== "shrine" && h.id !== "yours").map((h) => _jsx(Hut, {
			id: h.id,
			x: h.x,
			z: h.z,
			warm: h.kind === "home" || h.kind === "shop" || h.kind === "smith" || h.id === "oak0" || h.id === "oak4",
			chimney: h.kind === "home" || h.kind === "cabin" || h.kind === "inn" || h.kind === "eatery" || h.kind === "smith" || h.id === "oak0" || h.id === "oak2" || h.id === "oak4" || h.id === "oak5" || h.id === "manor",
			brick: h.id === "oak1" || h.id === "oak6" || h.kind === "inn" || h.kind === "smith" || h.id === "yours" || h.id === "ash" || h.id === "manor",
			logs: h.kind === "cabin" || h.kind === "farm" || h.id === "oak3" || h.id === "oak5" || h.id === "oak7",
			w: houseSize(h).w,
			d: houseSize(h).d
		}, h.id)),
		HOUSES.filter((h) => h.world === worldId && h.kind === "shrine").map((h) => _jsx(SumShrine, { hut: h }, h.id)),
		worldId === "meadow" ? _jsx(TreeHouse, {}) : null,
		worldId === "meadow" ? _jsx(CavernMouth, {}) : null,
		worldId === "meadow" ? _jsx(HomeMailbox, {}) : null
	] });
}
var SHOP_SIGN = null;
function shopSignMap() {
	if (SHOP_SIGN) return SHOP_SIGN;
	const c = document.createElement("canvas");
	c.width = 1024;
	c.height = 320;
	const g = c.getContext("2d");
	g.fillStyle = "#5a3214";
	g.fillRect(0, 0, 1024, 320);
	g.fillStyle = "#7a4a20";
	for (let i = 0; i < 18; i++) g.fillRect(0, i * 18, 1024, 8);
	g.strokeStyle = "#c9a227";
	g.lineWidth = 14;
	g.strokeRect(18, 18, 988, 284);
	g.strokeStyle = "#3a2010";
	g.lineWidth = 6;
	g.strokeRect(32, 32, 960, 256);
	g.fillStyle = "#f4ead2";
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.font = "bold 108px Georgia, 'Times New Roman', serif";
	g.fillText("OAKSTEAD", 512, 118);
	g.font = "bold 92px Georgia, 'Times New Roman', serif";
	g.fillText("STALL", 512, 222);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.anisotropy = 8;
	t.needsUpdate = true;
	SHOP_SIGN = t;
	return t;
}
function ShopSign({ d }) {
	return _jsxs("group", {
		position: [
			0,
			2.92,
			d * .5 + .1
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.58,
					-.08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					4.85,
					.1,
					.1
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				position: [
					-2.15,
					.42,
					-.08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.08,
					.32,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				position: [
					2.15,
					.42,
					-.08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.08,
					.32,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					4.6,
					1.15,
					.14
				] }), _jsx("meshStandardMaterial", { color: "#6a3a18" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					0,
					.08
				],
				children: [_jsx("planeGeometry", { args: [4.42, 1.02] }), _jsx("meshStandardMaterial", { map: shopSignMap() })]
			})
		]
	});
}
var EATERY_SIGN = null;
function eaterySignMap() {
	if (EATERY_SIGN) return EATERY_SIGN;
	const c = document.createElement("canvas");
	c.width = 1024;
	c.height = 320;
	const g = c.getContext("2d");
	g.fillStyle = "#5a2414";
	g.fillRect(0, 0, 1024, 320);
	g.fillStyle = "#7a3a20";
	for (let i = 0; i < 18; i++) g.fillRect(0, i * 18, 1024, 8);
	g.strokeStyle = "#c9a227";
	g.lineWidth = 14;
	g.strokeRect(18, 18, 988, 284);
	g.fillStyle = "#f4ead2";
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.font = "bold 96px Georgia, 'Times New Roman', serif";
	g.fillText("PELL'S TABLE", 512, 160);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.anisotropy = 8;
	t.needsUpdate = true;
	EATERY_SIGN = t;
	return t;
}
function EaterySign({ d }) {
	return _jsxs("group", {
		position: [
			0,
			4.72,
			d * .5 + .62
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					1.05,
					-.22
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.12,
					1.35,
					.12
				] }), _jsx("meshStandardMaterial", { color: "#3a1810" })]
			}),
			_jsxs("mesh", {
				position: [
					-3.6,
					1.05,
					-.22
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.12,
					1.35,
					.12
				] }), _jsx("meshStandardMaterial", { color: "#3a1810" })]
			}),
			_jsxs("mesh", {
				position: [
					3.6,
					1.05,
					-.22
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.12,
					1.35,
					.12
				] }), _jsx("meshStandardMaterial", { color: "#3a1810" })]
			}),
			_jsxs("mesh", {
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					8.8,
					1.72,
					.18
				] }), _jsx("meshStandardMaterial", { color: "#6a2a18" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					0,
					.1
				],
				children: [_jsx("planeGeometry", { args: [8.4, 1.52] }), _jsx("meshStandardMaterial", { map: eaterySignMap() })]
			})
		]
	});
}
var INN_SIGN = null;
function innSignMap() {
	if (INN_SIGN) return INN_SIGN;
	const c = document.createElement("canvas");
	c.width = 1024;
	c.height = 320;
	const g = c.getContext("2d");
	g.fillStyle = "#3a2818";
	g.fillRect(0, 0, 1024, 320);
	g.strokeStyle = "#c9a227";
	g.lineWidth = 14;
	g.strokeRect(18, 18, 988, 284);
	g.fillStyle = "#f4ead2";
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.font = "bold 96px Georgia, 'Times New Roman', serif";
	g.fillText("LILA'S INN", 512, 160);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.anisotropy = 8;
	t.needsUpdate = true;
	INN_SIGN = t;
	return t;
}
function InnSign({ d }) {
	return _jsxs("group", {
		position: [
			0,
			3.15,
			d * .5 + .12
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.72,
					-.08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					3.4,
					.08,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					3.2,
					.95,
					.12
				] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					0,
					.08
				],
				children: [_jsx("planeGeometry", { args: [3, .82] }), _jsx("meshStandardMaterial", { map: innSignMap() })]
			})
		]
	});
}
var LOFT_SIGN = null;
function loftSignMap() {
	if (LOFT_SIGN) return LOFT_SIGN;
	const c = document.createElement("canvas");
	c.width = 768;
	c.height = 256;
	const g = c.getContext("2d");
	g.fillStyle = "#3a2418";
	g.fillRect(0, 0, 768, 256);
	g.strokeStyle = "#c9a227";
	g.lineWidth = 10;
	g.strokeRect(12, 12, 744, 232);
	g.fillStyle = "#f4ead2";
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.font = "bold 54px Georgia, serif";
	g.fillText("THE COUNTING LOFT", 384, 100);
	g.font = "28px Georgia, serif";
	g.fillText("How the Vale was drawn", 384, 168);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.needsUpdate = true;
	LOFT_SIGN = t;
	return t;
}
function LoftSign({ d }) {
	return _jsxs("group", {
		position: [
			0,
			3.05,
			d * .5 + .12
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.62,
					-.08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					3.6,
					.08,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					3.4,
					1.05,
					.12
				] }), _jsx("meshStandardMaterial", { color: "#4a2418" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					0,
					.08
				],
				children: [_jsx("planeGeometry", { args: [3.2, .9] }), _jsx("meshStandardMaterial", { map: loftSignMap() })]
			})
		]
	});
}
function Chimney({ seed = 0, y = 5.45 }) {
	const puffs = useRef([]);
	useFrame(({ clock }) => {
		const t = clock.elapsedTime + seed * .37;
		for (let i = 0; i < puffs.current.length; i++) {
			const m = puffs.current[i];
			if (!m) continue;
			const u = (t * .16 + i * .14) % 1;
			const wind = Math.sin(t * .35 + i * .8) * .32 + u * .55;
			m.position.set(wind, 1.15 + u * 2.6, u * .22 + Math.cos(t * .28 + i) * .12);
			const s = .32 + u * 1.05;
			m.scale.set(s * 1.15, s, s * 1.15);
			const mat = m.material;
			mat.opacity = Math.max(0, (1 - u) * (1 - u) * .42);
		}
	});
	return _jsxs("group", {
		position: [
			2.15,
			y,
			-1.55
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.55,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.58,
					1.7,
					.58
				] }), _jsx("meshStandardMaterial", { color: "#6a4a38" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					1.42,
					0
				],
				children: [_jsx("boxGeometry", { args: [
					.72,
					.16,
					.72
				] }), _jsx("meshStandardMaterial", { color: "#4a3224" })]
			}),
			Array.from({ length: 7 }, (_, i) => _jsxs("mesh", {
				ref: (el) => {
					puffs.current[i] = el;
				},
				children: [_jsx("sphereGeometry", { args: [
					.26,
					7,
					6
				] }), _jsx("meshBasicMaterial", {
					color: i % 2 ? "#d4cec4" : "#c4bdb2",
					transparent: true,
					opacity: .3,
					depthWrite: false
				})]
			}, i))
		]
	});
}
var SHINGLE_MAP = null;
function shingleMap() {
	if (SHINGLE_MAP) return SHINGLE_MAP;
	const c = document.createElement("canvas");
	c.width = 64;
	c.height = 64;
	const g = c.getContext("2d");
	g.fillStyle = "#8a4030";
	g.fillRect(0, 0, 64, 64);
	const cols = ["#b85a38", "#a84c30", "#c46840", "#8a3c28", "#d47848", "#9a4430"];
	let i = 0;
	for (let y = 0; y < 64; y += 6) {
		const shift = y / 6 % 2 * 8;
		for (let x = -10; x < 64; x += 16) {
			g.fillStyle = cols[i++ % cols.length];
			g.fillRect(x + shift, y + 1, 14, 4);
			g.fillStyle = "rgba(20,16,12,0.35)";
			g.fillRect(x + shift, y + 4, 14, 1);
		}
	}
	const t = new CanvasTexture(c);
	t.wrapS = RepeatWrapping;
	t.wrapT = RepeatWrapping;
	t.repeat.set(4.2, 3.4);
	t.magFilter = NearestFilter;
	t.minFilter = NearestFilter;
	t.colorSpace = SRGBColorSpace;
	SHINGLE_MAP = t;
	return t;
}
function StoryRoof({ w, d, color, map }) {
	const pitch = .82;
	const y0 = 3.12;
	const half = d * .5 + .62;
	const rise = Math.tan(pitch) * half * .72;
	const slope = half / Math.cos(pitch) * .8;
	const rows = 4;
	const tiles = [];
	const shingle = map || shingleMap();
	for (let i = 0; i < rows; i++) {
		const t = (i + .5) / rows;
		const y = y0 + rise * t;
		const z = half * .55 * (1 - t);
		tiles.push(_jsxs("mesh", {
			position: [0, y, z],
			rotation: [pitch, 0, 0],
			children: [_jsx("boxGeometry", { args: [w + .92, .05, .2] }), _jsx("meshStandardMaterial", { color: "#8a3c28" })]
		}, `n${i}`));
		tiles.push(_jsxs("mesh", {
			position: [0, y, -z],
			rotation: [-pitch, 0, 0],
			children: [_jsx("boxGeometry", { args: [w + .92, .05, .2] }), _jsx("meshStandardMaterial", { color: "#7a3424" })]
		}, `s${i}`));
	}
	const gable = (() => {
		const s = new THREE.Shape();
		s.moveTo(-half * .92, 0);
		s.lineTo(half * .92, 0);
		s.lineTo(0, rise + .06);
		s.closePath();
		const g = new THREE.ExtrudeGeometry(s, { depth: .14, bevelEnabled: false });
		g.translate(0, 0, -.07);
		return g;
	})();
	const gableMat = { color: "#6a5848" };
	return _jsxs(_Fragment, { children: [
		_jsxs("mesh", {
			geometry: gable,
			position: [-w * .5 - .02, y0, 0],
			rotation: [0, Math.PI / 2, 0],
			castShadow: true,
			children: [_jsx("meshLambertMaterial", gableMat)]
		}),
		_jsxs("mesh", {
			geometry: gable,
			position: [w * .5 + .02, y0, 0],
			rotation: [0, Math.PI / 2, 0],
			castShadow: true,
			children: [_jsx("meshLambertMaterial", gableMat)]
		}),
		_jsxs("mesh", {
			position: [0, y0 + rise * .48, half * .38],
			rotation: [pitch, 0, 0],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [w + 1.15, .22, slope] }), _jsx("meshStandardMaterial", { color: color ?? "#3f362f", map: shingle })]
		}),
		_jsxs("mesh", {
			position: [0, y0 + rise * .48, -half * .38],
			rotation: [-pitch, 0, 0],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [w + 1.15, .22, slope] }), _jsx("meshStandardMaterial", { color: "#322c28", map: shingle })]
		}),
		_jsxs("mesh", {
			position: [0, y0 + rise, 0],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [w + .82, .14, .22] }), _jsx("meshStandardMaterial", { color: "#241e1a" })]
		}),
		tiles
	] });
}
function CottageTrim({ w, d }) {
	const stones = [];
	const cols = ["#8a8478", "#7a746c", "#9a9488", "#6e6860"];
	let k = 0;
	for (let s = -1; s <= 1; s += 2) {
		for (let i = 0; i < 3; i++) {
			stones.push(_jsxs("mesh", {
				position: [s * (w * .5 + .08), .18 + (i % 2) * .16, -d * .4 + i * (d * .18)],
				rotation: [0.04, i * 0.3, 0.02],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [.28, .22, .38] }), _jsx("meshStandardMaterial", { color: cols[k++ % cols.length] })]
			}, `st${s}${i}`));
		}
	}
	return _jsxs(_Fragment, { children: [
		_jsxs("mesh", {
			position: [0, 1.02, d * .5 + .05],
			children: [_jsx("boxGeometry", { args: [w * .96, .12, .1] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
		}),
		_jsxs("mesh", {
			position: [0, 2.55, d * .5 + .05],
			children: [_jsx("boxGeometry", { args: [w * .96, .12, .1] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
		}),
		[-w * .22, w * .22].map((x) => _jsxs("mesh", {
			position: [x, 1.7, d * .5 + .05],
			children: [_jsx("boxGeometry", { args: [.12, 2.55, .1] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
		}, `v${x}`)),
		_jsxs("mesh", {
			position: [0, .08, d * .5 + .95],
			rotation: [-Math.PI / 2, 0, 0],
			receiveShadow: true,
			children: [_jsx("planeGeometry", { args: [2.8, 2.0] }), _jsx("meshStandardMaterial", { color: "#5a4634" })]
		}),
		[0, 1, 2].map((i) => _jsxs("mesh", {
			position: [0, .08 + i * .11, d * .5 + .42 + i * .22],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [1.55 - i * .08, .12, .42] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
		}, `step${i}`)),
		_jsxs("mesh", {
			position: [0, 2.85, d * .5 + .42],
			rotation: [.55, 0, 0],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [2.15, .1, 1.05] }), _jsx("meshStandardMaterial", { color: "#322c28", map: shingleMap() })]
		}),
		stones
	] });
}
function Hut({ id, x, z, warm, chimney, brick, logs, w = HOUSE_W, d = HOUSE_D }) {
	const y = heightAt(x, z);
	const door = useRef(null);
	const open = useRef(0);
	const [talking, setTalking] = useState(false);
	const winA = useRef(null);
	const winB = useRef(null);
	const lamp = useRef(null);
	useFrame((_, dt) => {
		const call = live.doorCall;
		const use = live.doorUse?.id === id ? live.doorUse : null;
		let want = call?.house === id && call.phase === "talk" ? 1 : 0;
		if (use) {
			if (use.dir === "in") want = use.t > .32 && use.t < 1.9 ? 1 : 0;
			else want = use.t > .12 && use.t < 1.45 ? 1 : 0;
			if (use.t > .34 && !use.opened) {
				use.opened = true;
				sfx.open();
			}
		}
		open.current += (want - open.current) * (1 - Math.exp(-dt * 7));
		if (door.current) door.current.rotation.y = -open.current * 1.55;
		const lit = live.night;
		const glow = lit ? "#f4c878" : "#f0d090";
		if (winA.current) {
			winA.current.color.set(glow);
			winA.current.emissive.set("#f0b040");
			winA.current.emissiveIntensity = lit ? 1.15 : 0.48;
		}
		if (winB.current) {
			winB.current.color.set(glow);
			winB.current.emissive.set("#f0b040");
			winB.current.emissiveIntensity = lit ? 1.15 : 0.48;
		}
		if (lamp.current) lamp.current.intensity = lit ? (warm ? 7.2 : 3.4) : 0;
		const show = Boolean(call?.house === id && call.phase === "talk");
		if (show !== talking) setTalking(show);
	});
	const W = w;
	const D = d;
	const wall = brick ? "#e4dcc8" : logs ? "#ead8bc" : "#f4ead8";
	const map = brick ? worldTex("/game/world/stone.jpg", 3.2, 2.2) : logs ? worldTex("/game/world/wood.jpg", 2.4, 2) : worldTex("/game/world/plaster.jpg", 2.2, 1.8);
	return _jsxs(_Fragment, { children: [_jsxs("group", {
		position: [
			x,
			y,
			z
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.32,
					0
				],
				castShadow: true,
				receiveShadow: true,
				children: [_jsx("boxGeometry", { args: [
					W + .38,
					.7,
					D + .38
				] }), _jsx("meshStandardMaterial", { color: "#8a8478" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					1.55,
					0
				],
				castShadow: true,
				receiveShadow: true,
				children: [_jsx("boxGeometry", { args: [
					W,
					3.1,
					D
				] }), _jsx("meshStandardMaterial", {
					color: wall,
					map
				})]
			}),
			_jsxs("mesh", {
				position: [
					-W * .5 + .08,
					1.55,
					D * .5 + .02
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.16,
					3.1,
					.16
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [
					W * .5 - .08,
					1.55,
					D * .5 + .02
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.16,
					3.1,
					.16
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					2.05,
					D * .5 + .04
				],
				children: [_jsx("boxGeometry", { args: [
					W,
					.14,
					.12
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsx(StoryRoof, {
				w: W,
				d: D,
				color: "#a85a38",
				map: shingleMap()
			}),
			id === "eatery" || id === "inn" || id === "ash" ? _jsx(StoryRoof, {
				w: W * .55,
				d: D * .55,
				color: "#a84c30",
				map: shingleMap()
			}) : null,
			_jsx(CottageTrim, { w: W, d: D }),
			_jsxs("group", {
				ref: door,
				position: [
					-.55,
					1.15,
					D * .5 + .02
				],
				children: [_jsxs("mesh", {
					position: [
						.55,
						0,
						0
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						1.15,
						2.25,
						.12
					] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
				}), _jsxs("mesh", {
					position: [
						.95,
						-.1,
						.08
					],
					children: [_jsx("sphereGeometry", { args: [
						.05,
						8,
						6
					] }), _jsx("meshStandardMaterial", { color: "#c9a227" })]
				})]
			}),
			_jsxs("mesh", {
				position: [
					-W * .28,
					1.85,
					D * .5 + .04
				],
				children: [_jsx("boxGeometry", { args: [
					.7,
					.7,
					.08
				] }), _jsx("meshStandardMaterial", {
					ref: winA,
					color: "#9ec8e8"
				})]
			}),
			_jsxs("mesh", {
				position: [
					-W * .28 - .42,
					1.85,
					D * .5 + .06
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.14,
					.74,
					.06
				] }), _jsx("meshStandardMaterial", { color: "#6a3a18" })]
			}),
			_jsxs("mesh", {
				position: [
					-W * .28 + .42,
					1.85,
					D * .5 + .06
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.14,
					.74,
					.06
				] }), _jsx("meshStandardMaterial", { color: "#6a3a18" })]
			}),
			_jsxs("mesh", {
				position: [
					-W * .28,
					2.22,
					D * .5 + .08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.82,
					.08,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				position: [
					-W * .28,
					1.48,
					D * .5 + .08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.82,
					.08,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				position: [
					W * .28,
					1.85,
					D * .5 + .04
				],
				children: [_jsx("boxGeometry", { args: [
					.7,
					.7,
					.08
				] }), _jsx("meshStandardMaterial", {
					ref: winB,
					color: "#9ec8e8"
				})]
			}),
			_jsxs("mesh", {
				position: [
					W * .28 - .42,
					1.85,
					D * .5 + .06
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.14,
					.74,
					.06
				] }), _jsx("meshStandardMaterial", { color: "#6a3a18" })]
			}),
			_jsxs("mesh", {
				position: [
					W * .28 + .42,
					1.85,
					D * .5 + .06
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.14,
					.74,
					.06
				] }), _jsx("meshStandardMaterial", { color: "#6a3a18" })]
			}),
			_jsx("pointLight", {
				ref: lamp,
				position: [0, 1.9, D * .45],
				color: "#ffb060",
				intensity: 0,
				distance: 11
			}),
			_jsxs("mesh", {
				position: [
					W * .28,
					2.22,
					D * .5 + .08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.82,
					.08,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				position: [
					W * .28,
					1.48,
					D * .5 + .08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.82,
					.08,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#3a2818" })]
			}),
			_jsxs("mesh", {
				position: [
					-W * .28,
					1.42,
					D * .5 + .16
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.85,
					.12,
					.22
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			[
				-.18,
				0,
				.18
			].map((ox, i) => _jsxs("mesh", {
				position: [
					-W * .28 + ox,
					1.55,
					D * .5 + .16
				],
				children: [_jsx("sphereGeometry", { args: [
					.07,
					6,
					5
				] }), _jsx("meshStandardMaterial", { color: i % 2 ? "#c45c48" : "#e8d48a" })]
			}, `fl-${i}`)),
			_jsxs("mesh", {
				position: [
					W * .28,
					1.42,
					D * .5 + .16
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.85,
					.12,
					.22
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			[
				-.18,
				0,
				.18
			].map((ox, i) => _jsxs("mesh", {
				position: [
					W * .28 + ox,
					1.55,
					D * .5 + .16
				],
				children: [_jsx("sphereGeometry", { args: [
					.07,
					6,
					5
				] }), _jsx("meshStandardMaterial", { color: i % 2 ? "#3d8a68" : "#c45c48" })]
			}, `fr-${i}`)),
			_jsxs("mesh", {
				position: [
					0,
					.12,
					D * .5 + .7
				],
				rotation: [
					-Math.PI / 2,
					0,
					0
				],
				receiveShadow: true,
				children: [_jsx("planeGeometry", { args: [2.4, 1.6] }), _jsx("meshStandardMaterial", { color: "#6a5a48" })]
			}),
			id === "shop" ? _jsx(ShopSign, { d: D }) : null,
			id === "eatery" ? _jsx(EaterySign, { d: D }) : null,
			id === "inn" ? _jsx(InnSign, { d: D }) : null,
			id === "loft" ? _jsx(LoftSign, { d: D }) : null,
			chimney ? _jsx(Chimney, { seed: x }) : null
		]
	}), talking ? _jsx(N64Person, {
		look: id === "home" ? {
			tunic: "#c45c48",
			sash: "#e8d48a",
			hair: "#4a3220",
			skin: "#c49674",
			boots: "#3a2820",
			pants: "#3a5a88"
		} : {
			tunic: "#6a5a88",
			sash: "#c9a227",
			hair: "#c8b090",
			skin: "#c09070",
			boots: "#2a2018",
			pants: "#4a4038",
			cap: "#5a4a68"
		},
		x,
		z: z + d * .5 + .22,
		seed: id === "home" ? 2 : 4,
		facing: Math.PI,
		stay: true
	}) : null] });
}
export const BED_TOP_T = 2.65;
export const BED_BOT_T = .95;
export function chairSpots(hut) {
	if (hut.kind === "shop") return [{
		x: hut.x + 1.55,
		z: hut.z + .15,
		yaw: Math.PI
	}];
	if (hut.kind === "mill") return [{
		x: hut.x - .95,
		z: hut.z + .55,
		yaw: .6
	}];
	if (hut.kind === "keep") return [];
	if (hut.kind === "inn") {
		if (live.innInRoom) return [];
		if (live.innFloor === 0) return [{
			x: hut.x - 2.6,
			z: hut.z + 1.5,
			yaw: .4
		}];
		return [];
	}
	if (hut.kind === "eatery") return EATERY_TABLES.flatMap((t) => seatsForTable(hut, t));
	return [{
		x: hut.x + 2.35,
		z: hut.z + 2.08,
		yaw: 0
	}, {
		x: hut.x + 2.35,
		z: hut.z + .22,
		yaw: Math.PI
	}];
}
export function bunkSpots(hut) {
	if (hut.id === "yours") {
		const ox = hut.x - 2.2;
		const oz = hut.z - 3.35;
		return {
			top: { x: ox + 0.9, z: oz },
			bottom: { x: ox, z: oz },
			lie: { x: ox + 0.2, z: oz },
			ladder: { x: ox + 1.4, z: oz },
			topLie: { x: ox + 0.2, z: oz },
			botLie: { x: ox + 0.2, z: oz },
		};
	}
	if (hut.kind === "inn" && live.innInRoom) {
		const ox = hut.x - 2.4;
		const oz = hut.z - 1.6;
		return {
			top: {
				x: ox + 2.2,
				z: oz + .9
			},
			bottom: {
				x: ox + .4,
				z: oz + 1.5
			},
			lie: {
				x: ox + 1.1,
				z: oz + .9
			},
			ladder: {
				x: ox + 2.2,
				z: oz + .9
			},
			topLie: {
				x: ox + 1.1,
				z: oz + .9
			},
			botLie: {
				x: ox + 1.1,
				z: oz + .9
			}
		};
	}
	const ox = hut.x - 5.35;
	const oz = hut.z - 5.12;
	const L = 4.5;
	const W = 2.28;
	return {
		top: {
			x: ox + L + .22,
			z: oz + W * .5
		},
		bottom: {
			x: ox + L * .42,
			z: oz + W + .45
		},
		lie: {
			x: ox + L * .42,
			z: oz + W * .5
		},
		ladder: {
			x: ox + L + .22,
			z: oz + W * .5
		},
		topLie: {
			x: ox + L * .4,
			z: oz + W * .5
		},
		botLie: {
			x: ox + L * .4,
			z: oz + W * .5
		}
	};
}
export function tryHouse(nx, nz, worldId) {
	if (live.doorUse) {
		live.nearHouse = live.doorUse.id;
		live.nearExit = false;
		return null;
	}
	if (live.house) {
		const hut = HOUSES.find((h) => h.id === live.house);
		if (!hut) {
			live.nearHouse = null;
			live.nearExit = false;
			return null;
		}
		const { d } = houseSize(hut);
		const mill = hut.kind === "mill";
		const doorZ = hut.kind === "shrine" ? hut.z + 16.85 : mill ? hut.z + 2.72 : hut.z + d * .5 - .25;
		if (live.house === "jail") {
			live.nearExit = Boolean(live.jail.doorOpen) && Math.abs(nx - hut.x) < 1.4 && nz > hut.z + 3.6;
			live.nearHouse = null;
			return null;
		}
		if (live.house === "yours") {
			const { hz } = interiorHalf(hut);
			const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
			const out = Math.abs(nx - hut.x) < TREE_DOOR && nz > hut.z + hz + 0.05;
			if (out) {
				live.house = null;
				live.houseY = 0;
				live.y = plat + 0.04;
				live.z = TREE_HOME.z + TREE_HD + 0.55;
				live.nearExit = false;
			} else {
				live.nearExit = false;
			}
			live.nearHouse = null;
			return null;
		}
		live.nearExit = mill ? nz > hut.z + 1.6 && Math.hypot(nx - hut.x, nz - doorZ) < 1.55 : Math.abs(nx - hut.x) < 1.35 && Math.abs(nz - doorZ) < 1.55 && nz > hut.z;
		live.nearHouse = null;
		return null;
	}
	live.nearHouse = HOUSES.find((h) => {
		if (h.world !== worldId) return false;
		if (h.id === "jail") return false;
		if (h.id === "yours") {
			const plat = heightAt(h.x, h.z) + TREE_HOUSE_H;
			if (live.y > plat - 0.9 && Math.abs(nx - h.x) < TREE_DOOR && nz < h.z + TREE_HD + 0.15 && nz > h.z + TREE_HD - 1.15) {
				live.house = "yours";
				live.houseY = heightAt(h.x, h.z);
				live.y = plat + 0.04;
				live.z = h.z + TREE_HD - 1.05;
				return false;
			}
			return false;
		}
		if (h.kind === "shrine" && !live.shrineOpen) return false;
		if (h.kind === "mill") return Math.hypot(nx - h.x, nz - (h.z + 3.45)) < 1.7 && nz > h.z;
		const { d } = houseSize(h);
		return Math.hypot(nx - h.x, nz - (h.z + d * .5 + .2)) < 1.55;
	})?.id ?? null;
	live.nearExit = false;
	return null;
}
function isLogHouse(id) {
	return id === "cabin" || id === "oak3" || id === "oak5" || id === "oak7";
}

let CLOCK_FACE: THREE.CanvasTexture | null = null;
function clockFaceMap() {
  if (CLOCK_FACE) return CLOCK_FACE;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#efe6d4";
  g.beginPath();
  g.arc(256, 256, 250, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#3a2818";
  g.lineWidth = 22;
  g.stroke();
  g.fillStyle = "#1a1410";
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2 - Math.PI / 2;
    g.font = n % 3 === 0 ? "bold 72px Georgia, serif" : "bold 56px Georgia, serif";
    g.fillText(String(n), 256 + Math.cos(a) * 188, 256 + Math.sin(a) * 188);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  CLOCK_FACE = t;
  return t;
}

export function WallClock({ x = 0, y = 2.35, z = 0, scale = 1, yaw = 0 }) {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  useFrame(() => {
    const { t } = gameClock();
    const minutes = t * 60;
    if (hour.current) hour.current.rotation.z = -(minutes / 60 / 12) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -((minutes % 60) / 60) * Math.PI * 2;
  });
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.52, 0.1, 28]} />
        <meshStandardMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <circleGeometry args={[0.46, 32]} />
        <meshStandardMaterial map={clockFaceMap()} />
      </mesh>
      <group ref={hour} position={[0, 0, 0.08]}>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.055, 0.28, 0.025]} />
          <meshStandardMaterial color="#1a1410" />
        </mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.1]}>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.032, 0.38, 0.02]} />
          <meshStandardMaterial color="#6a2018" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function RoomShell({ logs, children, big, tall, huge, openSouth }) {
	const fmap = plankMap();
	const wallCol = logs ? "#6a4628" : "#8a6a48";
	const S = huge ? 2.85 : big ? 1.55 : 1;
	const H = huge ? 7.2 : tall ? 5.2 : 3.4;
	return _jsxs(_Fragment, { children: [
		_jsxs("mesh", {
			position: [
				0,
				-.52,
				0
			],
			receiveShadow: true,
			children: [_jsx("boxGeometry", { args: [
				18.5 * S,
				1.15,
				17.5 * S
			] }), _jsx("meshStandardMaterial", { color: "#3a2414" })]
		}),
		_jsxs("mesh", {
			position: [
				0,
				.08,
				0
			],
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			receiveShadow: true,
			children: [_jsx("planeGeometry", { args: [14.2 * S, 13.2 * S] }), _jsx("meshStandardMaterial", { map: fmap })]
		}),
		_jsxs("mesh", {
			position: [
				0,
				H,
				0
			],
			rotation: [
				Math.PI / 2,
				0,
				0
			],
			children: [_jsx("planeGeometry", { args: [12 * S, 11 * S] }), _jsx("meshStandardMaterial", { color: "#3a2a18" })]
		}),
		logs ? _jsxs(_Fragment, { children: [
			_jsx("group", {
				position: [
					0,
					0,
					5.3 * S
				],
				children: _jsx(WallLogs, {
					w: 12 * S,
					h: H,
					axis: "x"
				})
			}),
			_jsx("group", {
				position: [
					0,
					0,
					-5.3 * S
				],
				children: _jsx(WallLogs, {
					w: 12 * S,
					h: H,
					axis: "x"
				})
			}),
			_jsx("group", {
				position: [
					5.8 * S,
					0,
					0
				],
				children: _jsx(WallLogs, {
					w: 11 * S,
					h: H,
					axis: "z"
				})
			}),
			_jsx("group", {
				position: [
					-5.8 * S,
					0,
					0
				],
				children: _jsx(WallLogs, {
					w: 11 * S,
					h: H,
					axis: "z"
				})
			})
		] }) : (huge ? [
			[
				-(12 * S - 2.35) / 4 - 1.175,
				5.3 * S,
				(12 * S - 2.35) / 2,
				.4
			],
			[
				(12 * S - 2.35) / 4 + 1.175,
				5.3 * S,
				(12 * S - 2.35) / 2,
				.4
			],
			[
				0,
				-5.3 * S,
				12 * S,
				.4
			],
			[
				5.8 * S,
				0,
				.4,
				11 * S
			],
			[
				-5.8 * S,
				0,
				.4,
				11 * S
			]
		] : [
			...(openSouth ? [
				[-3.55 * S, 5.3 * S, 4.9 * S, .4],
				[3.55 * S, 5.3 * S, 4.9 * S, .4],
			] : [
				[0, 5.3 * S, 12 * S, .4],
			]),
			[
				0,
				-5.3 * S,
				12 * S,
				.4
			],
			[
				5.8 * S,
				0,
				.4,
				11 * S
			],
			[
				-5.8 * S,
				0,
				.4,
				11 * S
			]
		]).map(([wx, wz, ww, dd], i) => _jsxs("mesh", {
			position: [
				wx,
				H * .5,
				wz
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				ww,
				H,
				dd
			] }), _jsx("meshStandardMaterial", { color: wallCol })]
		}, i)),
		huge ? _jsxs("mesh", {
			position: [
				0,
				(H + 4.32) * .5,
				5.3 * S
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				2.55,
				H - 4.32,
				.4
			] }), _jsx("meshStandardMaterial", { color: wallCol })]
		}) : null,
		openSouth ? _jsx(OpenDoorway, {
			z: 5.3 * S - .2,
			h: H
		}) : _jsx(InnerDoor, {
			z: 5.3 * S - .42,
			scale: huge ? 1.95 : 1
		}),
		children
	] });
}
function OpenDoorway({ z, h }) {
	return _jsxs("group", {
		position: [0, 0, z],
		children: [
			_jsxs("mesh", {
				position: [-0.82, h * 0.5, 0],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [0.16, h, 0.22] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [0.82, h * 0.5, 0],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [0.16, h, 0.22] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [0, 2.28, 0],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [1.8, 0.16, 0.24] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
			})
		]
	});
}
function InnerDoor({ z, scale = 1 }) {
	return _jsxs("group", {
		position: [
			0,
			1.15 * scale,
			z
		],
		scale,
		children: [_jsxs("mesh", {
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				1.22,
				2.32,
				.16
			] }), _jsx("meshStandardMaterial", { color: "#0c0a08" })]
		}), _jsxs("mesh", {
			position: [
				.42,
				-.1,
				-.12
			],
			castShadow: true,
			children: [_jsx("sphereGeometry", { args: [
				.055,
				10,
				8
			] }), _jsx("meshStandardMaterial", { color: "#c9a227" })]
		})]
	});
}
export function HouseInterior({ id }) {
	if (id === "yours") return null;
	const hut = HOUSES.find((h) => h.id === id);
	if (!hut) return null;
	const y = heightAt(hut.x, hut.z);
	const pipLook = {
		tunic: "#c45c48",
		sash: "#e8d48a",
		hair: "#4a3220",
		skin: "#c49674",
		boots: "#3a2820",
		pants: "#5a4a38"
	};
	const nanaLook = {
		tunic: "#6a5a88",
		sash: "#c9a227",
		hair: "#c8b090",
		skin: "#c09070",
		boots: "#2a2018",
		pants: "#4a4038",
		cap: "#5a4a68"
	};
	if (id === "sum-shrine") {
		const have = useGame.getState().gems.emerald;
		return _jsxs("group", {
			position: [
				hut.x,
				y,
				hut.z
			],
			children: [
				_jsxs("mesh", {
					position: [
						0,
						-.28,
						0
					],
					receiveShadow: true,
					children: [_jsx("boxGeometry", { args: [
						17.4,
						.62,
						36.2
					] }), _jsx("meshStandardMaterial", { color: "#4a4034" })]
				}),
				_jsxs("mesh", {
					position: [
						0,
						.04,
						0
					],
					rotation: [
						-Math.PI / 2,
						0,
						0
					],
					receiveShadow: true,
					children: [_jsx("planeGeometry", { args: [16.6, 35.4] }), _jsx("meshStandardMaterial", { color: "#6a6458" })]
				}),
				_jsxs("mesh", {
					position: [
						0,
						5.4,
						0
					],
					rotation: [
						Math.PI / 2,
						0,
						0
					],
					children: [_jsx("planeGeometry", { args: [16.6, 35.4] }), _jsx("meshStandardMaterial", { color: "#2a241c" })]
				}),
				[
					[
						0,
						17.55,
						16.6,
						.5
					],
					[
						0,
						-17.55,
						16.6,
						.5
					],
					[
						8.15,
						0,
						.5,
						35.1
					],
					[
						-8.15,
						0,
						.5,
						35.1
					]
				].map(([wx, wz, ww, dd], i) => _jsxs("mesh", {
					position: [
						wx,
						2.7,
						wz
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						ww,
						5.4,
						dd
					] }), _jsx("meshStandardMaterial", { color: "#7a7468" })]
				}, i)),
				_jsxs("mesh", {
					position: [
						0,
						1.45,
						17.22
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						1.85,
						2.85,
						.22
					] }), _jsx("meshStandardMaterial", { color: "#5a3a24" })]
				}),
				_jsxs("mesh", {
					position: [
						-5.8,
						.55,
						-14.8
					],
					castShadow: true,
					children: [_jsx("cylinderGeometry", { args: [
						.62,
						.82,
						1.1,
						8
					] }), _jsx("meshStandardMaterial", { color: "#8a8070" })]
				}),
				have ? null : _jsxs("mesh", {
					position: [
						-5.8,
						1.58,
						-14.8
					],
					children: [_jsx("octahedronGeometry", { args: [.32, 0] }), _jsx("meshStandardMaterial", {
						color: "#e07a28",
						emissive: "#e07a28",
						emissiveIntensity: .9
					})]
				}),
				[-4.2, 4.2].map((ox) => [
					-10,
					-2,
					6
				].map((oz) => _jsxs("mesh", {
					position: [
						ox,
						2.2,
						oz
					],
					castShadow: true,
					children: [_jsx("cylinderGeometry", { args: [
						.32,
						.38,
						4.4,
						8
					] }), _jsx("meshStandardMaterial", { color: "#6a6458" })]
				}, `${ox}${oz}`))),
				_jsxs("mesh", {
					position: [
						0,
						.05,
						2
					],
					rotation: [
						-Math.PI / 2,
						0,
						0
					],
					receiveShadow: true,
					children: [_jsx("planeGeometry", { args: [3.4, 28] }), _jsx("meshStandardMaterial", { color: "#5a4030" })]
				}),
				[-6.4, 6.4].map((ox) => [-8, 4].map((oz) => _jsxs("group", {
					position: [
						ox,
						1.15,
						oz
					],
					children: [_jsxs("mesh", { children: [_jsx("cylinderGeometry", { args: [
						.22,
						.28,
						.7,
						8
					] }), _jsx("meshStandardMaterial", { color: "#5a554c" })] }), _jsxs("mesh", {
						position: [
							0,
							.48,
							0
						],
						children: [_jsx("sphereGeometry", { args: [
							.12,
							8,
							6
						] }), _jsx("meshBasicMaterial", { color: "#f4d060" })]
					})]
				}, `br${ox}${oz}`))),
				_jsx("pointLight", {
					position: [
						-5.6,
						3.4,
						-13.2
					],
					intensity: 28,
					color: "#ffc878",
					distance: 18
				}),
				_jsx("pointLight", {
					position: [
						0,
						3.6,
						6
					],
					intensity: 16,
					color: "#ffe2b0",
					distance: 18
				}),
				_jsx("ambientLight", { intensity: .72 })
			]
		});
	}
	if (id === "inn") return _jsx(InnInterior, {
		hut,
		y
	});
	if (id === "ash") return _jsx(AshHall, {
		hut,
		y
	});
	if (id === "eatery") return _jsx(EateryInterior, {
		hut,
		y
	});
	if (id === "shop") return _jsx("group", {
		position: [
			hut.x,
			y,
			hut.z
		],
		children: _jsxs(RoomShell, {
			big: true,
			children: [
				_jsxs("mesh", {
					position: [
						0,
						.7,
						-2.4
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						7.2,
						1.4,
						1.35
					] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
				}),
				[
					-2.4,
					-1.2,
					0,
					1.2,
					2.4
				].map((ox, i) => _jsxs("mesh", {
					position: [
						ox,
						1.55,
						-2.35
					],
					castShadow: true,
					children: [_jsx("cylinderGeometry", { args: [
						.16,
						.18,
						.32,
						8
					] }), _jsx("meshStandardMaterial", { color: i % 2 ? "#c45c48" : "#3d8a68" })]
				}, `jar${i}`)),
				[
					-2.1,
					-.7,
					.7,
					2.1
				].map((ox, i) => _jsxs("mesh", {
					position: [
						ox,
						1.52,
						-2.55
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						.38,
						.28,
						.32
					] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
				}, `box${i}`)),
				[
					-1.4,
					-.4,
					.5
				].map((ox, i) => _jsxs("mesh", {
					position: [
						ox,
						1.52,
						-2.15
					],
					castShadow: true,
					children: [_jsx("sphereGeometry", { args: [
						.12,
						8,
						6
					] }), _jsx("meshStandardMaterial", { color: "#c43c32" })]
				}, `ap${i}`)),
				_jsxs("mesh", {
					position: [
						-3.6,
						1.15,
						.4
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						.7,
						2.3,
						.85
					] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
				}),
				_jsxs("mesh", {
					position: [
						3.6,
						1.15,
						.4
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						.7,
						2.3,
						.85
					] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
				}),
				[
					-.4,
					.15,
					.7
				].map((oy, i) => _jsxs("mesh", {
					position: [
						-3.6,
						.55 + oy,
						.4
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						.62,
						.06,
						.78
					] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
				}, `sh${i}`)),
				_jsxs("mesh", {
					position: [
						-2.8,
						.28,
						1.6
					],
					rotation: [
						.1,
						.4,
						0
					],
					castShadow: true,
					children: [_jsx("cylinderGeometry", { args: [
						.28,
						.32,
						.42,
						8
					] }), _jsx("meshStandardMaterial", { color: "#c9a227" })]
				}),
				_jsx(Chair, {
					x: 1.55,
					z: .15,
					rot: Math.PI
				}),
				_jsx("pointLight", {
					position: [
						0,
						2.35,
						1.2
					],
					intensity: 18,
					color: "#ffe2b0",
					distance: 14
				}),
				_jsx("ambientLight", { intensity: .9 })
			]
		})
	});
	if (id === "ash") return _jsx(AshHall, {
		hut,
		y
	});
	if (id === "mill") return _jsxs(_Fragment, { children: [_jsxs("group", {
		position: [
			hut.x,
			y,
			hut.z
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					-.28,
					0
				],
				receiveShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					3.55,
					3.55,
					.7,
					20
				] }), _jsx("meshStandardMaterial", { color: "#3a2414" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.08,
					0
				],
				rotation: [
					-Math.PI / 2,
					0,
					0
				],
				receiveShadow: true,
				children: [_jsx("circleGeometry", { args: [3.35, 24] }), _jsx("meshStandardMaterial", { map: woodPlanks() })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					2.55,
					0
				],
				children: [_jsx("cylinderGeometry", { args: [
					3.4,
					3.4,
					5,
					20,
					1,
					true
				] }), _jsx("meshStandardMaterial", {
					color: "#8a6a48",
					side: 2
				})]
			}),
			_jsxs("mesh", {
				position: [
					0,
					5.08,
					0
				],
				rotation: [
					Math.PI / 2,
					0,
					0
				],
				children: [_jsx("circleGeometry", { args: [3.42, 20] }), _jsx("meshStandardMaterial", { color: "#3a2a18" })]
			}),
			_jsx(InnerDoor, { z: 2.85 }),
			_jsxs("mesh", {
				position: [
					0,
					.72,
					0
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.55,
					.62,
					1.4,
					12
				] }), _jsx("meshStandardMaterial", { color: "#8a8a82" })]
			}),
			[-1.6, 1.35].map((ox, i) => _jsxs("mesh", {
				position: [
					ox,
					.32,
					-1.1
				],
				rotation: [
					.15,
					i,
					.2
				],
				castShadow: true,
				children: [_jsx("sphereGeometry", { args: [
					.32,
					8,
					6
				] }), _jsx("meshStandardMaterial", { color: "#c4a060" })]
			}, i)),
			_jsxs("mesh", {
				position: [
					1.45,
					.28,
					1.05
				],
				rotation: [
					.2,
					.5,
					.1
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.26,
					.3,
					.48,
					8
				] }), _jsx("meshStandardMaterial", { color: "#8a6a40" })]
			}),
			_jsx(Chair, {
				x: -.95,
				z: .55,
				rot: .6
			}),
			_jsx(WallClock, {
				x: 0,
				y: 3.15,
				z: -3.15,
				scale: .7,
				yaw: Math.PI
			}),
			_jsx("pointLight", {
				position: [
					0,
					2.2,
					.4
				],
				intensity: 14,
				color: "#ffe2b0",
				distance: 10
			}),
			_jsx("ambientLight", { intensity: .82 })
		]
	}), _jsx(MillGrain, { hut })] });
	if (id === "keep-hall") return _jsxs(_Fragment, { children: [
		_jsx(KeepHall, { hut, y }),
		_jsx(FangLocker, { hut, y }),
	]});
	if (id === "jail") return _jsx(JailCell, { hut, y });
	const logs = isLogHouse(id);
	return _jsxs(_Fragment, { children: [_jsx("group", {
		position: [
			hut.x,
			y,
			hut.z
		],
		children: _jsxs(RoomShell, {
			logs,
			openSouth: id === "yours",
			children: [
				_jsx(Bunk, {
					x: -5.35,
					z: -5.12,
					single: id === "yours"
				}),
				id === "yours" ? null : _jsx(Rug, {}),
				_jsx(Table, {}),
				_jsx(Chair, {
					x: 2.35,
					z: 2.08,
					rot: 0
				}),
				_jsx(Chair, {
					x: 2.35,
					z: .22,
					rot: Math.PI
				}),
				id === "yours" ? _jsx(TableCandle, {}) : null,
				id === "yours" ? _jsx(HomeFinds, {}) : null,
				id === "yours" ? _jsx(Chair, { x: -2.1, z: -1.4, rot: 0.8 }) : null,
				id === "yours" ? null : _jsx(Shelf, {}),
				id === "yours" ? null : _jsx(Basin, {}),
				id === "yours" ? null : _jsx(CottageBits, {}),
				id === "yours" ? null : id === "home" || id === "oak1" || id === "oak4" ? _jsx(WallClock, {
					x: 0,
					y: 2.7,
					z: -5.05,
					scale: 1.05,
					yaw: Math.PI
				}) : null,
				id === "loft" ? _jsx(LoftStudio, {}) : null,
				_jsx("pointLight", {
					position: [
						0,
						2.35,
						1.2
					],
					intensity: 18,
					color: "#ffe2b0",
					distance: 14
				}),
				_jsx("ambientLight", { intensity: .85 })
			]
		})
	}), id === "home" ? _jsx(N64Person, {
		look: pipLook,
		x: hut.x + 1.15,
		z: hut.z + .35,
		seed: 2,
		facing: 2.4,
		id: "pip"
	}) : id === "cabin" ? _jsx(N64Person, {
		look: nanaLook,
		x: hut.x - .4,
		z: hut.z + .9,
		seed: 4,
		facing: .4,
		id: "nana"
	}) : null] });
}
function MillGrain({ hut }) {
	const got = useRef((useGame.getState().seenItems ?? []).includes("s:mill-grain"));
	const [, bump] = useState(0);
	const x = hut.x + .7;
	const z = hut.z - .4;
	useFrame(() => {
		if (got.current || live.house !== "mill") return;
		if (Math.hypot(live.x - x, live.z - z) < 1.15) {
			got.current = true;
			if (useGame.getState().discover("s:mill-grain")) {
				if (useGame.getState().addCoins(10) > 0) revealItem("coin");
				live.hint = "A purse in the grain bin.";
			}
			bump((v) => v + 1);
		}
	});
	if (got.current) return null;
	return _jsx("group", {
		position: [
			x,
			heightAt(hut.x, hut.z) + 1.05,
			z
		],
		children: _jsxs("mesh", { children: [_jsx("octahedronGeometry", { args: [.12, 0] }), _jsx("meshStandardMaterial", {
			color: "#3ecf6a",
			emissive: "#2a9a44",
			emissiveIntensity: .6
		})] })
	});
}
function KeepHall({ hut, y }) {
	const placed = useGame((s) => s.gemsPlaced);
	const bricks = keepBrickMap();
	const floor = concreteMap();
	return _jsxs("group", {
		position: [
			hut.x,
			y,
			hut.z
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					-.52,
					0
				],
				receiveShadow: true,
				children: [_jsx("boxGeometry", { args: [
					18,
					1.15,
					16
				] }), _jsx("meshStandardMaterial", { color: "#6a6864" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.08,
					0
				],
				rotation: [
					-Math.PI / 2,
					0,
					0
				],
				receiveShadow: true,
				children: [_jsx("planeGeometry", { args: [14.8, 13.2] }), _jsx("meshStandardMaterial", {
					map: floor,
					color: "#c8c4bc"
				})]
			}),
			_jsxs("mesh", {
				position: [
					0,
					4.2,
					0
				],
				rotation: [
					Math.PI / 2,
					0,
					0
				],
				children: [_jsx("planeGeometry", { args: [14.4, 12.6] }), _jsx("meshStandardMaterial", { color: "#4a4844" })]
			}),
			[
				[
					0,
					6.1,
					14.4,
					.5
				],
				[
					0,
					-6.1,
					14.4,
					.5
				],
				[
					7,
					0,
					.5,
					12.6
				],
				[
					-7,
					0,
					.5,
					12.6
				]
			].map(([wx, wz, ww, dd], i) => _jsxs("mesh", {
				position: [
					wx,
					2.1,
					wz
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					ww,
					4.2,
					dd
				] }), _jsx("meshStandardMaterial", {
					map: bricks,
					color: "#c4a090"
				})]
			}, i)),
			_jsxs("mesh", {
				position: [
					0,
					1.55,
					6.1
				],
				children: [_jsx("boxGeometry", { args: [
					2.2,
					3.1,
					.28
				] }), _jsx("meshStandardMaterial", { color: "#1a1210" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.04,
					1.2
				],
				rotation: [
					-Math.PI / 2,
					0,
					0
				],
				receiveShadow: true,
				children: [_jsx("planeGeometry", { args: [6.4, 8.2] }), _jsx("meshStandardMaterial", { color: "#5a3030" })]
			}),
			[-5.2, 5.2].map((ox) => _jsxs("group", {
				position: [
					ox,
					2.4,
					.4
				],
				children: [_jsxs("mesh", {
					position: [
						0,
						.7,
						0
					],
					children: [_jsx("cylinderGeometry", { args: [
						.04,
						.04,
						1.4,
						6
					] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
				}), _jsxs("mesh", {
					position: [
						ox > 0 ? -.32 : .32,
						.2,
						0
					],
					children: [_jsx("planeGeometry", { args: [.62, 1.1] }), _jsx("meshStandardMaterial", {
						color: "#6a3030",
						side: 2
					})]
				})]
			}, ox)),
			[-5.8, 5.8].map((ox) => [-2.2, 2.2].map((oz) => _jsxs("group", {
				position: [
					ox,
					2.6,
					oz
				],
				children: [_jsxs("mesh", {
					rotation: [
						0,
						0,
						ox > 0 ? -.4 : .4
					],
					children: [_jsx("cylinderGeometry", { args: [
						.04,
						.045,
						.55,
						6
					] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
				}), _jsxs("mesh", {
					position: [
						ox > 0 ? -.22 : .22,
						.18,
						0
					],
					children: [_jsx("sphereGeometry", { args: [
						.08,
						6,
						5
					] }), _jsx("meshBasicMaterial", { color: "#f4d060" })]
				})]
			}, `${ox}${oz}`))),
			[-4.2, 4.2].map((cx) => [-2.4, 2.2].map((cz) => _jsxs("mesh", {
				position: [
					cx,
					2.05,
					cz
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.28,
					.34,
					4.1,
					8
				] }), _jsx("meshStandardMaterial", { color: "#7a7570" })]
			}, `${cx}-${cz}`))),
			_jsxs("mesh", {
				position: [
					0,
					.55,
					-3.55
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					2.4,
					1.1,
					1.15
				] }), _jsx("meshStandardMaterial", { color: "#5a5550" })]
			}),
			KEEP_ALTAR.map((slot) => {
				const on = placed.includes(slot.id);
				const color = GEM_META[slot.id].color;
				return _jsxs("group", {
					position: [
						slot.x - hut.x,
						0,
						slot.z - hut.z
					],
					children: [_jsxs("mesh", {
						position: [
							0,
							.28,
							0
						],
						castShadow: true,
						children: [_jsx("cylinderGeometry", { args: [
							.38,
							.48,
							.55,
							6
						] }), _jsx("meshStandardMaterial", { color: "#6a6560" })]
					}), _jsxs("mesh", {
						position: [
							0,
							on ? .92 : .62,
							0
						],
						children: [_jsx("octahedronGeometry", { args: [on ? .22 : .12, 0] }), _jsx("meshStandardMaterial", {
							color,
							emissive: on ? color : "#000",
							emissiveIntensity: on ? 1.2 : 0,
							transparent: !on,
							opacity: on ? 1 : .28
						})]
					})]
				}, slot.id);
			}),
			placed.length >= 3 ? _jsxs("mesh", {
				position: [
					KEEP_INNER.x - hut.x,
					1.55,
					KEEP_INNER.z - hut.z
				],
				children: [_jsx("boxGeometry", { args: [
					1.8,
					3.1,
					.22
				] }), _jsx("meshStandardMaterial", {
					color: "#1a1010",
					emissive: "#4a1810",
					emissiveIntensity: .55
				})]
			}) : null,
			_jsx("pointLight", {
				position: [
					0,
					3.1,
					1.2
				],
				intensity: 22,
				color: "#ffe2b0",
				distance: 18
			}),
			_jsx("ambientLight", { intensity: .78 })
		]
	});
}
function Ladder({ x, z, h }) {
	const rungs = Math.max(2, Math.round(h / .2));
	return _jsxs("group", {
		position: [
			x,
			0,
			z
		],
		children: [
			_jsxs("mesh", {
				position: [
					-.16,
					h * .5,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.05,
					h,
					.05
				] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
			}),
			_jsxs("mesh", {
				position: [
					.16,
					h * .5,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.05,
					h,
					.05
				] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
			}),
			Array.from({ length: rungs }, (_, i) => _jsxs("mesh", {
				position: [
					0,
					.1 + i * (h - .16) / Math.max(1, rungs - 1),
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.36,
					.045,
					.05
				] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
			}, i))
		]
	});
}
function Bunk({ x, z, single = false }) {
	const L = 4.5;
	const W = 2.28;
	return _jsxs("group", {
		position: [
			x,
			0,
			z
		],
		children: [
			[
				[.1, .1],
				[4.4, .1],
				[.1, 2.1799999999999997],
				[4.4, 2.1799999999999997]
			].map(([px, pz], i) => _jsxs("mesh", {
				position: [
					px,
					single ? .42 : 1.22,
					pz
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.16,
					single ? .84 : 2.44,
					.16
				] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
			}, i)),
			_jsxs("mesh", {
				position: [
					L * .5,
					.42,
					W * .5
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					4.4,
					.18,
					2.1799999999999997
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [
					L * .5,
					.56,
					W * .5
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					4.22,
					.16,
					1.9999999999999998
				] }), _jsx("meshStandardMaterial", { color: "#6a3a48" })]
			}),
			single ? null : _jsxs("mesh", {
				position: [
					L * .5,
					1.72,
					W * .5
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					4.4,
					.18,
					2.1799999999999997
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			single ? null : _jsxs("mesh", {
				position: [
					L * .5,
					1.86,
					W * .5
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					4.22,
					.16,
					1.9999999999999998
				] }), _jsx("meshStandardMaterial", { color: "#3a5a78" })]
			}),
			single ? _jsxs("mesh", {
				position: [
					.55,
					.72,
					W * .5
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.7,
					.22,
					1.7
				] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
			}) : _jsx(Ladder, {
				x: 4.74,
				z: W * .5,
				h: 2.05
			})
		]
	});
}
function AshHall({ hut, y }) {
	const dummies = [
		{
			x: -3.2,
			z: -2.4
		},
		{
			x: 0,
			z: -3.1
		},
		{
			x: 3.2,
			z: -2.4
		}
	];
	useFrame(() => {
		if (live.house !== "ash") return;
		const g = useGame.getState();
		if (!g.hasSword) {
			g.grantSword();
			live.hasSword = true;
			live.holding = "sword";
			useGame.setState({ holding: "sword" });
			revealItem("sword");
			live.hint = "Ash: This is yours. Hit V. That’s a slash.";
		}
		const q = g.quests.ash ?? 0;
		if (q < 1) g.setQuest("ash", 1);
		const slash = live.slash;
		if (slash) for (const d of dummies) {
			const wx = hut.x + d.x;
			const wz = hut.z + d.z;
			if (Math.hypot(slash.x - wx, slash.z - wz) < 1.35) {
				live.ashDummy = 1;
				live.ashHits += 1;
				if (q < 2 && live.ashHits === 3) live.hint = "Ash: Wrong. Hold V — a big spin.";
				else if (q < 2 && live.spinning && live.ashHits >= 5) {
					g.setQuest("ash", 2);
					live.ashSpar = true;
					live.hint = "Ash: Now the real test.";
				}
			}
		}
		if (live.ashSpar && live.ashHits >= 9) {
			live.ashSpar = false;
			if (q < 3) g.setQuest("ash", 3);
			live.dinner = {
				who: "ash",
				hour: 18.5,
				arrived: false,
				left: false
			};
			live.hint = "Ash: Good job, my friend. Don’t worry — I’ll pay for your food.";
		}
	});
	return _jsx("group", {
		position: [
			hut.x,
			y,
			hut.z
		],
		children: _jsxs(RoomShell, {
			big: true,
			children: [
				_jsxs("mesh", {
					position: [
						0,
						.02,
						2.2
					],
					rotation: [
						-Math.PI / 2,
						0,
						0
					],
					receiveShadow: true,
					children: [_jsx("planeGeometry", { args: [8.4, 5.2] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
				}),
				dummies.map((d, i) => _jsxs("group", {
					position: [
						d.x,
						0,
						d.z
					],
					children: [
						_jsxs("mesh", {
							position: [
								0,
								.85,
								0
							],
							castShadow: true,
							children: [_jsx("cylinderGeometry", { args: [
								.08,
								.1,
								1.7,
								6
							] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
						}),
						_jsxs("mesh", {
							position: [
								0,
								1.55,
								0
							],
							castShadow: true,
							children: [_jsx("sphereGeometry", { args: [
								.22,
								8,
								6
							] }), _jsx("meshStandardMaterial", { color: "#c49674" })]
						}),
						_jsxs("mesh", {
							position: [
								0,
								1.05,
								0
							],
							castShadow: true,
							children: [_jsx("boxGeometry", { args: [
								.42,
								.55,
								.18
							] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
						}),
						_jsxs("mesh", {
							position: [
								.38,
								1.15,
								0
							],
							rotation: [
								0,
								0,
								-.4
							],
							castShadow: true,
							children: [_jsx("boxGeometry", { args: [
								.55,
								.08,
								.08
							] }), _jsx("meshStandardMaterial", { color: "#8a8a82" })]
						})
					]
				}, i)),
				_jsx(N64Person, {
					look: {
						tunic: "#3a5a48",
						sash: "#c9a227",
						hair: "#2a2018",
						skin: "#c49674",
						boots: "#1a1410",
						pants: "#3a3228",
						mouth: "smile",
						brows: "neutral",
						eyes: "#3a5a38"
					},
					x: hut.x + 2.2,
					z: hut.z + 1.4,
					seed: 11,
					facing: Math.PI,
					id: "ash",
					stay: true,
					holdTray: false,
					floorY: y
				}),
				_jsx("pointLight", {
					position: [
						0,
						3.2,
						0
					],
					intensity: 28,
					color: "#ffe2b0",
					distance: 16
				}),
				_jsx("ambientLight", { intensity: .95 })
			]
		})
	});
}
function InnInterior({ hut, y }) {
	const [floor, setFloor] = useState(live.innFloor);
	const [inRoom, setInRoom] = useState(live.innInRoom);
	useFrame(() => {
		if (live.innFloor !== floor) setFloor(live.innFloor);
		if (live.innInRoom !== inRoom) setInRoom(live.innInRoom);
	});
	const room = useGame((s) => s.innRoom ?? 0);
	const bedKind = useGame((s) => s.innBed ?? "");
	const quilt = bedKind === "plush" ? "#6a4a88" : bedKind === "comfy" ? "#3a5a78" : "#8a6a48";
	return _jsx("group", {
		position: [
			hut.x,
			y,
			hut.z
		],
		children: _jsxs(RoomShell, {
			big: true,
			children: [
				inRoom ? _jsxs(_Fragment, { children: [
					_jsx(InnBed, { quilt }),
					_jsx(Chair, {
						x: 2.4,
						z: 1.4,
						rot: -.4
					}),
					_jsxs("mesh", {
						position: [
							1.15,
							.38,
							1.15
						],
						castShadow: true,
						children: [_jsx("boxGeometry", { args: [
							.55,
							.72,
							.42
						] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
					}),
					_jsxs("mesh", {
						position: [
							1.15,
							.82,
							1.15
						],
						children: [_jsx("sphereGeometry", { args: [
							.08,
							8,
							6
						] }), _jsx("meshBasicMaterial", { color: "#f4d060" })]
					}),
					_jsxs("mesh", {
						position: [
							-4.4,
							1.55,
							.2
						],
						children: [_jsx("boxGeometry", { args: [
							.7,
							.85,
							.08
						] }), _jsx("meshStandardMaterial", { color: "#9ec8e8" })]
					})
				] }) : floor === 0 ? _jsxs(_Fragment, { children: [
					_jsxs("mesh", {
						position: [
							-.6,
							.75,
							-3.5
						],
						castShadow: true,
						children: [_jsx("boxGeometry", { args: [
							4.2,
							1.5,
							1.15
						] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
					}),
					[
						-1.6,
						-.6,
						.4
					].map((ox, i) => _jsxs("mesh", {
						position: [
							ox,
							1.58,
							-3.35
						],
						castShadow: true,
						children: [_jsx("cylinderGeometry", { args: [
							.07,
							.08,
							.16,
							8
						] }), _jsx("meshStandardMaterial", { color: i === 1 ? "#efe6d4" : "#6a3a18" })]
					}, i)),
					_jsxs("mesh", {
						position: [
							.85,
							1.62,
							-3.42
						],
						castShadow: true,
						children: [_jsx("boxGeometry", { args: [
							.42,
							.08,
							.32
						] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
					}),
					_jsxs("mesh", {
						position: [
							-2.4,
							1.72,
							-3.35
						],
						children: [_jsx("sphereGeometry", { args: [
							.08,
							8,
							6
						] }), _jsx("meshBasicMaterial", { color: "#f4d060" })]
					}),
					_jsxs("mesh", {
						position: [
							3.4,
							.55,
							2.2
						],
						castShadow: true,
						children: [_jsx("cylinderGeometry", { args: [
							.22,
							.28,
							.55,
							8
						] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
					}),
					_jsxs("mesh", {
						position: [
							3.4,
							1.05,
							2.2
						],
						children: [_jsx("sphereGeometry", { args: [
							.22,
							8,
							6
						] }), _jsx("meshStandardMaterial", { color: "#3d8a68" })]
					}),
					_jsx(Chair, {
						x: -2.6,
						z: 1.5,
						rot: .4
					}),
					_jsx(Rug, {}),
					_jsx(WallClock, {
						x: 0,
						y: 2.55,
						z: -7.85,
						scale: .8,
						yaw: Math.PI
					}),
					_jsx(InnSwitchback, {})
				] }) : floor === 1 ? _jsxs(_Fragment, { children: [_jsx(StairFlight, {
					x: 3.85,
					z: 1.55,
					yaw: 0
				}), _jsx(StairFlight, {
					x: 2.55,
					z: -1.45,
					yaw: Math.PI / 2
				})] }) : _jsxs(_Fragment, { children: [[
					-4.1,
					-2.05,
					0,
					2.05,
					4.1
				].map((dx, i) => {
					const num = i + 1;
					return _jsxs("group", {
						position: [
							dx,
							0,
							-7.15
						],
						children: [_jsxs("mesh", {
							position: [
								0,
								1.35,
								0
							],
							castShadow: true,
							children: [_jsx("boxGeometry", { args: [
								1.7,
								2.7,
								.22
							] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
						}), _jsxs("mesh", {
							position: [
								0,
								1.2,
								.04
							],
							children: [_jsx("boxGeometry", { args: [
								.78,
								1.7,
								.08
							] }), _jsx("meshStandardMaterial", { color: room === num ? "#6a4a28" : "#2a2018" })]
						})]
					}, num);
				}), _jsx(StairFlight, {
					x: 3.7,
					z: -5.85,
					yaw: -Math.PI / 2
				})] }),
				_jsx("pointLight", {
					position: [
						0,
						2.4,
						.4
					],
					intensity: 18,
					color: "#ffe2b0",
					distance: 14
				}),
				_jsx("ambientLight", { intensity: .88 })
			]
		})
	});
}
function InnSwitchback() {
	return _jsxs("group", { children: [
		_jsx(StairFlight, {
			x: 3.85,
			z: 1.7,
			yaw: 0
		}),
		_jsxs("mesh", {
			position: [
				3.85,
				.08,
				-1.15
			],
			receiveShadow: true,
			children: [_jsx("boxGeometry", { args: [
				2.15,
				.16,
				2.05
			] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
		}),
		_jsx(StairFlight, {
			x: 2.55,
			z: -1.45,
			yaw: Math.PI / 2
		})
	] });
}
var BG_DINERS = [
	{
		id: "cobb",
		table: 2,
		seat: 0
	},
	{
		id: "oak0",
		table: 2,
		seat: 2
	},
	{
		id: "oak2",
		table: 4,
		seat: 0
	},
	{
		id: "oak1",
		table: 4,
		seat: 1
	}
];
export const TOWN_PARTY = [
	"cobb",
	"oak0",
	"oak1",
	"oak2",
	"oak4",
	"oak5",
	"holt",
	"oak6",
	"mira"
];
function EateryInterior({ hut, y }) {
	const pellLook = {
		tunic: "#c45c48",
		sash: "#e8d48a",
		hair: "#3a2418",
		skin: "#b88860",
		boots: "#2a2018",
		pants: "#4a3a30",
		mouth: "smile",
		brows: "neutral",
		eyes: "#3a2418",
		beard: true
	};
	const [hostAt, setHostAt] = useState({
		x: hut.x + EATERY_PELL.x,
		z: hut.z + EATERY_PELL.z
	});
	const [hostYaw, setHostYaw] = useState(Math.PI);
	const [hideHost, setHideHost] = useState(false);
	const [foodOut, setFoodOut] = useState(false);
	const [carry, setCarry] = useState(false);
	useFrame((_, dt) => {
		const doorX = hut.x + EATERY_PELL.x;
		const doorZ = hut.z + EATERY_PELL.z;
		const kitX = hut.x + EATERY_KITCHEN.x;
		const kitZ = hut.z + EATERY_KITCHEN.z;
		const d = live.dine;
		if (!d) {
			if (Math.abs(hostAt.x - doorX) > .05 || Math.abs(hostAt.z - doorZ) > .05) setHostAt({
				x: doorX,
				z: doorZ
			});
			if (hideHost) setHideHost(false);
			if (foodOut) setFoodOut(false);
			if (carry) setCarry(false);
			const look = Math.atan2(-(live.x - doorX), -(live.z - doorZ));
			if (Math.abs(hostYaw - look) > .04) setHostYaw(look);
			live.npcPos.pell = {
				x: doorX,
				z: doorZ
			};
			live.npcMood.pell = "idle";
			return;
		}
		const playerSeat = seatsForTable(hut, EATERY_TABLES[d.table] ?? EATERY_TABLES[0])[0];
		const walkTo = (tx, tz, spd = 2.4) => {
			const dx = tx - d.hostX;
			const dz = tz - d.hostZ;
			const dist = Math.hypot(dx, dz);
			if (dist > .12) {
				d.hostX += dx / dist * spd * dt;
				d.hostZ += dz / dist * spd * dt;
				return dist;
			}
			d.hostX = tx;
			d.hostZ = tz;
			return 0;
		};
		if (d.phase === "host") {
			d.hostX = doorX;
			d.hostZ = doorZ;
		} else if (d.phase === "follow" || d.phase === "seat") {
			const tx = playerSeat.x;
			if (walkTo(tx, playerSeat.z + .55) <= .12 && d.phase === "follow") {
				if (Math.hypot(live.x - playerSeat.x, live.z - playerSeat.z) < 2.8) {
					d.phase = "seat";
					d.t = 0;
					live.sit = true;
					live.sitAt = {
						x: playerSeat.x,
						z: playerSeat.z,
						yaw: playerSeat.yaw
					};
					live.x = playerSeat.x;
					live.z = playerSeat.z;
					live.hint = "Pell sets menus on the table.";
					sfx.ok();
				} else live.hint = "Follow Pell to your seats.";
			}
		}
		if (d.phase === "seat") {
			d.t += dt;
			if (d.t > 1.1) {
				d.phase = "drink";
				d.t = 0;
			}
		}
		if (d.phase === "wait") {
			d.t += dt;
			walkTo(kitX, kitZ, 2.5);
			if (d.t >= 4.2) {
				d.phase = "ready";
				d.t = 0;
				live.hint = "Pell is back. Ready to order? Look at the menu.";
				sfx.chime();
			}
		}
		if (d.phase === "kitchen") {
			if (carry) setCarry(false);
			if (walkTo(kitX, kitZ, 2.7) <= .12) {
				d.phase = "carry";
				d.t = 0;
				if (!d.drink) d.drink = "juice";
				setCarry(true);
				live.hint = "Pell brings your food and juice.";
				sfx.ok();
			}
		}
		if (d.phase === "carry") {
			if (walkTo(playerSeat.x, playerSeat.z + .7, 2.35) <= .12) {
				d.phase = "eat";
				d.t = 0;
				d.eatU = 0;
				d.bites = 0;
				setCarry(false);
				if (!foodOut) setFoodOut(true);
				live.hint = "He sets the plates. Eat.";
				sfx.ok();
			}
		}
		if (d.phase === "served") {
			d.phase = "kitchen";
			d.t = 0;
		}
		if (d.phase === "eat" || d.phase === "askok") {
			d.eatU += dt / 2.35;
			if (d.eatU >= 1) {
				d.eatU = 0;
				d.bites += 1;
				if (!d.healed && d.bites >= 1) {
					d.healed = true;
					afterMeal();
					const g = useGame.getState();
					const add = d.food === "steak" ? 12 : 8;
					const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
					useGame.setState({ hp: Math.min(max, (g.hp ?? 4) + add) });
					sfx.heal();
					live.hint = "A good meal. You walk a little faster today.";
					if ((d.guests ?? []).includes("ash")) {
						if ((useGame.getState().quests.ash ?? 0) < 3) useGame.getState().setQuest("ash", 3);
						live.hint = "Ash looks at you like you count. Talk to him after.";
					}
				}
			}
			d.okT += dt;
			if (d.t > 1.2) {
				if (walkTo(kitX, kitZ, 2.6) <= .12 && !hideHost) setHideHost(true);
			}
			if (d.chatWait) {
				d.chatT += dt;
				if (d.chatT > 24) {
					d.chatWait = false;
					d.chatT = 0;
					d.chatI += 1;
					d.chatWho = null;
					d.chatLine = "";
					live.talking = false;
				}
			} else d.chatT = 0;
			if (d.phase === "eat" && !d.chatWait && d.bites >= 3) {
				d.checkT += dt;
				if (d.checkT >= (d.askedCheck ? 10 : 5)) {
					d.phase = "return";
					d.askedCheck = true;
					d.checkT = 0;
					d.t = 0;
					if (hideHost) setHideHost(false);
					live.hint = "Pell comes back from the kitchen.";
				}
			}
			d.t += dt;
			d.laughT = Math.max(0, d.laughT - dt);
			live.npcMood.hero = "eat";
			for (const id of d.guests) live.npcMood[id] = d.laughT > 0 ? "laugh" : d.chatWho === id ? "talk" : Math.floor(d.t + id.length) % 7 === 0 ? "sip" : "eat";
			if (d.laughT > 0) {
				live.npcMood.hero = "laugh";
				for (const id of d.guests) live.npcMood[id] = "laugh";
			}
			if (!d.chatWait && d.guests.length && d.chatI < 12 && d.t > 6 + d.chatI * 14) {
				const who = d.guests[d.chatI % d.guests.length];
				d.chatWho = who;
				d.chatLine = tableLine(who, d.chatI);
				d.chatWait = true;
				d.chatT = 0;
				live.npcMood[who] = "talk";
				live.talking = true;
			}
		}
		if (d.phase === "return") {
			if (hideHost) setHideHost(false);
			if (walkTo(playerSeat.x, playerSeat.z + .7, 2.55) <= .12) {
				d.phase = "check";
				d.t = 0;
				live.talking = true;
				live.hint = d.guests.includes("ash") ? "Pell: Ash already covered it." : "Pell: Want your check yet?";
			}
		}
		if (d.phase === "check") walkTo(playerSeat.x, playerSeat.z + .7);
		if (d.phase === "pay" || d.phase === "done") {
			d.t += dt;
			if (d.t > 2.2 && d.phase === "pay") {
				d.phase = "clear";
				d.t = 0;
				live.hint = "Pell takes the dishes.";
			}
		}
		if (d.phase === "clear") {
			if (foodOut) setFoodOut(false);
			if (walkTo(kitX, kitZ, 2.55) <= .12) {
				d.phase = "wash";
				d.t = 0;
				live.hint = "Pell ducks into the sink room.";
				sfx.open();
			}
		}
		if (d.phase === "wash") {
			d.t += dt;
			d.hostX = kitX;
			d.hostZ = kitZ;
			if (d.t > 3.2) {
				live.dine = null;
				live.hint = "Pell is back at the door. Come back soon.";
				sfx.ok();
			}
		}
		const hide = d.phase === "wash" || d.phase === "eat" && Math.hypot(d.hostX - kitX, d.hostZ - kitZ) < .22;
		if (hide !== hideHost) setHideHost(hide);
		if (Math.hypot(hostAt.x - d.hostX, hostAt.z - d.hostZ) > .04) {
			setHostYaw(Math.atan2(-(d.hostX - hostAt.x), -(d.hostZ - hostAt.z)));
			setHostAt({
				x: d.hostX,
				z: d.hostZ
			});
		} else if (d.phase === "host") setHostYaw(Math.atan2(-(live.x - d.hostX), -(live.z - d.hostZ)));
		live.npcPos.pell = {
			x: d.hostX,
			z: d.hostZ
		};
		live.npcMood.pell = d.phase === "eat" || d.phase === "carry" || d.phase === "kitchen" ? "idle" : "talk";
	});
	const partyTable = live.dine?.table ?? -1;
	const partySeats = partyTable >= 0 ? seatsForTable(hut, EATERY_TABLES[partyTable]) : [];
	return _jsxs(_Fragment, { children: [
		_jsx("group", {
			position: [
				hut.x,
				y,
				hut.z
			],
			children: _jsxs(RoomShell, {
				huge: true,
				tall: true,
				children: [
					EATERY_TABLES.map((t) => _jsx(EateryTable, {
						t,
						food: foodOut && live.dine?.table === t.id ? live.dine.food : null,
						drink: foodOut && live.dine?.table === t.id ? live.dine.drink : null
					}, t.id)),
					_jsxs("group", {
						position: [
							EATERY_KITCHEN.x,
							0,
							EATERY_KITCHEN.z
						],
						children: [
							_jsxs("mesh", {
								position: [
									0,
									1.35,
									0
								],
								castShadow: true,
								children: [_jsx("boxGeometry", { args: [
									.22,
									2.7,
									1.45
								] }), _jsx("meshStandardMaterial", { color: "#0a0806" })]
							}),
							_jsxs("mesh", {
								position: [
									-.14,
									1.32,
									.48
								],
								children: [_jsx("sphereGeometry", { args: [
									.06,
									8,
									6
								] }), _jsx("meshStandardMaterial", { color: "#c9a227" })]
							}),
							_jsxs("mesh", {
								position: [
									-.85,
									.55,
									-.2
								],
								castShadow: true,
								children: [_jsx("boxGeometry", { args: [
									1.4,
									1.1,
									.7
								] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
							}),
							[-1.2, -.55].map((ox, i) => _jsxs("mesh", {
								position: [
									ox,
									1.22,
									-.15
								],
								castShadow: true,
								children: [_jsx("cylinderGeometry", { args: [
									.18,
									.2,
									.22,
									8
								] }), _jsx("meshStandardMaterial", { color: "#8a8a82" })]
							}, i)),
							[
								-1.35,
								-.9,
								-.45
							].map((ox, i) => _jsxs("mesh", {
								position: [
									ox,
									2.05,
									.15
								],
								rotation: [
									.2,
									0,
									0
								],
								children: [_jsx("coneGeometry", { args: [
									.06,
									.28,
									5
								] }), _jsx("meshStandardMaterial", { color: "#3a6a38" })]
							}, `h${i}`))
						]
					}),
					_jsx(WallClock, {
						x: 0,
						y: 5.1,
						z: -14.8,
						scale: 1.45,
						yaw: Math.PI
					}),
					_jsx("pointLight", {
						position: [
							0,
							4.6,
							2
						],
						intensity: 32,
						color: "#ffe2b0",
						distance: 28
					}),
					_jsx("pointLight", {
						position: [
							-8,
							3.4,
							-2
						],
						intensity: 16,
						color: "#ffd8a0",
						distance: 16
					}),
					_jsx("pointLight", {
						position: [
							8,
							3.4,
							-2
						],
						intensity: 16,
						color: "#ffd8a0",
						distance: 16
					}),
					_jsx("pointLight", {
						position: [
							EATERY_PELL.x,
							2.4,
							EATERY_PELL.z
						],
						intensity: 22,
						color: "#ffe8c4",
						distance: 10
					}),
					_jsx("ambientLight", { intensity: 1.12 })
				]
			})
		}),
		BG_DINERS.map((g) => {
			if (g.table === partyTable) return null;
			if ((live.dine?.guests ?? []).includes(g.id)) return null;
			const npc = NPCS.find((n) => n.id === g.id);
			if (!npc?.look) return null;
			const seats = seatsForTable(hut, EATERY_TABLES[g.table]);
			const s = seats[g.seat] ?? seats[0];
			return _jsx(N64Person, {
				look: npc.look,
				x: s.x,
				z: s.z,
				seed: g.seat + 4,
				facing: s.yaw,
				id: g.id,
				stay: true,
				sit: true,
				kid: npc.kid,
				floorY: y
			}, g.id);
		}),
		(live.dine?.guests ?? []).map((id, i) => {
			const npc = NPCS.find((n) => n.id === id);
			if (!npc?.look) return null;
			const s = partySeats[i + 1] ?? partySeats[partySeats.length - 1];
			if (!s) return null;
			return _jsx(N64Person, {
				look: npc.look,
				x: s.x,
				z: s.z,
				seed: i + 8,
				facing: s.yaw,
				id,
				stay: true,
				sit: true,
				kid: npc.kid,
				floorY: y
			}, `p-${id}`);
		}),
		hideHost ? null : _jsx(N64Person, {
			look: pellLook,
			x: hostAt.x,
			z: hostAt.z,
			seed: 9,
			facing: hostYaw,
			id: "pell",
			stay: true,
			floorY: y,
			holdTray: carry
		})
	] });
}
function tableLine(who, i) {
	const jokes = [
		"We all know what Cobb’s doing every night.",
		"Don’t ask Holt about crates. He’ll tell you twice.",
		"Pell counts the plates. Then he counts them again."
	];
	const bits = {
		cobb: ["I was inspecting. That’s all.", "Carrots grow if you jump. That’s science."],
		oak0: ["Wipe your feet, even in here.", "The mill keeps the grain. Pell keeps the stew."],
		oak2: ["The top bunk is still mine!!", "Can I have the leftover toast?"],
		oak1: ["Oakstead is small. We like it that way.", "Sit. Eat. That’s the whole song."],
		holt: ["Twenty-two crates. Cobb grew four.", "Taste that. Sweet as a counted sum."],
		oak4: ["The mill turns even when the count is wrong.", "Pass the salt if you can count to salt."],
		oak5: ["If the fangs bang, I don’t open. I eat instead.", "Night is when I listen. Day is stew."],
		oak6: ["Wood for the fire. Grain for the mill. Steak for us.", "Names for the Oak. That’s Oakstead."],
		mira: ["The Oak still counts. So do the plates.", "Come by the tree after. I’ll be on the ladder."],
		ash: ["I don’t sit with just anyone.", "After this, a real fight. West field. You and me."]
	};
	if (i % 3 === 2) return jokes[i % jokes.length];
	const lines = bits[who] ?? ["The stew is honest. That’s enough."];
	return lines[i % lines.length];
}
function EateryTable({ t, food, drink }) {
	const w = t.w;
	const top = t.kind === "six" ? 1.05 : .95;
	const n = t.kind === "two" ? 1 : t.kind === "four" ? 2 : 3;
	const span = t.kind === "two" ? .55 : t.kind === "four" ? 1.05 : 1.7;
	const xs = Array.from({ length: n }, (_, i) => n === 1 ? 0 : -span + i * 2 * span / Math.max(1, n - 1));
	const drinkCol = drink === "milk" ? "#efe6d4" : drink === "tea" ? "#6a3a18" : drink === "juice" ? "#d47828" : "#9ec8e8";
	const foodCol = food === "steak" ? "#8a2a18" : "#efe6d0";
	return _jsxs("group", {
		position: [
			t.x,
			0,
			t.z
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.72,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					w,
					.1,
					top
				] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
			}),
			[-w * .38, w * .38].map((lx) => _jsxs("mesh", {
				position: [
					lx,
					.36,
					0
				],
				children: [_jsx("boxGeometry", { args: [
					.1,
					.72,
					.1
				] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
			}, lx)),
			_jsxs("mesh", {
				position: [
					0,
					.42,
					top * .62
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					w * .94,
					.08,
					.32
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.42,
					-top * .62
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					w * .94,
					.08,
					.32
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.86,
					0
				],
				children: [_jsx("cylinderGeometry", { args: [
					.03,
					.03,
					.22,
					6
				] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					1.02,
					0
				],
				children: [_jsx("sphereGeometry", { args: [
					.045,
					6,
					5
				] }), _jsx("meshBasicMaterial", { color: "#f4d060" })]
			}),
			xs.flatMap((ox) => [.28, -.28].map((sz) => _jsxs("group", { children: [
				_jsxs("mesh", {
					position: [
						ox + .16,
						.8,
						sz
					],
					children: [_jsx("cylinderGeometry", { args: [
						.13,
						.12,
						.035,
						8
					] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
				}),
				food ? _jsxs("mesh", {
					position: [
						ox + .16,
						.84,
						sz
					],
					children: [_jsx("boxGeometry", { args: [
						.2,
						.05,
						.14
					] }), _jsx("meshStandardMaterial", { color: foodCol })]
				}) : null,
				_jsxs("mesh", {
					position: [
						ox - .18,
						food ? .84 : .8,
						sz
					],
					children: [_jsx("cylinderGeometry", { args: [
						.055,
						.05,
						food && drink ? .12 : .07,
						8
					] }), _jsx("meshStandardMaterial", { color: drink && food ? drinkCol : "#efe6d4" })]
				})
			] }, `${ox}:${sz}`)))
		]
	});
}
function InnBed({ quilt }) {
	return _jsxs("group", {
		position: [
			-2.4,
			0,
			-1.6
		],
		children: [
			_jsxs("mesh", {
				position: [
					1.15,
					.32,
					.9
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					2.5,
					.28,
					1.55
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [
					1.15,
					.5,
					.9
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					2.3,
					.16,
					1.4
				] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
			}),
			_jsxs("mesh", {
				position: [
					1.35,
					.58,
					.9
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					1.7,
					.08,
					1.2
				] }), _jsx("meshStandardMaterial", { color: quilt })]
			})
		]
	});
}
function StairFlight({ x, z, yaw = 0 }) {
	return _jsxs("group", {
		position: [
			x,
			0,
			z
		],
		rotation: [
			0,
			yaw,
			0
		],
		children: [
			[0, 1, 2, 3, 4, 5].map((i) => _jsxs("mesh", {
				position: [
					0,
					.11 + i * .2,
					-i * .3
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					1.42,
					.14,
					.32
				] }), _jsx("meshStandardMaterial", { color: i % 2 ? "#5a3d24" : "#4a3220" })]
			}, i)),
			_jsxs("mesh", {
				position: [
					.7,
					.82,
					-.75
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.05,
					.07,
					1.85
				] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
			}),
			_jsxs("mesh", {
				position: [
					.7,
					.42,
					.08
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.05,
					.82,
					.05
				] }), _jsx("meshStandardMaterial", { color: "#5a3a20" })]
			}),
			_jsxs("mesh", {
				position: [
					.7,
					.92,
					-1.52
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.05,
					.7,
					.05
				] }), _jsx("meshStandardMaterial", { color: "#5a3a20" })]
			})
		]
	});
}
function Chair({ x, z, rot = 0 }) {
	return _jsxs("group", {
		position: [
			x,
			0,
			z
		],
		rotation: [
			0,
			rot,
			0
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.46,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.58,
					.08,
					.52
				] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
			}),
			[
				[-.22, -.18],
				[.22, -.18],
				[-.22, .18],
				[.22, .18]
			].map(([lx, lz], i) => _jsxs("mesh", {
				position: [
					lx,
					.23,
					lz
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.07,
					.46,
					.07
				] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
			}, i)),
			_jsxs("mesh", {
				position: [
					0,
					.84,
					.22
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.56,
					.72,
					.08
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			})
		]
	});
}
function Rug() {
	return _jsxs("mesh", {
		position: [
			1.4,
			.02,
			.4
		],
		rotation: [
			-Math.PI / 2,
			0,
			.12
		],
		receiveShadow: true,
		children: [_jsx("planeGeometry", { args: [3.6, 2.4] }), _jsx("meshStandardMaterial", { color: "#8a3a32" })]
	});
}
function Table() {
	return _jsxs("group", {
		position: [
			2.35,
			0,
			1.15
		],
		children: [_jsxs("mesh", {
			position: [
				0,
				.72,
				0
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				1.9,
				.1,
				1.15
			] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
		}), [
			[-.8, -.45],
			[.8, -.45],
			[-.8, .45],
			[.8, .45]
		].map(([lx, lz], i) => _jsxs("mesh", {
			position: [
				lx,
				.36,
				lz
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				.1,
				.72,
				.1
			] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
		}, i))]
	});
}
function TableCandle() {
	return _jsxs("group", {
		position: [
			2.35,
			.86,
			1.15
		],
		children: [
			_jsxs("mesh", {
				children: [_jsx("cylinderGeometry", { args: [
					.04,
					.04,
					.16,
					6
				] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.12,
					0
				],
				children: [_jsx("sphereGeometry", { args: [
					.04,
					6,
					5
				] }), _jsx("meshBasicMaterial", { color: "#f4d060" })]
			}),
			_jsx("pointLight", {
				position: [
					0,
					.22,
					0
				],
				intensity: 6,
				color: "#ffb050",
				distance: 5
			})
		]
	});
}

function HomeFinds() {
	const g = useGame.getState();
	const gems = g.gems ?? {};
	return _jsxs("group", {
		position: [2.4, 1.15, -2.2],
		children: [
			_jsxs("mesh", {
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [1.7, 0.08, 0.42] }), _jsx("meshLambertMaterial", { color: "#5a3d24" })],
			}),
			gems.emerald
				? _jsxs("mesh", {
						position: [-0.5, 0.22, 0],
						children: [_jsx("octahedronGeometry", { args: [0.12, 0] }), _jsx("meshLambertMaterial", { color: "#3d8a48", emissive: "#2a6a32", emissiveIntensity: 0.4 })],
					})
				: null,
			gems.ruby
				? _jsxs("mesh", {
						position: [0, 0.22, 0],
						children: [_jsx("octahedronGeometry", { args: [0.12, 0] }), _jsx("meshLambertMaterial", { color: "#a42828", emissive: "#7a1818", emissiveIntensity: 0.4 })],
					})
				: null,
			gems.sapphire
				? _jsxs("mesh", {
						position: [0.5, 0.22, 0],
						children: [_jsx("octahedronGeometry", { args: [0.12, 0] }), _jsx("meshLambertMaterial", { color: "#2a6a9a", emissive: "#1a4a7a", emissiveIntensity: 0.4 })],
					})
				: null,
			g.hasHorse
				? _jsxs("mesh", {
						position: [-0.25, 0.18, 0.12],
						children: [_jsx("sphereGeometry", { args: [0.08, 6, 5] }), _jsx("meshLambertMaterial", { color: "#6a4a28" })],
					})
				: null,
		],
	});
}

function Shelf() {
	return _jsxs("group", {
		position: [
			4.6,
			1.35,
			-1.4
		],
		children: [
			_jsxs("mesh", {
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					1.6,
					.1,
					.4
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.45,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					1.6,
					.1,
					.4
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}),
			[
				-.5,
				-.22,
				.08,
				.38
			].map((ox, i) => _jsxs("mesh", {
				position: [
					ox,
					.22,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.12,
					.28,
					.22
				] }), _jsx("meshStandardMaterial", { color: i % 2 ? "#6a3a28" : "#3a4a68" })]
			}, i)),
			_jsxs("mesh", {
				position: [
					.55,
					.62,
					0
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.08,
					.09,
					.18,
					8
				] }), _jsx("meshStandardMaterial", { color: "#c45c48" })]
			})
		]
	});
}
function Basin() {
	return _jsxs("group", {
		position: [
			3.6,
			0,
			-3.4
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					.55,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.7,
					.12,
					.5
				] }), _jsx("meshStandardMaterial", { color: "#8a8078" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.28,
					0
				],
				children: [_jsx("boxGeometry", { args: [
					.55,
					.55,
					.12
				] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
			}),
			_jsxs("mesh", {
				position: [
					.22,
					.72,
					0
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.06,
					.07,
					.16,
					8
				] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
			})
		]
	});
}
function CottageBits() {
	return _jsxs("group", { children: [
		_jsxs("group", {
			position: [
				-4.6,
				0,
				1.8
			],
			children: [
				_jsxs("mesh", {
					position: [
						0,
						.55,
						0
					],
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						1.15,
						1.1,
						.55
					] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
				}),
				_jsxs("mesh", {
					position: [
						0,
						.95,
						.02
					],
					children: [_jsx("boxGeometry", { args: [
						.72,
						.55,
						.12
					] }), _jsx("meshStandardMaterial", { color: "#1a1410" })]
				}),
				_jsxs("mesh", {
					position: [
						0,
						1.05,
						.04
					],
					children: [_jsx("coneGeometry", { args: [
						.18,
						.42,
						5
					] }), _jsx("meshBasicMaterial", {
						color: "#e87838",
						transparent: true,
						opacity: .85
					})]
				})
			]
		}),
		_jsxs("group", {
			position: [
				-3.8,
				0,
				3.4
			],
			children: [_jsxs("mesh", {
				position: [
					0,
					.28,
					0
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.16,
					.2,
					.42,
					8
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}), _jsxs("mesh", {
				position: [
					0,
					.62,
					0
				],
				children: [_jsx("sphereGeometry", { args: [
					.22,
					8,
					6
				] }), _jsx("meshStandardMaterial", { color: "#3d8a68" })]
			})]
		}),
		_jsxs("mesh", {
			position: [
				-5.2,
				1.85,
				.2
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				.08,
				.72,
				.95
			] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
		}),
		_jsxs("mesh", {
			position: [
				-5.15,
				1.85,
				.2
			],
			children: [_jsx("boxGeometry", { args: [
				.02,
				.58,
				.78
			] }), _jsx("meshStandardMaterial", { color: "#4a6a88" })]
		}),
		_jsxs("mesh", {
			position: [
				2.35,
				.86,
				1.15
			],
			children: [_jsx("cylinderGeometry", { args: [
				.04,
				.04,
				.16,
				6
			] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
		}),
		_jsxs("mesh", {
			position: [
				2.35,
				.98,
				1.15
			],
			children: [_jsx("sphereGeometry", { args: [
				.04,
				6,
				5
			] }), _jsx("meshBasicMaterial", { color: "#f4d060" })]
		})
	] });
}
var LOFT_PAINTS = {};
function loftPaint(kind) {
	const hit = LOFT_PAINTS[kind];
	if (hit) return hit;
	const c = document.createElement("canvas");
	c.width = 256;
	c.height = 192;
	const g = c.getContext("2d");
	g.fillStyle = "#efe6d4";
	g.fillRect(0, 0, 256, 192);
	g.strokeStyle = "#5a3d24";
	g.lineWidth = 6;
	g.strokeRect(4, 4, 248, 184);
	g.textAlign = "center";
	g.textBaseline = "middle";
	if (kind === "vale") {
		g.fillStyle = "#6a8a48";
		g.fillRect(18, 18, 220, 156);
		g.fillStyle = "#3a5a28";
		g.beginPath();
		g.ellipse(128, 148, 70, 28, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#6a6864";
		g.fillRect(118, 52, 22, 28);
		g.fillStyle = "#c9a227";
		g.beginPath();
		g.arc(128, 48, 7, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#c45c48";
		g.beginPath();
		g.arc(78, 78, 6, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#3a6a88";
		g.beginPath();
		g.arc(176, 86, 6, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#3d8a40";
		g.beginPath();
		g.arc(128, 108, 6, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#3a2418";
		g.font = "bold 16px Georgia, serif";
		g.fillText("the Vale, take 4", 128, 174);
	} else if (kind === "face") {
		g.fillStyle = "#3a2418";
		g.font = "bold 22px Georgia, serif";
		g.fillText("FACE = WALK", 128, 28);
		g.strokeStyle = "#2e8b4a";
		g.lineWidth = 3;
		g.strokeRect(28, 52, 70, 100);
		g.fillStyle = "#2e8b4a";
		g.font = "14px Georgia, serif";
		g.fillText("FRONT", 63, 70);
		g.beginPath();
		g.arc(63, 96, 10, 0, Math.PI * 2);
		g.fill();
		g.fillRect(50, 108, 26, 28);
		g.strokeStyle = "#6a4a28";
		g.strokeRect(158, 52, 70, 100);
		g.fillStyle = "#6a4a28";
		g.fillText("BACK", 193, 70);
		g.fillRect(176, 90, 34, 40);
		g.fillStyle = "#3a2418";
		g.font = "12px Georgia, serif";
		g.fillText("snout the way the feet go", 128, 172);
	} else if (kind === "crown") {
		g.fillStyle = "#3a2418";
		g.font = "bold 18px Georgia, serif";
		g.fillText("a leftover, crowned", 128, 28);
		g.fillStyle = "#3a7230";
		g.beginPath();
		g.ellipse(128, 118, 36, 48, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#c9a227";
		g.beginPath();
		g.moveTo(96, 78);
		g.lineTo(128, 42);
		g.lineTo(160, 78);
		g.closePath();
		g.fill();
		g.fillStyle = "#c45c48";
		g.beginPath();
		g.arc(118, 108, 6, 0, Math.PI * 2);
		g.arc(138, 108, 6, 0, Math.PI * 2);
		g.fill();
	} else {
		g.fillStyle = "#3a5a28";
		g.beginPath();
		g.moveTo(128, 24);
		g.lineTo(200, 160);
		g.lineTo(56, 160);
		g.closePath();
		g.fill();
		g.fillStyle = "#5a3d24";
		g.fillRect(118, 150, 20, 28);
		g.fillStyle = "#e8d48a";
		g.font = "bold 16px Georgia, serif";
		g.fillText("the Oak, still counting", 128, 176);
	}
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.needsUpdate = true;
	LOFT_PAINTS[kind] = t;
	return t;
}
function LoftStudio() {
	const vale = loftPaint("vale");
	const face = loftPaint("face");
	const crown = loftPaint("crown");
	const oak = loftPaint("oak");
	const frames = [
		{
			x: -4.85,
			z: -1.6,
			yaw: Math.PI / 2,
			map: vale,
			w: 1.35,
			h: 1
		},
		{
			x: -4.85,
			z: 1.4,
			yaw: Math.PI / 2,
			map: face,
			w: 1.15,
			h: 1.2
		},
		{
			x: 4.85,
			z: -.4,
			yaw: -Math.PI / 2,
			map: crown,
			w: 1.25,
			h: .95
		},
		{
			x: .4,
			z: -5.05,
			yaw: Math.PI,
			map: oak,
			w: 1.65,
			h: 1.05
		}
	];
	return _jsxs("group", { children: [
		frames.map((f, i) => _jsxs("group", {
			position: [
				f.x,
				1.85,
				f.z
			],
			rotation: [
				0,
				f.yaw,
				0
			],
			children: [_jsxs("mesh", {
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					f.w + .1,
					f.h + .1,
					.06
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}), _jsxs("mesh", {
				position: [
					0,
					0,
					.04
				],
				children: [_jsx("planeGeometry", { args: [f.w, f.h] }), _jsx("meshStandardMaterial", { map: f.map })]
			})]
		}, i)),
		_jsx("group", {
			position: [
				1.85,
				0,
				2.55
			],
			rotation: [
				0,
				Math.PI,
				0
			],
			children: _jsx(Humanoid, { look: {
				tunic: "#2e8b4a",
				sash: "#c9a227",
				hair: "#e2c45c",
				skin: "#e8b898",
				boots: "#4a3220",
				pants: "#efe6d4",
				mouth: "smile",
				brows: "neutral"
			} })
		}),
		_jsx("group", {
			position: [
				-1.85,
				0,
				2.55
			],
			rotation: [
				0,
				Math.PI,
				0
			],
			scale: .92,
			children: _jsx(N64Foe, {
				kind: "plusling",
				seed: 7,
				world: "meadow",
				pose: "idle"
			})
		}),
		_jsxs("group", {
			position: [
				3.15,
				0,
				-2.2
			],
			children: [_jsxs("mesh", {
				position: [
					0,
					.72,
					0
				],
				rotation: [
					.18,
					.4,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.06,
					1.45,
					.9
				] }), _jsx("meshStandardMaterial", { color: "#6a4a28" })]
			}), _jsxs("mesh", {
				position: [
					.02,
					.78,
					.02
				],
				rotation: [
					.18,
					.4,
					0
				],
				children: [_jsx("planeGeometry", { args: [.72, 1.05] }), _jsx("meshStandardMaterial", { map: vale })]
			})]
		}),
		_jsxs("group", {
			position: [
				-2.6,
				0,
				-2.6
			],
			children: [_jsxs("mesh", {
				position: [
					0,
					.78,
					0
				],
				rotation: [
					-.12,
					-.55,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					.06,
					1.55,
					1.05
				] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
			}), _jsxs("mesh", {
				position: [
					.02,
					.82,
					.02
				],
				rotation: [
					-.12,
					-.55,
					0
				],
				children: [_jsx("planeGeometry", { args: [.85, 1.2] }), _jsx("meshStandardMaterial", { map: face })]
			})]
		}),
		_jsxs("mesh", {
			position: [
				-1.6,
				.55,
				-3.4
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				1.35,
				.12,
				.85
			] }), _jsx("meshStandardMaterial", { color: "#4a3220" })]
		}),
		_jsxs("mesh", {
			position: [
				-1.6,
				.28,
				-3.4
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				1.2,
				.55,
				.7
			] }), _jsx("meshStandardMaterial", { color: "#3a2418" })]
		}),
		[
			-.35,
			0,
			.35
		].map((ox) => _jsxs("mesh", {
			position: [
				-1.6 + ox,
				.72,
				-3.35
			],
			rotation: [
				.4,
				.1,
				.05
			],
			castShadow: true,
			children: [_jsx("boxGeometry", { args: [
				.22,
				.02,
				.28
			] }), _jsx("meshStandardMaterial", { color: "#efe6d4" })]
		}, ox)),
		_jsxs("mesh", {
			position: [
				0,
				.02,
				3.6
			],
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			receiveShadow: true,
			children: [_jsx("planeGeometry", { args: [3.4, .7] }), _jsx("meshStandardMaterial", { color: "#5a3d24" })]
		}),
		_jsx("pointLight", {
			position: [
				0,
				2.5,
				0
			],
			intensity: 8,
			color: "#ffe2b0",
			distance: 12
		})
	] });
}
export function Campfires() {
	const [n, setN] = useState(0);
	const [boost, setBoost] = useState(0);
	const [night, setNight] = useState(false);
	useFrame(() => {
		const sum = live.fires.reduce((a, f) => a + (f.boost ?? 1), live.fires.length);
		if (live.fires.length !== n) setN(live.fires.length);
		if (sum !== boost) setBoost(sum);
		if (live.night !== night) setNight(live.night);
	});
	if (!night) return null;
	return _jsx("group", { children: live.fires.filter((f) => Math.hypot(f.x - VX, f.z - (VZ + 8)) > 3.2).map((f, i) => {
		const b = Math.max(1, f.boost ?? 1);
		const s = 1.35 + b * 0.22;
		return _jsxs("group", {
			position: [
				f.x,
				heightAt(f.x, f.z),
				f.z
			],
			children: [
				_jsx(LogStack, {
					n: Math.min(4, 1 + Math.floor(b / 2)),
					scale: .85
				}),
				_jsx(Flame, { scale: s })
			]
		}, i);
	}) });
}
export function HouseWoodpile() {
	const n = useGame((s) => s.houseWood ?? 0);
	const spot = homeWoodSpot();
	if (n <= 0) return null;
	const y = heightAt(spot.x, spot.z);
	return _jsx("group", {
		position: [
			spot.x,
			y,
			spot.z
		],
		children: _jsx(LogStack, { n })
	});
}
function SumShrine({ hut }) {
	const y = heightAt(hut.x, hut.z);
	const glow = useRef(null);
	useFrame(({ clock }) => {
		if (glow.current) glow.current.emissiveIntensity = .35 + Math.sin(clock.elapsedTime * 2.1) * .18;
	});
	const open = live.shrineOpen;
	return _jsxs("group", {
		position: [
			hut.x,
			y,
			hut.z
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					2.6,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					16.8,
					5.2,
					36
				] }), _jsx("meshStandardMaterial", { color: "#7a7468" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					5.6,
					0
				],
				rotation: [
					0,
					0,
					0
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					17.6,
					.55,
					36.8
				] }), _jsx("meshStandardMaterial", { color: "#5a554c" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					1.45,
					18.05
				],
				castShadow: true,
				children: [_jsx("boxGeometry", { args: [
					2.2,
					2.9,
					.28
				] }), _jsx("meshStandardMaterial", { color: open ? "#2a2018" : "#4a4038" })]
			}),
			[-6.2, 6.2].map((ox) => _jsxs("mesh", {
				position: [
					ox,
					2.4,
					17.9
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.42,
					.48,
					4.8,
					8
				] }), _jsx("meshStandardMaterial", { color: "#6a6458" })]
			}, ox)),
			[-6.2, 6.2].map((ox) => _jsxs("mesh", {
				position: [
					ox,
					4.95,
					17.9
				],
				castShadow: true,
				children: [_jsx("cylinderGeometry", { args: [
					.55,
					.42,
					.28,
					8
				] }), _jsx("meshStandardMaterial", { color: "#5a554c" })]
			}, `cap${ox}`)),
			[
				0,
				1,
				2,
				3
			].map((i) => _jsxs("mesh", {
				position: [
					0,
					.1 + i * .12,
					18.7 + i * .32
				],
				receiveShadow: true,
				children: [_jsx("boxGeometry", { args: [
					4.2 - i * .15,
					.14,
					.4
				] }), _jsx("meshStandardMaterial", { color: "#6a6458" })]
			}, i)),
			[-4.8, 4.8].map((ox) => _jsxs("mesh", {
				position: [
					ox,
					3.15,
					18.08
				],
				children: [_jsx("boxGeometry", { args: [
					1.1,
					1.4,
					.1
				] }), _jsx("meshStandardMaterial", {
					color: "#c9a227",
					emissive: "#c9a227",
					emissiveIntensity: .25
				})]
			}, `win${ox}`)),
			!open ? _jsxs("mesh", {
				position: [
					0,
					1.55,
					18.22
				],
				children: [_jsx("boxGeometry", { args: [
					1.6,
					2.4,
					.08
				] }), _jsx("meshStandardMaterial", {
					ref: glow,
					color: "#c9a227",
					emissive: "#c9a227",
					emissiveIntensity: .4
				})]
			}) : null
		]
	});
}
function CavernMouth() {
	const y = heightAt(CAVE_MOUTH.x, CAVE_MOUTH.z);
	return _jsxs("group", {
		position: [
			CAVE_MOUTH.x,
			y,
			CAVE_MOUTH.z
		],
		children: [
			_jsxs("mesh", {
				position: [
					0,
					1.05,
					.2
				],
				castShadow: true,
				children: [_jsx("dodecahedronGeometry", { args: [1.8, 0] }), _jsx("meshStandardMaterial", { color: "#4a4034" })]
			}),
			_jsxs("mesh", {
				position: [
					-1.35,
					.85,
					.15
				],
				scale: [
					1.1,
					.9,
					1
				],
				castShadow: true,
				children: [_jsx("dodecahedronGeometry", { args: [1.15, 0] }), _jsx("meshStandardMaterial", { color: "#3a3228" })]
			}),
			_jsxs("mesh", {
				position: [
					1.28,
					.78,
					.1
				],
				scale: [
					1,
					.85,
					1
				],
				castShadow: true,
				children: [_jsx("dodecahedronGeometry", { args: [1.05, 0] }), _jsx("meshStandardMaterial", { color: "#5a4a3a" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.95,
					.55
				],
				rotation: [
					.2,
					0,
					0
				],
				children: [_jsx("sphereGeometry", { args: [
					.72,
					10,
					8
				] }), _jsx("meshStandardMaterial", { color: "#0c0a08" })]
			}),
			_jsxs("mesh", {
				position: [
					0,
					.95,
					.4
				],
				children: [_jsx("sphereGeometry", { args: [
					.42,
					8,
					6
				] }), _jsx("meshBasicMaterial", { color: "#1a1010" })]
			}),
			_jsx("pointLight", {
				position: [
					0,
					.9,
					.2
				],
				color: "#3a2010",
				intensity: 2.2,
				distance: 8
			}),
			[
				-1.8,
				1.7,
				.2
			].map((ox, i) => _jsxs("mesh", {
				position: [
					ox,
					1.55 + i % 2 * .3,
					-.35
				],
				rotation: [
					.4,
					i,
					.2
				],
				castShadow: true,
				children: [_jsx("coneGeometry", { args: [
					.12,
					.85,
					5
				] }), _jsx("meshStandardMaterial", { color: "#2a5a32" })]
			}, i)),
			_jsxs("mesh", {
				position: [
					-.4,
					.22,
					1.35
				],
				rotation: [
					.3,
					.4,
					.1
				],
				castShadow: true,
				children: [_jsx("dodecahedronGeometry", { args: [.45, 0] }), _jsx("meshStandardMaterial", { color: "#4a4034" })]
			})
		]
	});
}
function HomeMailbox() {
	const { x, z } = homeMailSpot();
	const y = heightAt(x, z);
	const lid = useRef(null);
	const flag = useRef(null);
	const glow = useRef(null);
	const waiting = useGame((s) => hasMailWaiting(s.mailGot ?? [], s.mailWait ?? [], s.metNpcs ?? [], s.worldsCleared ?? [], s.mailCustom ?? []));
	useFrame((_, dt) => {
		if (lid.current) {
			const want = live.mailAct || live.mailReady ? 1.35 : 0;
			lid.current.rotation.x += (want - lid.current.rotation.x) * (1 - Math.exp(-dt * 8));
		}
		if (flag.current) flag.current.rotation.z = waiting && !live.mailReady ? -1.15 : .05;
		if (glow.current) glow.current.intensity = waiting && !live.mailReady ? 1.6 + Math.sin(performance.now() * 0.006) * 0.5 : 0;
		if (!live.house && Math.hypot(live.x - x, live.z - z) < 1.7 && waiting && !live.mailReady) {
			live.hint = "Mail is waiting.";
		}
	});
	return _jsxs("group", {
		position: [
			x,
			y,
			z
		],
		children: [_jsxs("mesh", {
			position: [
				0,
				.52,
				0
			],
			castShadow: true,
			children: [_jsx("cylinderGeometry", { args: [
				.05,
				.06,
				1.05,
				6
			] }), _jsx("meshStandardMaterial", { color: "#5a3a20" })]
		}), _jsxs("group", {
			position: [
				0,
				1.12,
				.06
			],
			children: [
				_jsxs("mesh", {
					castShadow: true,
					children: [_jsx("boxGeometry", { args: [
						.42,
						.3,
						.58
					] }), _jsx("meshStandardMaterial", { color: "#c45c48" })]
				}),
				_jsx("group", {
					ref: lid,
					position: [
						0,
						.12,
						-.12
					],
					children: _jsxs("mesh", {
						position: [
							0,
							.04,
							.18
						],
						rotation: [
							0,
							0,
							Math.PI / 2
						],
						castShadow: true,
						children: [_jsx("cylinderGeometry", { args: [
							.13,
							.13,
							.42,
							8
						] }), _jsx("meshStandardMaterial", { color: "#a84838" })]
					})
				}),
				_jsxs("mesh", {
					ref: flag,
					position: [
						.24,
						.12,
						0
					],
					rotation: [
						0,
						0,
						.05
					],
					children: [_jsx("boxGeometry", { args: [
						.22,
						.04,
						.08
					] }), _jsx("meshStandardMaterial", { color: "#e8d48a" })]
				})
			]
		}), _jsx("pointLight", {
			ref: glow,
			color: "#ffe28a",
			intensity: 0,
			distance: 5,
			position: [0, 1.4, 0]
		})]
	});
}

function JailCell({ hut, y }: { hut: (typeof HOUSES)[number]; y: number }) {
  const j = live.jail;
  const crate = useRef<THREE.Group>(null);
  const torch = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (crate.current) crate.current.position.set(j.cx, 0, j.cz);
    if (torch.current) torch.current.intensity = j.torchLit ? 22 : 4;
  });
  return (
    <group position={[hut.x, y, hut.z]}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12.4, 1.1, 11.2]} />
        <meshStandardMaterial color="#3a3834" />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.2, 9.4]} />
        <meshStandardMaterial color="#4a4640" />
      </mesh>
      <mesh position={[0, 3.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.4, 9.6]} />
        <meshStandardMaterial color="#2a2620" />
      </mesh>
      {[
        [0, 4.7, 10.4, 0.4],
        [0, -4.7, 10.4, 0.4],
        [5.1, 0, 0.4, 9.4],
        [-5.1, 0, 0.4, 9.4],
      ].map(([wx, wz, ww, dd], i) => (
        <mesh key={i} position={[wx, 1.85, wz]} castShadow>
          <boxGeometry args={[ww as number, 3.7, dd as number]} />
          <meshStandardMaterial color="#5a5550" />
        </mesh>
      ))}
      {j.doorOpen ? null : (
        <group position={[0, 1.45, 4.72]}>
          {[-0.55, -0.18, 0.18, 0.55].map((ox) => (
            <mesh key={ox} position={[ox, 0, 0]} castShadow>
              <boxGeometry args={[0.08, 2.85, 0.08]} />
              <meshStandardMaterial color="#8a8070" />
            </mesh>
          ))}
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[1.28, 0.08, 0.08]} />
            <meshStandardMaterial color="#8a8070" />
          </mesh>
        </group>
      )}
      <mesh position={[-3.35, 1.55, -3.55]} castShadow>
        <boxGeometry args={[1.35, 0.12, 0.55]} />
        <meshStandardMaterial color="#6a5018" />
      </mesh>
      {j.hasKey ? null : (
        <mesh position={[-3.35, 1.72, -3.55]} rotation={[0, 0.4, 0.2]} castShadow>
          <boxGeometry args={[0.22, 0.06, 0.08]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
      )}
      <mesh position={[3.05, 0.42, -2.55]} castShadow>
        <boxGeometry args={[0.95, 0.7, 0.7]} />
        <meshStandardMaterial color={j.chestOpen ? "#8a6a28" : "#5a3d18"} />
      </mesh>
      <mesh position={[3.9, 1.85, 0.2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.55, 6]} />
        <meshStandardMaterial color="#4a3220" />
      </mesh>
      <mesh position={[3.9, 2.2, 0.2]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshBasicMaterial color={j.torchLit ? "#f4d060" : "#4a4030"} />
      </mesh>
      <mesh position={[-4.55, 1.35, 2.15]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.18]} />
        <meshStandardMaterial color={j.brickOut ? "#3a342c" : j.torchLit ? "#c9a227" : "#6a6458"} />
      </mesh>
      <group ref={crate}>
        <mesh position={[0, 0.36, 0]} castShadow>
          <boxGeometry args={[0.78, 0.72, 0.78]} />
          <meshStandardMaterial color="#6a4a28" />
        </mesh>
      </group>
      <pointLight ref={torch} position={[3.9, 2.2, 0.2]} intensity={4} color="#ffc878" distance={12} />
      <ambientLight intensity={0.42} />
    </group>
  );
}

function FangLocker({ hut, y }: { hut: (typeof HOUSES)[number]; y: number }) {
  const door = useRef<THREE.Group>(null);
  const whoG = useRef<THREE.Group>(null);
  const fangG = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const L = live.locker;
    if (L.phase !== "idle") {
      L.t += dt;
      if (L.phase === "drag" && L.t > 2.4) {
        L.phase = "shut";
        L.t = 0;
        sfx.thud();
        live.hint = "The locker slammed.";
      } else if (L.phase === "shut" && L.t > 1.8) {
        L.phase = "open";
        L.t = 0;
        if (L.who && !live.turned.includes(L.who)) live.turned = [...live.turned, L.who];
        live.hint = "Someone came out wrong. A fang.";
        sfx.yelp();
      } else if (L.phase === "open" && L.t > 3.2) {
        L.phase = "done";
        L.t = 0;
      }
    }
    if (door.current) {
      const open = L.phase === "drag" || L.phase === "open";
      door.current.rotation.y = open ? -1.35 : 0;
    }
    if (whoG.current) whoG.current.visible = L.phase === "drag";
    if (fangG.current) fangG.current.visible = L.phase === "open";
  });
  return (
    <group position={[hut.x + 4.55, y, hut.z - 1.8]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.15, 2.3, 0.95]} />
        <meshStandardMaterial color="#3a3834" />
      </mesh>
      <group ref={door} position={[0.52, 1.15, 0.48]}>
        <mesh position={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.9, 2.15, 0.08]} />
          <meshStandardMaterial color="#2a2824" />
        </mesh>
        {[-0.28, 0, 0.28].map((ox) => (
          <mesh key={ox} position={[ox - 0.45, 0, 0.05]}>
            <boxGeometry args={[0.06, 2.05, 0.04]} />
            <meshStandardMaterial color="#8a8070" />
          </mesh>
        ))}
      </group>
      <group ref={whoG} position={[0, 0, 1.2]} visible={false}>
        <N64Person look={{ tunic: "#c8b090", sash: "#5a3a28", hair: "#4a3220", skin: "#e8c4a0", pants: "#4a3a30", boots: "#3a2818" }} x={0} z={0} seed={2} stay />
      </group>
      <group ref={fangG} position={[0, 0, 1.05]} visible={false}>
        <N64Foe kind="plusling" seed={4} pose="yell" world="keep" />
      </group>
    </group>
  );
}

