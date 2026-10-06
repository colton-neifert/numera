import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KEEP_Z, MOAT_OUT, fieldHeight, moatGate } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { N64Person, type HumanLook } from "./actors";
import { useGame } from "../store";
import { playerMaxHp } from "../content";
import { touchState, isHeld } from "../input";
import { sfx } from "../audio";

const GAP = 0.13;

function angDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

const GUARD: HumanLook = {
  tunic: "#6a3030",
  sash: "#c9a227",
  hair: "#2a2018",
  skin: "#e0b090",
  boots: "#3a2820",
  pants: "#2a2420",
  shirt: "#efe6d4",
  kit: "guard",
  beard: true,
};

type Stock = { id: string; name: string; blurb: string; price: number; tint: string };
type Shop = {
  id: string;
  shopName: string;
  keeper: string;
  x: number;
  z: number;
  awning: string;
  tunic: string;
  items: Stock[];
};

const ROW = KEEP_Z - 12.6;
const SHOPS: Shop[] = [
  {
    id: "arms",
    shopName: "Bram's arms",
    keeper: "Bram",
    x: -8,
    z: ROW,
    awning: "#8a3030",
    tunic: "#6a3030",
    items: [
      { id: "arrows", name: "Arrow bundle", blurb: "Ten arrows for the bow.", price: 15, tint: "#c4a060" },
      { id: "axes", name: "Throwing axes", blurb: "They fly, stick, and you can pick them up.", price: 60, tint: "#8a8a90" },
      { id: "shield", name: "Oak shield", blurb: "Hold it up. Hits land softer.", price: 80, tint: "#2f6a38" },
    ],
  },
  {
    id: "shields",
    shopName: "The buckle",
    keeper: "Mira",
    x: -4.6,
    z: ROW + 1.5,
    awning: "#3a5a88",
    tunic: "#3a5a88",
    items: [
      { id: "shield", name: "Oak shield", blurb: "A round shield with the oak mark.", price: 80, tint: "#2f6a38" },
      { id: "hearts", name: "Plaster and linen", blurb: "A field dressing. Heals a little.", price: 20, tint: "#e8d0d0" },
    ],
  },
  {
    id: "adventure",
    shopName: "Ned's pack",
    keeper: "Ned",
    x: 2.2,
    z: ROW + 2.2,
    awning: "#c47a28",
    tunic: "#a86830",
    items: [
      { id: "bombs", name: "Bomb bundle", blurb: "Five bombs.", price: 12, tint: "#4a4a48" },
      { id: "arrows", name: "Arrow bundle", blurb: "Ten arrows.", price: 15, tint: "#c4a060" },
      { id: "seeds", name: "Seed pouch", blurb: "Eight seeds for the sling.", price: 10, tint: "#6a8a40" },
    ],
  },
  {
    id: "food",
    shopName: "Lise's board",
    keeper: "Lise",
    x: 4.6,
    z: ROW + 1.5,
    awning: "#c9a24a",
    tunic: "#d8b070",
    items: [
      { id: "bread", name: "Brown bread", blurb: "A heal of four.", price: 8, tint: "#d8b070" },
      { id: "stew", name: "Castle stew", blurb: "A heal of eight.", price: 18, tint: "#8a4030" },
    ],
  },
  {
    id: "potion",
    shopName: "Wren's bottles",
    keeper: "Wren",
    x: 8,
    z: ROW,
    awning: "#3a6a58",
    tunic: "#2a5a48",
    items: [
      { id: "red", name: "Red bottle", blurb: "A heal of twelve.", price: 22, tint: "#c04040" },
      { id: "full", name: "Wake tonic", blurb: "Fills your health.", price: 40, tint: "#e8e0a0" },
    ],
  },
  {
    id: "odd",
    shopName: "Quin's oddments",
    keeper: "Quin",
    x: -1.2,
    z: ROW,
    awning: "#5a4080",
    tunic: "#4a3068",
    items: [
      { id: "marble", name: "Odd marble", blurb: "It hums near old rocks. Nothing else. Yet.", price: 5, tint: "#8060c0" },
      { id: "wallet", name: "Stitched purse", blurb: "You can carry more coins.", price: 100, tint: "#c4a060" },
    ],
  },
];

function shopById(id: string) {
  return SHOPS.find((s) => s.id === id) ?? SHOPS[0]!;
}

