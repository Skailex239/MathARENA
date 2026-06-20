import type { Accent } from "./types";

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
  name: string; // label FR
  tier: RankTier;
  emoji: string;
  min: number;
  color: string; // hex
}

// Spécification MathArena : Fer → Bronze → Argent → Or → Platine → Diamant → Maître → Grand Maître → Légende
// Couleurs de rang alignées sur le design system.
export const DIVISIONS: Division[] = [
  { name: "Fer", tier: "IRON", emoji: "⛓️", min: 0, color: "#8b8b8b" },
  { name: "Bronze", tier: "BRONZE", emoji: "🥉", min: 900, color: "#cd7f32" },
  { name: "Argent", tier: "SILVER", emoji: "🥈", min: 1100, color: "#c0c0c0" },
  { name: "Or", tier: "GOLD", emoji: "🥇", min: 1300, color: "#ffd700" },
  { name: "Platine", tier: "PLATINUM", emoji: "💎", min: 1500, color: "#00ced1" },
  { name: "Diamant", tier: "DIAMOND", emoji: "💠", min: 1700, color: "#b9f2ff" },
  { name: "Maître", tier: "MASTER", emoji: "🏆", min: 1900, color: "#9b59b6" },
  { name: "Grand Maître", tier: "GRANDMASTER", emoji: "👑", min: 2100, color: "#ff4500" },
  { name: "Légende", tier: "LEGEND", emoji: "🌟", min: 2300, color: "#ff0080" },
];

export function divisionFor(elo: number): Division {
  let d = DIVISIONS[0];
  for (const div of DIVISIONS) if (elo >= div.min) d = div;
  return d;
}

// compat: Accent mapping pour le code existant (utilisé par classes.ts)
export const ACCENT_BY_TIER: Record<string, Accent> = {
  IRON: "violet",
  BRONZE: "amber",
  SILVER: "violet",
  GOLD: "amber",
  PLATINUM: "emerald",
  DIAMOND: "emerald",
  MASTER: "violet",
  GRANDMASTER: "amber",
  LEGEND: "magenta",
};
