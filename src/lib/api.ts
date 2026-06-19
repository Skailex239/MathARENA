import type { ClassId, GameMode } from "./game/types";

export interface Profile {
  id: number;
  name: string;
  elo: number;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  bestCombo: number;
  title: string | null;
  class: string | null;
  winrate: number;
  totalMatches: number;
  levelInfo: { level: number; current: number; needed: number };
}

export interface MatchRecord {
  id: number;
  playerClass: string;
  opponentClass: string;
  opponentName: string;
  result: "WIN" | "LOSE";
  playerHP: number;
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
  elo: number;
  level: number;
  wins: number;
  losses: number;
  bestCombo: number;
  title: string | null;
  class: string | null;
  isBot: boolean;
  isMe: boolean;
  winrate: number;
}

export interface SaveMatchBody {
  playerClass: ClassId;
  opponentClass: ClassId;
  opponentName: string;
  result: "WIN" | "LOSE";
  playerHP: number;
  opponentHP: number;
  maxCombo: number;
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
  getLeaderboard: () => fetch("/api/leaderboard").then(json<LeaderboardEntry[]>),
};
