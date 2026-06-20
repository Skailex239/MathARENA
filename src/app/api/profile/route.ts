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
    eloClassique: number;
    eloRapide: number;
    eloBlitz: number;
    title: string | null;
  }> = [
    { name: 'NeuroBlade', eloClassique: 1480, eloRapide: 1390, eloBlitz: 1520, title: 'Inarrêtable' },
    { name: 'PyroMath', eloClassique: 1410, eloRapide: 1460, eloBlitz: 1380, title: 'Roi du blitz' },
    { name: 'ZeroChill', eloClassique: 1355, eloRapide: 1200, eloBlitz: 1280, title: 'Cerveau de fer' },
    { name: 'Vortex', eloClassique: 1290, eloRapide: 1330, eloBlitz: 1400, title: 'Calculateur fou' },
    { name: 'CalcQueen', eloClassique: 1230, eloRapide: 1280, eloBlitz: 1190, title: 'Machine humaine' },
    { name: 'PrimeTime', eloClassique: 1180, eloRapide: 1140, eloBlitz: 1220, title: null },
    { name: 'Hexa', eloClassique: 1120, eloRapide: 1090, eloBlitz: 1060, title: null },
    { name: 'Quanta', eloClassique: 1060, eloRapide: 1040, eloBlitz: 1100, title: null },
    { name: 'Sigma', eloClassique: 1000, eloRapide: 1000, eloBlitz: 1000, title: null },
    { name: 'Omega', eloClassique: 940, eloRapide: 960, eloBlitz: 900, title: null },
    { name: 'Infinix', eloClassique: 870, eloRapide: 900, eloBlitz: 850, title: null },
  ];

  await db.$transaction(
    seeds.map((b) => {
      const approxLevel = 1 + Math.floor(b.eloClassique / 200);
      const xp = (approxLevel - 1) * 400;
      return db.player.create({
        data: {
          isBot: true,
          name: b.name,
          eloClassique: b.eloClassique,
          eloRapide: b.eloRapide,
          eloBlitz: b.eloBlitz,
          title: b.title,
          xp,
          level: approxLevel,
        },
      });
    })
  );
}

async function ensureHumanPlayer(): Promise<Player> {
  return db.player.upsert({
    where: { id: 1 },
    create: { id: 1, isBot: false, name: 'Joueur', eloClassique: 1000, eloRapide: 1000, eloBlitz: 1000 },
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
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

interface PatchBody {
  name?: string;
  title?: string | null;
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
    const data: { name?: string; title?: string | null } = {};
    if (typeof body.name === 'string' && body.name.trim().length > 0) data.name = body.name.trim();
    if (body.title !== undefined) {
      data.title = typeof body.title === 'string' && body.title.trim().length > 0 ? body.title.trim() : null;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }
    await ensureHumanPlayer();
    const updated = await db.player.update({ where: { id: 1 }, data });
    return NextResponse.json(toProfile(updated));
  } catch (err) {
    console.error('[api/profile PATCH] error', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
