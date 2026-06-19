// MathArena — Pure progression helpers (no Prisma, no side effects).

export type MatchResult = 'WIN' | 'LOSE';
export type GameMode = 'PRACTICE' | 'QUICK' | 'BLITZ' | 'RANKED';

/** XP needed to go from one level to the next. */
export const XP_PER_LEVEL = 400;

/** Compute the current level from total XP. Level starts at 1. */
export function levelFromXp(xp: number): number {
  return 1 + Math.floor(xp / 400);
}

/** Total XP required to *start* a given level (i.e. just reached it). */
export function xpForLevelStart(level: number): number {
  return (level - 1) * 400;
}

/** Total XP required to *reach* the next level (i.e. start of level+1). */
export function xpForNextLevel(level: number): number {
  return level * 400;
}

/**
 * Where the player is within their current level.
 * - `current` = XP accumulated since the level started (0..399).
 * - `needed` = XP required to advance to the next level (always 400).
 */
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
 * Elo change for a 1v1 duel. Only RANKED and BLITZ modes affect Elo.
 * Standard Elo formula with K-factor = 32.
 */
export function computeEloChange(
  playerElo: number,
  opponentElo: number,
  result: MatchResult,
  mode: string
): number {
  const eloApplies = mode === 'RANKED' || mode === 'BLITZ';
  if (!eloApplies) return 0;

  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = result === 'WIN' ? 1 : 0;
  return Math.round(32 * (actual - expected));
}

/**
 * XP gained for a duel. Base reward scaled by mode, plus combo & speed bonuses.
 * Practice matches do not grant combo/speed bonuses.
 */
export function computeXpGained(
  result: MatchResult,
  maxCombo: number,
  avgTimeMs: number,
  mode: string
): number {
  const base = mode === 'PRACTICE' ? (result === 'WIN' ? 30 : 10) : result === 'WIN' ? 100 : 30;

  const comboBonus = mode === 'PRACTICE' ? 0 : Math.min(maxCombo * 10, 100);

  const speedBonus =
    avgTimeMs > 0 && avgTimeMs < 3000 && mode !== 'PRACTICE' ? 20 : 0;

  return base + comboBonus + speedBonus;
}

/**
 * Structural view of a Player row — pure, no Prisma import required.
 * Anything that has these fields can be turned into a ProfileShape.
 */
export interface PlayerLike {
  id: number;
  name: string;
  elo: number;
  xp: number;
  wins: number;
  losses: number;
  bestCombo: number;
  title: string | null;
  class: string | null;
}

/** Shape returned to the client for the local player profile. */
export interface ProfileShape {
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

/** Convert any PlayerLike row into the API profile shape. Pure / no side effects. */
export function toProfile(p: PlayerLike): ProfileShape {
  const level = levelFromXp(p.xp);
  const totalMatches = p.wins + p.losses;
  const winrate = totalMatches > 0 ? Math.round((p.wins / totalMatches) * 100) : 0;
  return {
    id: p.id,
    name: p.name,
    elo: p.elo,
    level,
    xp: p.xp,
    wins: p.wins,
    losses: p.losses,
    bestCombo: p.bestCombo,
    title: p.title,
    class: p.class,
    winrate,
    totalMatches,
    levelInfo: {
      level,
      current: p.xp - xpForLevelStart(level),
      needed: XP_PER_LEVEL,
    },
  };
}
