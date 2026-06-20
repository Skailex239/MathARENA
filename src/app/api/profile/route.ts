// MathArena — Profile API: get/upsert local human player, seed bots, PATCH profile fields.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toProfile } from '@/lib/game/progression';
import type { Player } from '@prisma/client';

/** Idempotently create the 11 leaderboard bots if none exist yet. */
async function ensureBotsSeeded(): Promise<void> {
  const botCount = await db.player.count({ where: { isBot: true } });
  if (botCount > 0) return;

  // Seeds : elo = compétitif, eloArena = arène (légèrement différent pour du réalisme).
  const seeds: Array<{
    name: string;
    elo: number;
    eloArena: number;
    class: string;
    wins: number;
    losses: number;
    winsArena: number;
    lossesArena: number;
    bestCombo: number;
    title: string | null;
  }> = [
    { name: 'NeuroBlade', elo: 1480, eloArena: 1390, class: 'assassin', wins: 142, losses: 38, winsArena: 110, lossesArena: 52, bestCombo: 14, title: 'Inarrêtable' },
    { name: 'PyroMath', elo: 1410, eloArena: 1460, class: 'mage', wins: 120, losses: 50, winsArena: 132, lossesArena: 44, bestCombo: 12, title: 'Roi du blitz' },
    { name: 'ZeroChill', elo: 1355, eloArena: 1200, class: 'gardien', wins: 98, losses: 44, winsArena: 70, lossesArena: 60, bestCombo: 9, title: 'Cerveau de fer' },
    { name: 'Vortex', elo: 1290, eloArena: 1330, class: 'assassin', wins: 110, losses: 60, winsArena: 100, lossesArena: 58, bestCombo: 11, title: 'Calculateur fou' },
    { name: 'CalcQueen', elo: 1230, eloArena: 1280, class: 'mage', wins: 88, losses: 52, winsArena: 96, lossesArena: 50, bestCombo: 10, title: 'Machine humaine' },
    { name: 'PrimeTime', elo: 1180, eloArena: 1140, class: 'guerrier', wins: 76, losses: 58, winsArena: 64, lossesArena: 62, bestCombo: 8, title: null },
    { name: 'Hexa', elo: 1120, eloArena: 1090, class: 'alchimiste', wins: 64, losses: 60, winsArena: 60, lossesArena: 64, bestCombo: 8, title: null },
    { name: 'Quanta', elo: 1060, eloArena: 1040, class: 'gardien', wins: 55, losses: 62, winsArena: 50, lossesArena: 66, bestCombo: 7, title: null },
    { name: 'Sigma', elo: 1000, eloArena: 1000, class: 'guerrier', wins: 48, losses: 66, winsArena: 44, lossesArena: 70, bestCombo: 6, title: null },
    { name: 'Omega', elo: 940, eloArena: 960, class: 'alchimiste', wins: 40, losses: 70, winsArena: 38, lossesArena: 72, bestCombo: 6, title: null },
    { name: 'Infinix', elo: 870, eloArena: 900, class: 'mage', wins: 30, losses: 78, winsArena: 28, lossesArena: 80, bestCombo: 5, title: null },
  ];

  await db.$transaction(
    seeds.map((b) => {
      const approxLevel = 1 + Math.floor(b.wins / 4);
      const xp = (approxLevel - 1) * 400;
      return db.player.create({
        data: {
          isBot: true,
          name: b.name,
          elo: b.elo,
          eloArena: b.eloArena,
          class: b.class,
          wins: b.wins,
          losses: b.losses,
          winsArena: b.winsArena,
          lossesArena: b.lossesArena,
          bestCombo: b.bestCombo,
          title: b.title,
          xp,
          level: approxLevel,
        },
      });
    })
  );
}

/** Upsert the local human player (id=1). */
async function ensureHumanPlayer(): Promise<Player> {
  return db.player.upsert({
    where: { id: 1 },
    create: { id: 1, isBot: false, name: 'Joueur', elo: 1000, eloArena: 1000 },
    update: {},
  });
}

export async function GET() {
  try {
    await ensureHumanPlayer();
    await ensureBotsSeeded();

    const player = await db.player.findUniqueOrThrow({ where: { id: 1 } });
    return NextResponse.json(toProfile(player));
  } catch (err) {
    console.error('[api/profile GET] error', err);
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    );
  }
}

interface PatchBody {
  name?: string;
  title?: string | null;
  class?: string | null;
}

export async function PATCH(req: NextRequest) {
  try {
    let body: PatchBody;
    try {
      body = (await req.json()) as PatchBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Missing body' }, { status: 400 });
    }

    const data: { name?: string; title?: string | null; class?: string | null } = {};

    if (typeof body.name === 'string' && body.name.trim().length > 0) {
      data.name = body.name.trim();
    }
    if (body.title !== undefined) {
      data.title =
        typeof body.title === 'string' && body.title.trim().length > 0
          ? body.title.trim()
          : null;
    }
    if (body.class !== undefined) {
      data.class =
        typeof body.class === 'string' && body.class.trim().length > 0
          ? body.class.trim()
          : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No updatable fields provided' },
        { status: 400 }
      );
    }

    await ensureHumanPlayer();
    const updated = await db.player.update({
      where: { id: 1 },
      data,
    });
    return NextResponse.json(toProfile(updated));
  } catch (err) {
    console.error('[api/profile PATCH] error', err);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
