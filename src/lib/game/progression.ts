// MathArena — Pure progression helpers (no Prisma, no side effects).
// Two universes: "competitive" (pure skill, official Elo) & "arena" (gaming).

export type MatchResult = 'WIN' | 'LOSE';
export type GameMode = 'PRACTICE' | 'QUICK' | 'BLITZ' | 'RANKED';
export type Universe = 'competitive' | 'arena';

/** XP needed to go from one level to the next. */
export const XP_PER_LEVEL = 400;

/** Compute the current level from total XP. Level starts at 1. */
export function levelFromXp(xp: number): number {
  return 1 + Math.floor(xp / 400);
}

/** Total XP required to *start* a given level. */
export function xpForLevelStart(level: number): number {
  return (level - 1) * 400;
}

/** Total XP required to *reach* the next level. */
export function xpForNextLevel(level: number): number {
  return level * 400;
}

/** Where the player is within their current level. */
export function xpProgressInLevel(xp: number): {
  current: number;
  needed: number;
  level: number;
} {
  const level = levelFromXp(xp);
  const current = xp - xpForLevelStart(level);
  return { current, needed: XP_PER_LEVEL, level };
}

/**
 * Elo change for a 1v1 duel. K-factor = 32.
 * - Compétitif : l'Elo s'applique à TOUS les modes (officiel), sauf PRACTICE.
 * - Arène : l'Elo s'applique seulement en RANKED et BLITZ.
 */
export function computeEloChange(
  playerElo: number,
  opponentElo: number,
  result: MatchResult,
  mode: string,
  universe: Universe = 'competitive'
): number {
  if (mode === 'PRACTICE') return 0;
  const eloApplies =
    universe === 'competitive' ? true : mode === 'RANKED' || mode === 'BLITZ';
  if (!eloApplies) return 0;

  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = result === 'WIN' ? 1 : 0;
  return Math.round(32 * (actual - expected));
}

/**
 * XP gained for a duel. Base reward scaled by mode, plus combo & speed bonuses.
 * Compétitif : pas de bonus combo (pas de combos), bonus vitesse accru.
 */
export function computeXpGained(
  result: MatchResult,
  maxCombo: number,
  avgTimeMs: number,
  mode: string,
  universe: Universe = 'competitive'
): number {
  const base = mode === 'PRACTICE' ? (result === 'WIN' ? 30 : 10) : result === 'WIN' ? 100 : 30;
  const comboBonus = universe === 'arena' && mode !== 'PRACTICE' ? Math.min(maxCombo * 10, 100) : 0;
  const speedBonus = avgTimeMs > 0 && avgTimeMs < 3000 && mode !== 'PRACTICE' ? 20 : 0;
  return base + comboBonus + speedBonus;
}

/** Structural view of a Player row. */
export interface PlayerLike {
  id: number;
  name: string;
  elo: number;          // compétitif
  eloArena: number;     // arène
  xp: number;
  wins: number;         // compétitif
  losses: number;       // compétitif
  winsArena: number;
  lossesArena: number;
  bestCombo: number;    // arène
  title: string | null;
  class: string | null; // arène
}

/** Shape returned to the client for the local player profile. */
export interface ProfileShape {
  id: number;
  name: string;
  // compétitif
  elo: number;            // = eloCompetitive (alias pour rétrocompat)
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
  totalMatches: number;   // compétitif
  totalMatchesArena: number;
  levelInfo: { level: number; current: number; needed: number };
}

/** Convert any PlayerLike row into the API profile shape. Pure / no side effects. */
export function toProfile(p: PlayerLike): ProfileShape {
  const level = levelFromXp(p.xp);
  const totalMatches = p.wins + p.losses;
  const totalMatchesArena = p.winsArena + p.lossesArena;
  const winrate = totalMatches > 0 ? Math.round((p.wins / totalMatches) * 100) : 0;
  const winrateArena = totalMatchesArena > 0 ? Math.round((p.winsArena / totalMatchesArena) * 100) : 0;
  return {
    id: p.id,
    name: p.name,
    elo: p.elo,
    eloCompetitive: p.elo,
    wins: p.wins,
    losses: p.losses,
    winrate,
    eloArena: p.eloArena,
    winsArena: p.winsArena,
    lossesArena: p.lossesArena,
    winrateArena,
    bestCombo: p.bestCombo,
    level,
    xp: p.xp,
    title: p.title,
    class: p.class,
    totalMatches,
    totalMatchesArena,
    levelInfo: {
      level,
      current: p.xp - xpForLevelStart(level),
      needed: XP_PER_LEVEL,
    },
  };
}
