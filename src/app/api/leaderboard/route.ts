// MathArena — Leaderboard API: top players by Elo (human + bots).
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { levelFromXp } from '@/lib/game/progression';

interface LeaderboardEntry {
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

export async function GET() {
  try {
    const players = await db.player.findMany({
      orderBy: { elo: 'desc' },
      take: 50,
    });

    const rows: LeaderboardEntry[] = players.map((p) => {
      const total = p.wins + p.losses;
      const winrate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
      return {
        id: p.id,
        name: p.name,
        elo: p.elo,
        level: levelFromXp(p.xp),
        wins: p.wins,
        losses: p.losses,
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
