// MathArena — Leaderboard API: top players by Elo (human + bots).
// Supports ?universe=competitive|arena (default: competitive).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { levelFromXp, type Universe } from '@/lib/game/progression';

interface LeaderboardEntry {
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

function isUniverse(v: string | null): v is Universe {
  return v === 'competitive' || v === 'arena';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get('universe');
    const universe: Universe = isUniverse(raw) ? raw : 'competitive';

    // Tri selon l'univers : compétitif → elo, arène → eloArena.
    const orderBy = universe === 'competitive' ? { elo: 'desc' as const } : { eloArena: 'desc' as const };

    const players = await db.player.findMany({
      orderBy,
      take: 50,
    });

    const rows: LeaderboardEntry[] = players.map((p) => {
      const wins = universe === 'competitive' ? p.wins : p.winsArena;
      const losses = universe === 'competitive' ? p.losses : p.lossesArena;
      const total = wins + losses;
      const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
      return {
        id: p.id,
        name: p.name,
        elo: universe === 'competitive' ? p.elo : p.eloArena,
        eloCompetitive: p.elo,
        eloArena: p.eloArena,
        level: levelFromXp(p.xp),
        wins,
        losses,
        winsArena: p.winsArena,
        lossesArena: p.lossesArena,
        bestCombo: p.bestCombo,
        title: p.title,
        class: p.class,
        isBot: p.isBot,
        isMe: p.id === 1,
        winrate,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[api/leaderboard GET] error', err);
    return NextResponse.json(
      { error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
