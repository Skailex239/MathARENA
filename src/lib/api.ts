import type { GameMode } from "./game/types";
import type { Universe } from "./game/progression";

export interface Profile {
  id: number;
  name: string;
  eloClassique: number;
  eloRapide: number;
  eloBlitz: number;
  winsClassique: number;
  lossesClassique: number;
  winsRapide: number;
  lossesRapide: number;
  winsBlitz: number;
  lossesBlitz: number;
  winrateClassique: number;
  winrateRapide: number;
  winrateBlitz: number;
  winsArena: number;
  lossesArena: number;
  level: number;
  xp: number;
  title: string | null;
  totalMatches: number;
  levelInfo: { level: number; current: number; needed: number };
}

export interface MatchRecord {
  id: number;
  universe: Universe;
  opponentName: string;
  result: "WIN" | "LOSE";
  playerScore: number;
  opponentScore: number;
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
  elo: number;
  eloClassique: number;
  eloRapide: number;
  eloBlitz: number;
  level: number;
  wins: number;
  losses: number;
  title: string | null;
  isBot: boolean;
  isMe: boolean;
  winrate: number;
}

export interface SaveMatchBody {
  universe: Universe;
  opponentName: string;
  result: "WIN" | "LOSE";
  playerScore: number;
  opponentScore: number;
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
  patchProfile: (body: { name?: string; title?: string | null }) =>
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
  getLeaderboard: (mode: "classique" | "rapide" | "blitz" = "classique") =>
    fetch(`/api/leaderboard?mode=${mode}`).then(json<LeaderboardEntry[]>),
};
