export type RankTier =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "LEGEND";

export interface Division {
  name: string;
  tier: RankTier;
  min: number;
  /** couleur de rang, utilisée de façon subtile (texte + bordure fine) */
  color: string;
}

// 9 divisions Fer → Légende. Couleurs appliquées sobrement (texte + bordure, jamais en fond saturé).
export const DIVISIONS: Division[] = [
  { name: "Fer", tier: "IRON", min: 0, color: "#9ba4b0" },
  { name: "Bronze", tier: "BRONZE", min: 900, color: "#cd7f32" },
  { name: "Argent", tier: "SILVER", min: 1100, color: "#c0c0c0" },
  { name: "Or", tier: "GOLD", min: 1300, color: "#d29922" },
  { name: "Platine", tier: "PLATINUM", min: 1500, color: "#2ea6a6" },
  { name: "Diamant", tier: "DIAMOND", min: 1700, color: "#5fb3d4" },
  { name: "Maître", tier: "MASTER", min: 1900, color: "#8a7bf0" },
  { name: "Grand Maître", tier: "GRANDMASTER", min: 2100, color: "#e8744a" },
  { name: "Légende", tier: "LEGEND", min: 2300, color: "#e85aa0" },
];

export function divisionFor(elo: number): Division {
  let d = DIVISIONS[0];
  for (const div of DIVISIONS) if (elo >= div.min) d = div;
  return d;
}
