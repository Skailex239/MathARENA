// MathArena — Profile API: get/upsert local human player, seed bots, PATCH profile fields.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toProfile } from '@/lib/game/progression';
import type { Player } from '@prisma/client';

/** Idempotently create the 11 leaderboard bots if none exist yet. */
async function ensureBotsSeeded(): Promise<void> {
  const botCount = await db.player.count({ where: { isBot: true } });
  if (botCount > 0) return;

  const seeds: Array<{
    name: string;
    elo: number;
    class: string;
    wins: number;
    losses: number;
    bestCombo: number;
    title: string | null;
  }> = [
    { name: 'NeuroBlade', elo: 1480, class: 'assassin', wins: 142, losses: 38, bestCombo: 14, title: 'Inarrêtable' },
    { name: 'PyroMath', elo: 1410, class: 'mage', wins: 120, losses: 50, bestCombo: 12, title: 'Roi du blitz' },
    { name: 'ZeroChill', elo: 1355, class: 'gardien', wins: 98, losses: 44, bestCombo: 9, title: 'Cerveau de fer' },
    { name: 'Vortex', elo: 1290, class: 'assassin', wins: 110, losses: 60, bestCombo: 11, title: 'Calculateur fou' },
    { name: 'CalcQueen', elo: 1230, class: 'mage', wins: 88, losses: 52, bestCombo: 10, title: 'Machine humaine' },
    { name: 'PrimeTime', elo: 1180, class: 'guerrier', wins: 76, losses: 58, bestCombo: 8, title: null },
    { name: 'Hexa', elo: 1120, class: 'alchimiste', wins: 64, losses: 60, bestCombo: 8, title: null },
    { name: 'Quanta', elo: 1060, class: 'gardien', wins: 55, losses: 62, bestCombo: 7, title: null },
    { name: 'Sigma', elo: 1000, class: 'guerrier', wins: 48, losses: 66, bestCombo: 6, title: null },
    { name: 'Omega', elo: 940, class: 'alchimiste', wins: 40, losses: 70, bestCombo: 6, title: null },
    { name: 'Infinix', elo: 870, class: 'mage', wins: 30, losses: 78, bestCombo: 5, title: null },
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
          class: b.class,
          wins: b.wins,
          losses: b.losses,
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
    create: { id: 1, isBot: false, name: 'Joueur', elo: 1000 },
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
    // title & class can be cleared (null) — only apply when explicitly provided.
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
