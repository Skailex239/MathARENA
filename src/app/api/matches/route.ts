// MathArena — Matches API: list match history (GET) and record a new duel (POST).
// Supports two universes: "competitive" (pure skill) & "arena" (gaming).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  computeEloChange,
  computeXpGained,
  levelFromXp,
  toProfile,
  type MatchResult,
  type GameMode,
  type Universe,
} from '@/lib/game/progression';
import type { Match, Player } from '@prisma/client';

/** Public match shape returned to the client. */
interface MatchDto {
  id: number;
  universe: Universe;
  playerClass: string | null;
  opponentClass: string | null;
  opponentName: string;
  result: string;
  playerHP: number;   // arène: PV restants ; compétitif: score joueur
  opponentHP: number; // arène: PV restants ; compétitif: score adverse
  maxCombo: number;
  avgTimeMs: number;
  accuracy: number;
  mode: string;
  eloChange: number;
  eloAfter: number;
  xpGained: number;
  createdAt: string;
}

function toMatchDto(m: Match): MatchDto {
  return {
    id: m.id,
    universe: (m.universe as Universe) ?? 'competitive',
    playerClass: m.playerClass,
    opponentClass: m.opponentClass,
    opponentName: m.opponentName,
    result: m.result,
    playerHP: m.playerHP,
    opponentHP: m.opponentHP,
    maxCombo: m.maxCombo,
    avgTimeMs: m.avgTimeMs,
    accuracy: m.accuracy,
    mode: m.mode,
    eloChange: m.eloChange,
    eloAfter: m.eloAfter,
    xpGained: m.xpGained,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawLimit = searchParams.get('limit');
    let limit = 50;
    if (rawLimit !== null) {
      const parsed = Number.parseInt(rawLimit, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(parsed, 200);
      }
    }

    const matches = await db.match.findMany({
      where: { playerId: 1 },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(matches.map(toMatchDto));
  } catch (err) {
    console.error('[api/matches GET] error', err);
    return NextResponse.json(
      { error: 'Failed to load matches' },
      { status: 500 }
    );
  }
}

interface PostBody {
  universe: Universe;
  playerClass: string | null; // arène uniquement
  opponentClass: string | null;
  opponentName: string;
  result: MatchResult;
  playerHP: number;   // arène: PV ; compétitif: score
  opponentHP: number;
  maxCombo: number;
  avgTimeMs: number;
  accuracy: number;
  mode: GameMode;
}

function isMatchResult(v: unknown): v is MatchResult {
  return v === 'WIN' || v === 'LOSE';
}
function isGameMode(v: unknown): v is GameMode {
  return v === 'PRACTICE' || v === 'QUICK' || v === 'BLITZ' || v === 'RANKED';
}
function isUniverse(v: unknown): v is Universe {
  return v === 'competitive' || v === 'arena';
}

function validateBody(body: unknown): body is PostBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    isUniverse(b.universe) &&
    (b.playerClass === null || typeof b.playerClass === 'string') &&
    (b.opponentClass === null || typeof b.opponentClass === 'string') &&
    typeof b.opponentName === 'string' && b.opponentName.trim().length > 0 &&
    isMatchResult(b.result) &&
    typeof b.playerHP === 'number' && Number.isFinite(b.playerHP) &&
    typeof b.opponentHP === 'number' && Number.isFinite(b.opponentHP) &&
    typeof b.maxCombo === 'number' && Number.isFinite(b.maxCombo) && b.maxCombo >= 0 &&
    typeof b.avgTimeMs === 'number' && Number.isFinite(b.avgTimeMs) && b.avgTimeMs >= 0 &&
    typeof b.accuracy === 'number' && Number.isFinite(b.accuracy) &&
    isGameMode(b.mode)
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!validateBody(body)) {
      return NextResponse.json(
        { error: 'Missing or invalid fields in request body' },
        { status: 400 }
      );
    }

    const player: Player = await db.player.upsert({
      where: { id: 1 },
      create: { id: 1, isBot: false, name: 'Joueur', elo: 1000, eloArena: 1000 },
      update: {},
    });

    const isCompetitive = body.universe === 'competitive';

    // Elo concerné selon l'univers ; adversaire pairé sur ce même Elo.
    const relevantElo = isCompetitive ? player.elo : player.eloArena;
    const opponentElo = relevantElo;
    const eloChange = computeEloChange(relevantElo, opponentElo, body.result, body.mode, body.universe);
    const xpGained = computeXpGained(body.result, body.maxCombo, body.avgTimeMs, body.mode, body.universe);

    const newElo = relevantElo + eloChange;
    const newXp = player.xp + xpGained;
    const newLevel = levelFromXp(newXp);

    // Prépare l'update du joueur selon l'univers.
    const playerUpdate: Record<string, unknown> = {
      xp: newXp,
      level: newLevel,
    };
    if (isCompetitive) {
      playerUpdate.elo = newElo;
      playerUpdate.wins = player.wins + (body.result === 'WIN' ? 1 : 0);
      playerUpdate.losses = player.losses + (body.result === 'LOSE' ? 1 : 0);
    } else {
      playerUpdate.eloArena = newElo;
      playerUpdate.winsArena = player.winsArena + (body.result === 'WIN' ? 1 : 0);
      playerUpdate.lossesArena = player.lossesArena + (body.result === 'LOSE' ? 1 : 0);
      playerUpdate.bestCombo = Math.max(player.bestCombo, body.maxCombo);
    }

    const [createdMatch, updatedPlayer] = await db.$transaction([
      db.match.create({
        data: {
          playerId: 1,
          universe: body.universe,
          playerClass: isCompetitive ? null : body.playerClass,
          opponentClass: isCompetitive ? null : body.opponentClass,
          opponentName: body.opponentName,
          result: body.result,
          playerHP: body.playerHP,
          opponentHP: body.opponentHP,
          maxCombo: isCompetitive ? 0 : body.maxCombo,
          avgTimeMs: body.avgTimeMs,
          accuracy: body.accuracy,
          mode: body.mode,
          eloChange,
          eloAfter: newElo,
          xpGained,
        },
      }),
      db.player.update({
        where: { id: 1 },
        data: playerUpdate,
      }),
    ]);

    return NextResponse.json({
      match: toMatchDto(createdMatch),
      profile: toProfile(updatedPlayer),
    });
  } catch (err) {
    console.error('[api/matches POST] error', err);
    return NextResponse.json(
      { error: 'Failed to record match' },
      { status: 500 }
    );
  }
}
