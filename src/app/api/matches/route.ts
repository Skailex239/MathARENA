// MathArena — Matches API: list match history (GET) and record a new duel (POST).
// Compétitif : 3 modes avec Elo séparé par mode (Classique/Rapide/Blitz).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  computeEloChange,
  computeXpGained,
  levelFromXp,
  modeEloFields,
  toProfile,
  type MatchResult,
  type GameMode,
  type Universe,
} from '@/lib/game/progression';
import type { Match, Player } from '@prisma/client';

interface MatchDto {
  id: number;
  universe: Universe;
  opponentName: string;
  result: string;
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

function toMatchDto(m: Match): MatchDto {
  return {
    id: m.id,
    universe: (m.universe as Universe) ?? 'competitive',
    opponentName: m.opponentName,
    result: m.result,
    playerScore: m.playerScore,
    opponentScore: m.opponentScore,
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
      if (Number.isFinite(parsed) && parsed > 0) limit = Math.min(parsed, 200);
    }
    const matches = await db.match.findMany({
      where: { playerId: 1 },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json(matches.map(toMatchDto));
  } catch (err) {
    console.error('[api/matches GET] error', err);
    return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 });
  }
}

interface PostBody {
  universe: Universe;
  opponentName: string;
  result: MatchResult;
  playerScore: number;
  opponentScore: number;
  avgTimeMs: number;
  accuracy: number;
  mode: GameMode;
}

function isMatchResult(v: unknown): v is MatchResult { return v === 'WIN' || v === 'LOSE'; }
function isGameMode(v: unknown): v is GameMode {
  return v === 'PRACTICE' || v === 'QUICK' || v === 'BLITZ' || v === 'RANKED';
}
function isUniverse(v: unknown): v is Universe { return v === 'competitive' || v === 'arena'; }

function validateBody(body: unknown): body is PostBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    isUniverse(b.universe) &&
    typeof b.opponentName === 'string' && b.opponentName.trim().length > 0 &&
    isMatchResult(b.result) &&
    typeof b.playerScore === 'number' && Number.isFinite(b.playerScore) &&
    typeof b.opponentScore === 'number' && Number.isFinite(b.opponentScore) &&
    typeof b.avgTimeMs === 'number' && Number.isFinite(b.avgTimeMs) && b.avgTimeMs >= 0 &&
    typeof b.accuracy === 'number' && Number.isFinite(b.accuracy) &&
    isGameMode(b.mode)
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!validateBody(body)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }
    const player: Player = await db.player.upsert({
      where: { id: 1 },
      create: { id: 1, isBot: false, name: 'Joueur', eloClassique: 1000, eloRapide: 1000, eloBlitz: 1000 },
      update: {},
    });

    const isCompetitive = body.universe === 'competitive';
    const eloChange = isCompetitive
      ? computeEloChange(
          player[modeEloFields(body.mode).elo],
          player[modeEloFields(body.mode).elo], // adversaire pairé au même Elo
          body.result,
          body.mode,
          body.universe,
        )
      : 0;
    const xpGained = computeXpGained(body.result, 0, body.avgTimeMs, body.mode, body.universe);
    const newElo = (isCompetitive ? player[modeEloFields(body.mode).elo] : 1000) + eloChange;
    const newXp = player.xp + xpGained;
    const newLevel = levelFromXp(newXp);

    const playerUpdate: Record<string, unknown> = { xp: newXp, level: newLevel };
    if (isCompetitive) {
      const f = modeEloFields(body.mode);
      playerUpdate[f.elo] = newElo;
      playerUpdate[f.wins] = (player[f.wins] as number) + (body.result === 'WIN' ? 1 : 0);
      playerUpdate[f.losses] = (player[f.losses] as number) + (body.result === 'LOSE' ? 1 : 0);
    } else {
      playerUpdate.winsArena = player.winsArena + (body.result === 'WIN' ? 1 : 0);
      playerUpdate.lossesArena = player.lossesArena + (body.result === 'LOSE' ? 1 : 0);
    }

    const [createdMatch, updatedPlayer] = await db.$transaction([
      db.match.create({
        data: {
          playerId: 1,
          universe: body.universe,
          opponentName: body.opponentName,
          result: body.result,
          playerScore: body.playerScore,
          opponentScore: body.opponentScore,
          avgTimeMs: body.avgTimeMs,
          accuracy: body.accuracy,
          mode: body.mode,
          eloChange,
          eloAfter: newElo,
          xpGained,
        },
      }),
      db.player.update({ where: { id: 1 }, data: playerUpdate }),
    ]);

    return NextResponse.json({ match: toMatchDto(createdMatch), profile: toProfile(updatedPlayer) });
  } catch (err) {
    console.error('[api/matches POST] error', err);
    return NextResponse.json({ error: 'Failed to record match' }, { status: 500 });
  }
}
