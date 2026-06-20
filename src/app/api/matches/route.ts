// MathArena — Matches API: list match history (GET) and record a new duel (POST).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  computeEloChange,
  computeXpGained,
  levelFromXp,
  toProfile,
  type MatchResult,
  type GameMode,
} from '@/lib/game/progression';
import type { Match, Player } from '@prisma/client';

/** Public match shape returned to the client. */
interface MatchDto {
  id: number;
  playerClass: string;
  opponentClass: string;
  opponentName: string;
  result: string;
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

function toMatchDto(m: Match): MatchDto {
  return {
    id: m.id,
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
  playerClass: string;
  opponentClass: string;
  opponentName: string;
  result: MatchResult;
  playerHP: number;
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
  return (
    v === 'PRACTICE' || v === 'QUICK' || v === 'BLITZ' || v === 'RANKED'
  );
}

function validateBody(body: unknown): body is PostBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.playerClass === 'string' && b.playerClass.trim().length > 0 &&
    typeof b.opponentClass === 'string' && b.opponentClass.trim().length > 0 &&
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
      create: { id: 1, isBot: false, name: 'Joueur', elo: 1000 },
      update: {},
    });

    // Opponent is pair-matched at the player's current Elo.
    const opponentElo = player.elo;
    const eloChange = computeEloChange(player.elo, opponentElo, body.result, body.mode);
    const xpGained = computeXpGained(body.result, body.maxCombo, body.avgTimeMs, body.mode);

    const newElo = player.elo + eloChange;
    const newXp = player.xp + xpGained;
    const newWins = player.wins + (body.result === 'WIN' ? 1 : 0);
    const newLosses = player.losses + (body.result === 'LOSE' ? 1 : 0);
    const newBestCombo = Math.max(player.bestCombo, body.maxCombo);
    const newLevel = levelFromXp(newXp);

    // Create the Match row first, then update the player — atomically.
    const [createdMatch, updatedPlayer] = await db.$transaction([
      db.match.create({
        data: {
          playerId: 1,
          playerClass: body.playerClass,
          opponentClass: body.opponentClass,
          opponentName: body.opponentName,
          result: body.result,
          playerHP: body.playerHP,
          opponentHP: body.opponentHP,
          maxCombo: body.maxCombo,
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
        data: {
          elo: newElo,
          xp: newXp,
          level: newLevel,
          wins: newWins,
          losses: newLosses,
          bestCombo: newBestCombo,
        },
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