function showItem(shop: Shop, index: number, note = "") {
  const item = shop.items[index]!;
  live.bazaar = {
    shop: shop.id,
    shopName: shop.shopName,
    index,
    ask: false,
    yes: true,
    note,
    name: item.name,
    blurb: item.blurb,
    price: item.price,
  };
}

function pay(price: number) {
  const g = useGame.getState();
  if (g.coins < price) return false;
  useGame.setState({ coins: g.coins - price });
  return true;
}

function heal(amount: number, full = false) {
  const g = useGame.getState();
  const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
  const hp = full ? max : Math.min(max, g.hp + amount);
  useGame.setState({ hp });
}

function grant(id: string): string {
  const g = useGame.getState();
  if (id === "arrows") {
    if (!g.hasBow) return "You need a bow first.";
    if (g.coins < 15) return "You cannot afford that.";
    const got = g.addArrows(10);
    if (!got) return "Your quiver is full.";
    pay(15);
    return "Ten arrows.";
  }
  if (id === "bombs") {
    if (!g.hasBombs) return "You need a bomb bag first.";
    if (g.coins < 12) return "You cannot afford that.";
    const got = g.addBombs(5);
    if (!got) return "Your bomb bag is full.";
    pay(12);
    return "Five bombs.";
  }
  if (id === "seeds") {
    if (!g.hasSling) return "You need the sling first.";
    if (g.coins < 10) return "You cannot afford that.";
    const got = g.addSeeds(8);
    if (!got) return "Your seed pouch is full.";
    pay(10);
    return "Eight seeds.";
  }
  if (id === "axes") {
    if (g.hasThrowAxes) return "You already carry these.";
    if (g.coins < 60) return "You cannot afford that.";
    if (!pay(60)) return "You cannot afford that.";
    g.grantThrowAxes();
    return "Throwing axes. Equip them.";
  }
  if (id === "shield") {
    if (g.hasShield) return "You already have a shield.";
    if (!g.buyShield()) return "You cannot afford that.";
    return "The oak shield is yours.";
  }
  if (id === "hearts" || id === "bread" || id === "stew" || id === "red") {
    const price = id === "bread" ? 8 : id === "stew" ? 18 : id === "red" ? 22 : 20;
    const n = id === "bread" ? 4 : id === "stew" ? 8 : id === "red" ? 12 : 4;
    if (!pay(price)) return "You cannot afford that.";
    heal(n);
    sfx.heal();
    return "That helps.";
  }
  if (id === "full") {
    if (!pay(40)) return "You cannot afford that.";
    heal(0, true);
    sfx.heal();
    return "You feel steady.";
  }
  if (id === "marble") {
    if (g.quests?.oddMarble) return "You already bought the marble.";
    if (!pay(5)) return "You cannot afford that.";
    g.setQuest("oddMarble", 1);
    return "It hums near old rocks.";
  }
  if (id === "wallet") {
    if (!g.buyWallet()) return (g.coinsMax ?? 100) >= 200 ? "Your purse is already stitched." : "You cannot afford that.";
    return "Your purse holds more.";
  }
  return "Not for sale.";
}

const nudge = { t: 0 };

export function stepCastleShop(talk: boolean) {
  if (!live.bazaar) {
    if (!talk || live.house) return false;
    const gz = KEEP_Z - 11;
    if (Math.hypot(live.x - 1.8, live.z - gz) < 2.3) {
      live.banner = moatGate.down > 0.7 ? "One guard. The bridge is down. The keep is open." : "The bridge is up until morning.";
      return true;
    }
    let best: Shop | null = null;
    let bestD = 2.3;
    for (const s of SHOPS) {
      const d = Math.hypot(live.x - s.x, live.z - (s.z + 1.6));
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    if (!best) return false;
    if (moatGate.down < 0.55) {
      live.banner = "The bridge is up. The market sleeps.";
      return true;
    }
    showItem(best, 0);
    live.speed = 0;
    sfx.open();
    return true;
  }
  const shop = shopById(live.bazaar.shop);
  const left = touchState.stickX < -0.55 || isHeld("ArrowLeft") || isHeld("KeyA");
  const right = touchState.stickX > 0.55 || isHeld("ArrowRight") || isHeld("KeyD");
  nudge.t -= 1 / 60;
  if (nudge.t <= 0 && (left || right)) {
    nudge.t = 0.22;
    if (live.bazaar.ask) {
      live.bazaar = { ...live.bazaar, yes: !live.bazaar.yes, note: "" };
    } else {
      const n = shop.items.length;
      const index = (live.bazaar.index + (right ? 1 : -1) + n) % n;
      showItem(shop, index);
    }
  }
  if (talk) {
    if (!live.bazaar.ask) {
      live.bazaar = { ...live.bazaar, ask: true, yes: true, note: "" };
    } else if (live.bazaar.yes) {
      const item = shop.items[live.bazaar.index]!;
      const note = grant(item.id);
      const bad = note.startsWith("You ");
      if (!bad) sfx.ok();
      showItem(shop, live.bazaar.index, note);
      if (live.bazaar) live.bazaar = { ...live.bazaar, ask: false };
    } else {
      showItem(shop, live.bazaar.index, "");
    }
  }
  return true;
}

export function bazaarLeave() {
  live.bazaar = null;
  live.shotCam = null;
}

export function bazaarChoose(yes: boolean) {
  if (!live.bazaar) return;
  if (!live.bazaar.ask) {
    live.bazaar = { ...live.bazaar, ask: true, yes, note: "" };
    return;
  }
  live.bazaar = { ...live.bazaar, yes };
  stepCastleShop(true);
}

export function collideCastle(_nx: number, _nz: number): { x: number; z: number } | null {
  return null;
}


function ItemMesh({ tint }: { tint: string }) {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.38, 0.38, 0.38]} />
      {lamb(tint)}
    </mesh>
  );
}

