import { heightAt, KEEP_Z, VX, VZ } from "./field";
import { HOUSES, houseSize } from "./house";
import { OakMark } from "./oakMark";

type Mark = "oak" | "coin" | "mug" | "hammer" | "wheat" | "wheel" | "bowl" | "sword" | "sun" | "castle" | "bars";

const BOARD: Record<Mark, string> = {
  oak: "#efe6d4",
  coin: "#6a4428",
  mug: "#5a3028",
  hammer: "#3a3e44",
  wheat: "#c4a05a",
  wheel: "#6a5038",
  bowl: "#e8d48a",
  sword: "#4a3228",
  sun: "#efe4c4",
  castle: "#d8d0c4",
  bars: "#4a4038",
};

function MarkShape({ kind }: { kind: Mark }) {
  if (kind === "oak") return <OakMark scale={1.35} />;
  if (kind === "coin") {
    return (
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 12]} />
        <meshLambertMaterial color="#e2b43a" />
      </mesh>
    );
  }
  if (kind === "mug") {
    return (
      <group>
        <mesh>
          <cylinderGeometry args={[0.14, 0.16, 0.28, 8]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.025, 6, 10]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
      </group>
    );
  }
  if (kind === "hammer") {
    return (
      <group rotation={[0, 0, 0.7]}>
        <mesh>
          <boxGeometry args={[0.08, 0.46, 0.06]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.28, 0.12, 0.1]} />
          <meshLambertMaterial color="#9aa0a8" />
        </mesh>
      </group>
    );
  }
  if (kind === "wheat") {
    return (
      <group>
        {[-0.1, 0, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.05, 0]}>
            <boxGeometry args={[0.04, 0.42, 0.04]} />
            <meshLambertMaterial color="#e2c15a" />
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === "wheel") {
    return (
      <mesh>
        <torusGeometry args={[0.2, 0.045, 6, 12]} />
        <meshLambertMaterial color="#8a6238" />
      </mesh>
    );
  }
  if (kind === "bowl") {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    );
  }
  if (kind === "sword") {
    return (
      <group rotation={[0, 0, 0.4]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.06, 0.42, 0.03]} />
          <meshLambertMaterial color="#d8dce2" />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <boxGeometry args={[0.18, 0.05, 0.04]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    );
  }
  if (kind === "sun") {
    return (
      <mesh>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color="#e2a030" />
      </mesh>
    );
  }
  if (kind === "castle") {
    return (
      <group>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.06, 0]}>
            <boxGeometry args={[0.12, 0.36, 0.08]} />
            <meshLambertMaterial color="#efe4cc" />
          </mesh>
        ))}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.16, 0.2, 0.08]} />
          <meshLambertMaterial color="#c45c48" />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      {[-0.12, 0, 0.12].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.05, 0.36, 0.05]} />
          <meshLambertMaterial color="#2a241c" />
        </mesh>
      ))}
    </group>
  );
}

const HOUSE_MARK: Record<string, Mark> = {
  shop: "coin",
  inn: "mug",
  smith: "hammer",
  farm: "wheat",
  mill: "wheel",
  eatery: "bowl",
  ash: "sword",
  "sum-shrine": "sun",
  "keep-hall": "castle",
  jail: "bars",
  home: "oak",
  cabin: "oak",
};

function PostSign({ x, z, kind, yaw = 0, tall = false }: { x: number; z: number; kind: Mark; yaw?: number; tall?: boolean }) {
  const y = heightAt(x, z);
  const h = tall ? 3.4 : 2.35;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, h * 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, h, 6]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <mesh position={[0, h * 0.82, 0.08]} castShadow>
        <boxGeometry args={[tall ? 1.35 : 1.05, tall ? 1.05 : 0.78, 0.08]} />
        <meshLambertMaterial color={BOARD[kind]} />
      </mesh>
      <mesh position={[0, h * 0.82, 0.13]}>
        <boxGeometry args={[tall ? 1.48 : 1.16, tall ? 1.16 : 0.9, 0.03]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      <group position={[0, h * 0.84, 0.16]}>
        <MarkShape kind={kind} />
      </group>
    </group>
  );
}

/** Physical shop, inn, forge, and landmark boards. Not UI labels. */
export function TownSigns() {
  return (
    <group>
      <PostSign x={VX} z={VZ - 10} kind="oak" tall />
      <PostSign x={0} z={-18} kind="castle" yaw={Math.PI} />
      <PostSign x={0} z={KEEP_Z - 28} kind="oak" yaw={0} />
      {HOUSES.filter((h) => h.world === "meadow" && HOUSE_MARK[h.id]).map((h) => {
        const { w, d } = houseSize(h);
        const side = h.id === "keep-hall" || h.id === "jail" ? 0 : w * 0.42;
        const front = h.id === "keep-hall" ? -d * 0.5 - 4 : d * 0.5 + 2.2;
        return <PostSign key={h.id} x={h.x + side} z={h.z + front} kind={HOUSE_MARK[h.id]!} yaw={h.id === "keep-hall" ? Math.PI : 0} />;
      })}
    </group>
  );
}
