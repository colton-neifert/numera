export type EyeShape = "round" | "narrow" | "wide" | "sharp";
export type MouthId = "none" | "line" | "smile" | "frown";
export type BrowId = "none" | "neutral" | "mad" | "sad" | "worried" | "raised";
export type NoseId = "pointy" | "round" | "line";
export type LashId = "none" | "short" | "long" | "curly" | "thick" | "star";

export type HeroLookPick = {
  hair: string;
  skin: string;
  eyes: string;
  eyeShape: EyeShape;
  lashes: LashId;
  mouth: MouthId;
  nose: NoseId;
  brows: BrowId;
  blush: string;
  blushAmt: number;
  tunic: string;
  pants: string;
  boots: string;
  cap: string;
};

/** Official boy hero from the character sheet — curly brown hair, green tunic, cream trousers. */
export const BOY_LOOK: HeroLookPick = {
  hair: "#5c3a22",
  skin: "#e8b898",
  eyes: "#3a2418",
  eyeShape: "wide",
  lashes: "none",
  mouth: "smile",
  nose: "round",
  brows: "neutral",
  blush: "#c45c58",
  blushAmt: 0.55,
  tunic: "#3d8a42",
  pants: "#5a3a28",
  boots: "#5a3a22",
  cap: "",
};

/** Official girl hero from the character sheet — braid, teal coat, gold trim, dark leggings. */
export const GIRL_LOOK: HeroLookPick = {
  hair: "#5c3a22",
  skin: "#e8b898",
  eyes: "#3a2418",
  eyeShape: "wide",
  lashes: "long",
  mouth: "smile",
  nose: "round",
  brows: "neutral",
  blush: "#c45c58",
  blushAmt: 0.62,
  tunic: "#3a7a88",
  pants: "#3a4a58",
  boots: "#5a3a22",
  cap: "",
};

export const DEFAULT_LOOK: HeroLookPick = { ...BOY_LOOK };

export function lookForGender(g: "boy" | "girl"): HeroLookPick {
  return g === "girl" ? { ...GIRL_LOOK } : { ...BOY_LOOK };
}

export const EYE_SHAPES: { id: EyeShape; name: string }[] = [
  { id: "round", name: "Round" },
  { id: "narrow", name: "Narrow" },
  { id: "wide", name: "Wide" },
  { id: "sharp", name: "Sharp" },
];

export const LASHES: { id: LashId; name: string }[] = [
  { id: "none", name: "None" },
  { id: "short", name: "Short" },
  { id: "long", name: "Long" },
  { id: "curly", name: "Curly" },
  { id: "thick", name: "Thick" },
  { id: "star", name: "Winged" },
];

export const NOSES: { id: NoseId; name: string }[] = [
  { id: "pointy", name: "Pointy" },
  { id: "round", name: "Rounded" },
  { id: "line", name: "Line" },
];

export const MOUTHS: { id: MouthId; name: string }[] = [
  { id: "line", name: "Line" },
  { id: "smile", name: "Smile" },
  { id: "frown", name: "Frown" },
  { id: "none", name: "No mouth" },
];

export const BROWS: { id: BrowId; name: string }[] = [
  { id: "neutral", name: "Neutral" },
  { id: "mad", name: "Mad" },
  { id: "sad", name: "Sad" },
  { id: "worried", name: "Worried" },
  { id: "raised", name: "Raised" },
  { id: "none", name: "None" },
];

export const LOOK_OPTS = {
  hair: [
    { name: "Sheet brown", hex: "#5c3a22" },
    { name: "Gold", hex: "#d4b05a" },
    { name: "Brown", hex: "#6a4228" },
    { name: "Black", hex: "#1a1410" },
    { name: "Red", hex: "#a83a28" },
    { name: "White", hex: "#e8e0d4" },
  ],
  skin: [
    { name: "Fair", hex: "#f0c8a8" },
    { name: "Tan", hex: "#e8b898" },
    { name: "Warm", hex: "#c48a62" },
    { name: "Deep", hex: "#8a5a38" },
    { name: "Dark", hex: "#5a3824" },
  ],
  eyes: [
    { name: "Sheet brown", hex: "#3a2418" },
    { name: "Green", hex: "#3a5a28" },
    { name: "Brown", hex: "#5a3a20" },
    { name: "Blue", hex: "#3a5a88" },
    { name: "Gray", hex: "#6a6a68" },
  ],
  tunic: [
    { name: "Boy green", hex: "#3d8a42" },
    { name: "Girl teal", hex: "#2f6a6a" },
    { name: "Blue", hex: "#3a6a88" },
    { name: "Red", hex: "#a83c38" },
    { name: "Purple", hex: "#6a4a78" },
    { name: "White", hex: "#e8e0d0" },
  ],
  pants: [
    { name: "Cream", hex: "#efe4cc" },
    { name: "Slate", hex: "#3a4a58" },
    { name: "Brown", hex: "#6a4a30" },
    { name: "Navy", hex: "#2a3a58" },
    { name: "Gray", hex: "#6a6864" },
  ],
  boots: [
    { name: "Brown", hex: "#5a3a22" },
    { name: "Black", hex: "#1a1410" },
    { name: "Tan", hex: "#8a6a40" },
  ],
  blush: [
    { name: "Peach", hex: "#c45c48" },
    { name: "Pink", hex: "#b04060" },
    { name: "Rose", hex: "#8a2438" },
    { name: "Coral", hex: "#a83828" },
    { name: "None", hex: "" },
  ],
} as const;
