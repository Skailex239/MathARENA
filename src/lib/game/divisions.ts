import type { Accent } from "./types";

export interface Division {
  name: string;
  emoji: string;
  min: number;
  accent: Accent;
  color: string;
}

// Spécification MathArena : Fer → Bronze → Argent → Or → Platine → Diamant → Maître → Grand Maître → Légende
export const DIVISIONS: Division[] = [
  { name: "Fer", emoji: "⛓️", min: 0, accent: "violet", color: "#9a8fb0" },
  { name: "Bronze", emoji: "🥉", min: 900, accent: "amber", color: "#cd7f32" },
  { name: "Argent", emoji: "🥈", min: 1100, accent: "violet", color: "#c0c0d0" },
  { name: "Or", emoji: "🥇", min: 1300, accent: "amber", color: "#ffd24a" },
  { name: "Platine", emoji: "💎", min: 1500, accent: "emerald", color: "#3ddc84" },
  { name: "Diamant", emoji: "💠", min: 1700, accent: "magenta", color: "#ff3d8b" },
  { name: "Maître", emoji: "🏆", min: 1900, accent: "violet", color: "#b15cff" },
  { name: "Grand Maître", emoji: "👑", min: 2100, accent: "amber", color: "#ffb02e" },
  { name: "Légende", emoji: "🌟", min: 2300, accent: "magenta", color: "#ff3d8b" },
];

export function divisionFor(elo: number): Division {
  let d = DIVISIONS[0];
  for (const div of DIVISIONS) if (elo >= div.min) d = div;
  return d;
}
