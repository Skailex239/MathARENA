import { create } from "zustand";
import type { ClassId, GameMode } from "./game/types";

export type View =
  | "home"
  | "classselect"
  | "duel"
  | "results"
  | "profile"
  | "leaderboard"
  | "rules";

export interface MatchResultPayload {
  result: "WIN" | "LOSE";
  playerClass: ClassId;
  opponentClass: ClassId;
  opponentName: string;
  playerHP: number;
  opponentHP: number;
  maxCombo: number;
  avgTimeMs: number;
  accuracy: number;
  mode: GameMode;
  /** réponse du serveur après sauvegarde du match */
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
  selectedClass: ClassId;
  selectedMode: GameMode;
  opponentClass: ClassId;
  opponentName: string;
  lastResult: MatchResultPayload | null;
  setView: (v: View) => void;
  setSelection: (c: ClassId, m: GameMode) => void;
  setOpponent: (c: ClassId, name: string) => void;
  setLastResult: (r: MatchResultPayload | null) => void;
}

export const useApp = create<AppState>((set) => ({
  view: "home",
  selectedClass: "guerrier",
  selectedMode: "QUICK",
  opponentClass: "mage",
  opponentName: "Vortex",
  lastResult: null,
  setView: (view) => set({ view }),
  setSelection: (selectedClass, selectedMode) => set({ selectedClass, selectedMode }),
  setOpponent: (opponentClass, opponentName) => set({ opponentClass, opponentName }),
  setLastResult: (lastResult) => set({ lastResult }),
}));
