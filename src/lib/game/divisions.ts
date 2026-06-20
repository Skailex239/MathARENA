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
  { name: "Fer", tier: "IRON", min: 0, color: "#7a7164" },
  { name: "Bronze", tier: "BRONZE", min: 900, color: "#cd7f32" },
  { name: "Argent", tier: "SILVER", min: 1100, color: "#b8ae9e" },
  { name: "Or", tier: "GOLD", min: 1300, color: "#e5a847" },
  { name: "Platine", tier: "PLATINUM", min: 1500, color: "#6baa9c" },
  { name: "Diamant", tier: "DIAMOND", min: 1700, color: "#8ecae6" },
  { name: "Maître", tier: "MASTER", min: 1900, color: "#c8a8e9" },
  { name: "Grand Maître", tier: "GRANDMASTER", min: 2100, color: "#e5732a" },
  { name: "Légende", tier: "LEGEND", min: 2300, color: "#f5deb3" },
];

export function divisionFor(elo: number): Division {
  let d = DIVISIONS[0];
  for (const div of DIVISIONS) if (elo >= div.min) d = div;
  return d;
}
