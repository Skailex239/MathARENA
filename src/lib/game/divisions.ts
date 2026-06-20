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
  { name: "Fer", tier: "IRON", min: 0, color: "#9c8e7a" },
  { name: "Bronze", tier: "BRONZE", min: 900, color: "#b5722e" },
  { name: "Argent", tier: "SILVER", min: 1100, color: "#7a7268" },
  { name: "Or", tier: "GOLD", min: 1300, color: "#c9974a" },
  { name: "Platine", tier: "PLATINUM", min: 1500, color: "#5e8a7a" },
  { name: "Diamant", tier: "DIAMOND", min: 1700, color: "#5a7a9c" },
  { name: "Maître", tier: "MASTER", min: 1900, color: "#8a6a9c" },
  { name: "Grand Maître", tier: "GRANDMASTER", min: 2100, color: "#d26f2a" },
  { name: "Légende", tier: "LEGEND", min: 2300, color: "#e8823d" },
];

export function divisionFor(elo: number): Division {
  let d = DIVISIONS[0];
  for (const div of DIVISIONS) if (elo >= div.min) d = div;
  return d;
}
