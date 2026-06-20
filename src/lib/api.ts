import type { ClassId, GameMode } from "./game/types";
import type { Universe } from "./game/progression";

export interface Profile {
  id: number;
  name: string;
  // compétitif
  elo: number;            // alias eloCompetitive
  eloCompetitive: number;
  wins: number;
  losses: number;
  winrate: number;
  // arène
  eloArena: number;
  winsArena: number;
  lossesArena: number;
  winrateArena: number;
  bestCombo: number;
  // global
  level: number;
  xp: number;
  title: string | null;
  class: string | null;
  totalMatches: number;       // compétitif
  totalMatchesArena: number;
  levelInfo: { level: number; current: number; needed: number };
}

export interface MatchRecord {
  id: number;
  universe: Universe;
  playerClass: string | null;
  opponentClass: string | null;
  opponentName: string;
  result: "WIN" | "LOSE";
  playerHP: number;   // arène: PV ; compétitif: score
  opponentHP: number;
  maxCombo: number;
  avgTimeMs: number;
  accuracy: number;
  mode: string;
  eloChange: number;
  eloAfter: number;
  xpGained: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  elo: number;            // elo de l'univers sélectionné
  eloCompetitive: number;
  eloArena: number;
  level: number;
  wins: number;           // de l'univers sélectionné
  losses: number;
  winsArena: number;
  lossesArena: number;
  bestCombo: number;
  title: string | null;
  class: string | null;
  isBot: boolean;
  isMe: boolean;
  winrate: number;
}

export interface SaveMatchBody {
  universe: Universe;
  playerClass: ClassId | null;   // arène uniquement
  opponentClass: ClassId | null; // arène uniquement
  opponentName: string;
  result: "WIN" | "LOSE";
  playerHP: number;   // arène: PV ; compétitif: score
  opponentHP: number;
  maxCombo: number;   // arène uniquement
  avgTimeMs: number;
  accuracy: number;
  mode: GameMode;
}

export interface SaveMatchResponse {
  match: MatchRecord;
  profile: Profile;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getProfile: () => fetch("/api/profile").then(json<Profile>),
  patchProfile: (body: { name?: string; title?: string; class?: string }) =>
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<Profile>),
  getMatches: (limit = 50) =>
    fetch(`/api/matches?limit=${limit}`).then(json<MatchRecord[]>),
  saveMatch: (body: SaveMatchBody) =>
    fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<SaveMatchResponse>),
  getLeaderboard: (universe: Universe = "competitive") =>
    fetch(`/api/leaderboard?universe=${universe}`).then(json<LeaderboardEntry[]>),
};
