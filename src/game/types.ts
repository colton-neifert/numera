export type GradeBand = "k1" | "g23" | "g45" | "g68";
export type WorldId =
  | "meadow"
  | "cavern"
  | "marsh"
  | "grove"
  | "crater"
  | "lake"
  | "grave"
  | "waste"
  | "keep"
  | "echo"
  | "ridge"
  | "spire"
  | "fen"
  | "hollow"
  | "vault"
  | "arena";
export type Screen = "title" | "hub" | "overworld" | "combat" | "market" | "gameover";
export type SpellId = "leaf" | "fire" | "ice" | "storm" | "mend" | "ward";
export type Element = "leaf" | "fire" | "ice" | "storm";
export type WeaponId = "reed" | "oak" | "copper" | "teal" | "axiom";
export type OutfitId = "academy" | "meadow" | "ember" | "keep" | "royal";

export type GradeInfo = {
  id: GradeBand;
  label: string;
  ages: string;
  blurb: string;
};

export type Spell = {
  id: SpellId;
  name: string;
  kind: "attack" | "heal" | "guard";
  power: number;
  unlockLevel: number;
  hint: string;
  element?: Element;
};

export type EnemyDef = {
  id: string;
  name: string;
  sprite: string;
  maxHp: number;
  damage: number;
  xp: number;
  coins: number;
  boss?: boolean;
  weak: Element;
  resist: Element;
};

export type MathProblem = {
  prompt: string;
  answer: string;
  choices: string[];
  topic: string;
  stack?: { top: string; bot: string; op: string };
};

export type Encounter = {
  worldId: WorldId;
  enemyInstanceId: string;
  enemy: EnemyDef;
};

export type Weapon = {
  id: WeaponId;
  name: string;
  kind: "wand" | "sword";
  element: Element;
  atk: number;
  price: number;
  blurb: string;
};

export type Outfit = {
  id: OutfitId;
  name: string;
  hp: number;
  price: number;
  tunic: string;
  sash: string;
  blurb: string;
};
