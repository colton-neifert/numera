export type MouthId = "line" | "smile" | "frown" | "o";

export type HeroLookPick = {
  eyes: string;
  mouth: MouthId;
  hair: string;
  shirt: string;
  shoes: string;
};

export const DEFAULT_LOOK: HeroLookPick = {
  eyes: "#3a5a28",
  mouth: "smile",
  hair: "#d4b05a",
  shirt: "#3d8a68",
  shoes: "#4a3220",
};

export const EYE_COLORS = [
  { name: "Brown", color: "#5a3a22" },
  { name: "Hazel", color: "#6a6a28" },
  { name: "Green", color: "#3a5a28" },
  { name: "Blue", color: "#3a6aaa" },
  { name: "Gray", color: "#6a7a88" },
  { name: "Amber", color: "#c9a227" },
];

export const HAIR_COLORS = [
  { name: "Gold", color: "#d4b05a" },
  { name: "Brown", color: "#6a4a28" },
  { name: "Black", color: "#2a2018" },
  { name: "Red", color: "#a04828" },
  { name: "Ash", color: "#c8b090" },
  { name: "White", color: "#e8e4dc" },
];

export const SHIRT_COLORS = [
  { name: "Teal", color: "#3d8a68" },
  { name: "Green", color: "#3d6a3a" },
  { name: "Red", color: "#c45c48" },
  { name: "Blue", color: "#3a6a88" },
  { name: "Cream", color: "#efe6d4" },
  { name: "Purple", color: "#6a5a88" },
];

export const SHOE_COLORS = [
  { name: "Brown", color: "#4a3220" },
  { name: "Black", color: "#1a1410" },
  { name: "Tan", color: "#8a6a40" },
  { name: "Red", color: "#8a2820" },
  { name: "Green", color: "#2f6a58" },
  { name: "White", color: "#d8d4cc" },
];

export const MOUTHS: { id: MouthId; name: string }[] = [
  { id: "line", name: "Line" },
  { id: "smile", name: "Smile" },
  { id: "frown", name: "Frown" },
  { id: "o", name: "O" },
];
