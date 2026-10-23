export type HairStyle = "bun" | "curly" | "spacebuns" | "none" | "bob";

export interface Character {
  id: string;
  name: string;
  tagline: string;
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: HairStyle;
  outfit: string;
  outfitAccent: string;
  eye: string;
  cheek: string;
  /** Glow colour used for UI accents when this character is active. */
  aura: string;
  extras?: { ears?: "cat" | "none"; antenna?: boolean; glasses?: boolean; robot?: boolean };
}

export const CHARACTERS: Character[] = [
  {
    id: "pip",
    name: "Pip",
    tagline: "Bubbly, fast fingers, loves greetings",
    skin: "#f6c8a8",
    skinShade: "#e3a985",
    hair: "#ff4fa3",
    hairStyle: "bun",
    outfit: "#7c3aed",
    outfitAccent: "#fbbf24",
    eye: "#2b1840",
    cheek: "#ff8fb8",
    aura: "#ff4fa3",
  },
  {
    id: "kai",
    name: "Kai",
    tagline: "Chill teacher, patient with beginners",
    skin: "#8d5a3b",
    skinShade: "#6f4329",
    hair: "#1d1b2f",
    hairStyle: "curly",
    outfit: "#06b6d4",
    outfitAccent: "#f472b6",
    eye: "#140c06",
    cheek: "#c26b55",
    aura: "#22d3ee",
    extras: { glasses: true },
  },
  {
    id: "nova",
    name: "Nova",
    tagline: "Big expressions, storyteller energy",
    skin: "#c98e63",
    skinShade: "#a8704a",
    hair: "#8b5cf6",
    hairStyle: "spacebuns",
    outfit: "#f59e0b",
    outfitAccent: "#10b981",
    eye: "#1f1233",
    cheek: "#e98a7a",
    aura: "#a78bfa",
  },
  {
    id: "bolt",
    name: "Bolt",
    tagline: "Precise robot, perfect handshapes",
    skin: "#b8c4d9",
    skinShade: "#8e9bb3",
    hair: "#60a5fa",
    hairStyle: "none",
    outfit: "#2563eb",
    outfitAccent: "#facc15",
    eye: "#38f9d7",
    cheek: "#7dd3fc",
    aura: "#38f9d7",
    extras: { antenna: true, robot: true },
  },
  {
    id: "mochi",
    name: "Mochi",
    tagline: "Curious cat, learns a new sign every day",
    skin: "#ffd9a8",
    skinShade: "#f2b77a",
    hair: "#ff9a3c",
    hairStyle: "bob",
    outfit: "#ec4899",
    outfitAccent: "#a3e635",
    eye: "#2a1a0a",
    cheek: "#ffa3a3",
    aura: "#fb923c",
    extras: { ears: "cat" },
  },
];

export function getCharacter(id: string | null | undefined): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