function Stall({ shop, y }: { shop: Shop; y: number }) {
  const spins = useRef<(THREE.Group | null)[]>([]);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const selected = live.bazaar?.shop === shop.id ? live.bazaar.index : -1;
    spins.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.y = clock.elapsedTime * 0.45 + i;
      g.position.y = 1.15 + Math.sin(clock.elapsedTime * 1.2 + i) * 0.05;
      g.scale.setScalar(selected === i ? 1.2 : 1);
    });
    if (ring.current) {
      ring.current.visible = selected >= 0;
      if (selected >= 0) ring.current.position.x = (selected - (shop.items.length - 1) / 2) * 0.7;
    }
  });
  return (
    <group position={[shop.x, y, shop.z]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.1, 1.3]} />
        {lamb("#8a6844", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 1.7, -0.15]}>
        <boxGeometry args={[2.6, 0.08, 1.5]} />
        {lamb(shop.awning)}
      </mesh>
      <mesh position={[0, 0.95, -0.35]} castShadow>
        <boxGeometry args={[2.2, 0.7, 0.35]} />
        {lamb("#6a5340", { kind: "wood" })}
      </mesh>
      <mesh ref={ring} position={[0, 0.95, -0.35]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[0.32, 0.04, 6, 18]} />
        {lamb("#e8d048")}
      </mesh>
      {shop.items.map((item, i) => (
        <group key={item.id} ref={(n) => (spins.current[i] = n)} position={[(i - (shop.items.length - 1) / 2) * 0.7, 1.15, -0.35]}>
          <ItemMesh tint={item.tint} />
        </group>
      ))}
    </group>
  );
}

export function CastleYard() {
  const y = fieldHeight(0, KEEP_Z);
  const camOwned = useRef(false);
  useFrame(() => {
    const gateZ = KEEP_Z - MOAT_OUT - 3;
    if (!live.bazaar && !live.house && Math.hypot(live.x, live.z - gateZ) < 5) {
      live.hint = moatGate.down > 0.7 ? "The bridge is down." : "The bridge is up until morning.";
    }
    if (live.bazaar) {
      const s = shopById(live.bazaar.shop);
      live.shotCam = { x: s.x, y: y + 2.35, z: s.z + 3.4, lx: s.x, ly: y + 1.25, lz: s.z - 0.2 };
      camOwned.current = true;
      live.speed = 0;
    } else if (camOwned.current) {
      live.shotCam = null;
      camOwned.current = false;
    }
  });
  return (
    <group>
      {SHOPS.map((s) => (
        <Stall key={s.id} shop={s} y={y} />
      ))}
      {SHOPS.map((s) => (
        <N64Person
          key={s.id}
          look={{ ...GUARD, tunic: s.tunic, kit: "apron", beard: false, hair: "#5a3a22" }}
          x={s.x}
          z={s.z + 1.55}
          floorY={y}
          facing={Math.PI}
          stay
          seed={s.x}
          id={`keep-shop-${s.id}`}
        />
      ))}
      <N64Person look={GUARD} x={1.8} z={KEEP_Z - 11} facing={Math.PI} stay seed={11} id="keep-gate" />
    </group>
  );
}
