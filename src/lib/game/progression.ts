// MathArena — Pure progression helpers (no Prisma, no side effects).
// Compétitif : 3 modes (Classique/Rapide/Blitz) avec Elo séparé par mode.
// Entraînement : sans Elo.

export type MatchResult = 'WIN' | 'LOSE';
export type GameMode = 'PRACTICE' | 'QUICK' | 'BLITZ' | 'RANKED';
export type Universe = 'competitive' | 'arena';

/** XP needed to go from one level to the next. */
export const XP_PER_LEVEL = 400;

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(xp / 400);
}
export function xpForLevelStart(level: number): number {
  return (level - 1) * 400;
}
export function xpForNextLevel(level: number): number {
  return level * 400;
}
export function xpProgressInLevel(xp: number): { current: number; needed: number; level: number } {
  const level = levelFromXp(xp);
  const current = xp - xpForLevelStart(level);
  return { current, needed: XP_PER_LEVEL, level };
}

/**
 * Elo change for a 1v1 duel. K-factor = 32.
 * - Compétitif : l'Elo s'applique toujours (sauf PRACTICE), routé vers le bon Elo par mode.
 * - Entraînement (arena) : pas d'Elo.
 */
export function computeEloChange(
  playerElo: number,
  opponentElo: number,
  result: MatchResult,
  mode: string,
  universe: Universe = 'competitive'
): number {
  if (universe === 'arena') return 0; // Entraînement = pas d'Elo
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = result === 'WIN' ? 1 : 0;
  return Math.round(32 * (actual - expected));
}

/** XP gained for a duel. */
export function computeXpGained(
  result: MatchResult,
  _maxCombo: number,
  avgTimeMs: number,
  mode: string,
  universe: Universe = 'competitive'
): number {
  const base = universe === 'arena'
    ? (result === 'WIN' ? 30 : 10)
    : (result === 'WIN' ? 100 : 30);
  const speedBonus = avgTimeMs > 0 && avgTimeMs < 3000 ? 20 : 0;
  return base + speedBonus;
}

/** Structural view of a Player row. */
export interface PlayerLike {
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
  winsArena: number;
  lossesArena: number;
  xp: number;
  title: string | null;
}

/** Shape returned to the client for the local player profile. */
export interface ProfileShape {
  id: number;
  name: string;
  // 3 elos compétitifs
  eloClassique: number;
  eloRapide: number;
  eloBlitz: number;
  // wins/losses par mode
  winsClassique: number;
  lossesClassique: number;
  winsRapide: number;
  lossesRapide: number;
  winsBlitz: number;
  lossesBlitz: number;
  winrateClassique: number;
  winrateRapide: number;
  winrateBlitz: number;
  // entraînement
  winsArena: number;
  lossesArena: number;
  // global
  level: number;
  xp: number;
  title: string | null;
  totalMatches: number;
  levelInfo: { level: number; current: number; needed: number };
}

function wr(wins: number, losses: number): number {
  const t = wins + losses;
  return t > 0 ? Math.round((wins / t) * 100) : 0;
}

export function toProfile(p: PlayerLike): ProfileShape {
  const level = levelFromXp(p.xp);
  return {
    id: p.id,
    name: p.name,
    eloClassique: p.eloClassique,
    eloRapide: p.eloRapide,
    eloBlitz: p.eloBlitz,
    winsClassique: p.winsClassique,
    lossesClassique: p.lossesClassique,
    winsRapide: p.winsRapide,
    lossesRapide: p.lossesRapide,
    winsBlitz: p.winsBlitz,
    lossesBlitz: p.lossesBlitz,
    winrateClassique: wr(p.winsClassique, p.lossesClassique),
    winrateRapide: wr(p.winsRapide, p.lossesRapide),
    winrateBlitz: wr(p.winsBlitz, p.lossesBlitz),
    winsArena: p.winsArena,
    lossesArena: p.lossesArena,
    level,
    xp: p.xp,
    title: p.title,
    totalMatches: p.winsClassique + p.lossesClassique + p.winsRapide + p.lossesRapide + p.winsBlitz + p.lossesBlitz,
    levelInfo: { level, current: p.xp - xpForLevelStart(level), needed: XP_PER_LEVEL },
  };
}

/** Retourne le champ Elo et wins/losses selon le mode compétitif. */
export function modeEloFields(mode: string): {
  elo: keyof Pick<PlayerLike, 'eloClassique' | 'eloRapide' | 'eloBlitz'>;
  wins: keyof Pick<PlayerLike, 'winsClassique' | 'winsRapide' | 'winsBlitz'>;
  losses: keyof Pick<PlayerLike, 'lossesClassique' | 'lossesRapide' | 'lossesBlitz'>;
} {
  if (mode === 'QUICK') return { elo: 'eloRapide', wins: 'winsRapide', losses: 'lossesRapide' };
  if (mode === 'BLITZ') return { elo: 'eloBlitz', wins: 'winsBlitz', losses: 'lossesBlitz' };
  return { elo: 'eloClassique', wins: 'winsClassique', losses: 'lossesClassique' };
}
