import { create } from "zustand";
import type { ClassId, GameMode } from "./game/types";
import type { Universe } from "./game/progression";

export type View =
  | "home"
  | "classselect"
  | "duel"
  | "results"
  | "profile"
  | "leaderboard"
  | "rules";

export interface MatchResultPayload {
  universe: Universe;
  result: "WIN" | "LOSE";
  playerClass: ClassId | null;   // arène uniquement
  opponentClass: ClassId | null; // arène uniquement
  opponentName: string;
  /** arène: PV restants ; compétitif: score du joueur */
  playerHP: number;
  opponentHP: number;
  maxCombo: number;              // arène uniquement
  avgTimeMs: number;
  accuracy: number;
  mode: GameMode;
  saved?: {
    eloChange: number;
    xpGained: number;
    newElo: number;
    newLevel: number;
    leveledUp: boolean;
  };
}

interface AppState {
  view: View;
  universe: Universe;
  selectedClass: ClassId;        // arène
  selectedMode: GameMode;
  opponentClass: ClassId;        // arène
  opponentName: string;
  lastResult: MatchResultPayload | null;
  setView: (v: View) => void;
  setUniverse: (u: Universe) => void;
  setSelection: (c: ClassId, m: GameMode) => void;
  setOpponent: (c: ClassId, name: string) => void;
  setLastResult: (r: MatchResultPayload | null) => void;
}

export const useApp = create<AppState>((set) => ({
  view: "home",
  universe: "competitive",
  selectedClass: "guerrier",
  selectedMode: "QUICK",
  opponentClass: "mage",
  opponentName: "Vortex",
  lastResult: null,
  setView: (view) => set({ view }),
  setUniverse: (universe) => set({ universe }),
  setSelection: (selectedClass, selectedMode) => set({ selectedClass, selectedMode }),
  setOpponent: (opponentClass, opponentName) => set({ opponentClass, opponentName }),
  setLastResult: (lastResult) => set({ lastResult }),
}));
