// MathArena — Leaderboard API: top players by Elo (human + bots).
// ?mode=classique|rapide|blitz (default: classique).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { levelFromXp, type Universe } from '@/lib/game/progression';

interface LeaderboardEntry {
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

type Mode = 'classique' | 'rapide' | 'blitz';
function isMode(v: string | null): v is Mode {
  return v === 'classique' || v === 'rapide' || v === 'blitz';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode: Mode = isMode(searchParams.get('mode')) ? (searchParams.get('mode') as Mode) : 'classique';

    const eloField = mode === 'rapide' ? 'eloRapide' : mode === 'blitz' ? 'eloBlitz' : 'eloClassique';
    const winsField = mode === 'rapide' ? 'winsRapide' : mode === 'blitz' ? 'winsBlitz' : 'winsClassique';
    const lossesField = mode === 'rapide' ? 'lossesRapide' : mode === 'blitz' ? 'lossesBlitz' : 'lossesClassique';

    const players = await db.player.findMany({
      orderBy: { [eloField]: 'desc' },
      take: 50,
    });

    const rows: LeaderboardEntry[] = players.map((p) => {
      const wins = p[winsField as keyof typeof p] as number;
      const losses = p[lossesField as keyof typeof p] as number;
      const total = wins + losses;
      const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
      return {
        id: p.id,
        name: p.name,
        elo: p[eloField as keyof typeof p] as number,
        eloClassique: p.eloClassique,
        eloRapide: p.eloRapide,
        eloBlitz: p.eloBlitz,
        level: levelFromXp(p.xp),
        wins,
        losses,
        title: p.title,
        isBot: p.isBot,
        isMe: p.id === 1,
        winrate,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[api/leaderboard GET] error', err);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
