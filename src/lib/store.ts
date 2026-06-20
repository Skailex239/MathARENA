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
  opponentName: string;
  playerScore: number;
  opponentScore: number;
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
  /** "competitive" | "arena" côté backend ; "arena" = Entraînement côté UI */
  universe: Universe;
  selectedClass: ClassId;
  selectedMode: GameMode;
  opponentClass: ClassId;
  opponentName: string;
  /** exercise d'entraînement sélectionné */
  trainingExercise: "vsia" | "sprint" | "category" | "daily" | "marathon";
  lastResult: MatchResultPayload | null;
  setView: (v: View) => void;
  setUniverse: (u: Universe) => void;
  setSelection: (c: ClassId, m: GameMode) => void;
  setOpponent: (c: ClassId, name: string) => void;
  setTrainingExercise: (e: "vsia" | "sprint" | "category" | "daily") => void;
  setLastResult: (r: MatchResultPayload | null) => void;
}

export const useApp = create<AppState>((set) => ({
  view: "home",
  universe: "competitive",
  selectedClass: "guerrier",
  selectedMode: "QUICK",
  opponentClass: "mage",
  opponentName: "Vortex",
  trainingExercise: "sprint",
  lastResult: null,
  setView: (view) => set({ view }),
  setUniverse: (universe) => set({ universe }),
  setSelection: (selectedClass, selectedMode) => set({ selectedClass, selectedMode }),
  setOpponent: (opponentClass, opponentName) => set({ opponentClass, opponentName }),
  setTrainingExercise: (trainingExercise) => set({ trainingExercise }),
  setLastResult: (lastResult) => set({ lastResult }),
}));
