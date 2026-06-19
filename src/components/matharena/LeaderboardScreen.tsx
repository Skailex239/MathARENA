'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, RefreshCw, Sword } from 'lucide-react';

import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { api, type LeaderboardEntry } from '@/lib/api';
import { useApp } from '@/lib/store';
import { CLASSES, ACCENT_CLASSES } from '@/lib/game/classes';
import { divisionFor } from '@/lib/game/divisions';
import type { ClassDef } from '@/lib/game/types';

const MEDALS = ['🥇', '🥈', '🥉'];

function classById(id: string | null): ClassDef | null {
  if (!id) return null;
  return (CLASSES as Record<string, ClassDef>)[id] ?? null;
}

function RankCell({ rank }: { rank: number }) {
  if (rank >= 1 && rank <= 3) return <span className="text-lg">{MEDALS[rank - 1]}</span>;
  return <span className="font-mono text-sm text-muted-foreground">#{rank}</span>;
}

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-10 pt-6">
      <div className="text-center">
        <Skeleton className="mx-auto h-9 w-64" />
        <Skeleton className="mx-auto mt-2 h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export default function LeaderboardScreen() {
  const setView = useApp((s) => s.setView);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeaderboard();
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LeaderboardSkeleton />;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-10">
        <Card className="text-center">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <div className="text-4xl">⚠️</div>
            <div>
              <div className="font-semibold">Erreur de chargement</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
            <Button onClick={load} variant="outline">
              <RefreshCw /> Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-10 pt-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-black text-glow-amber sm:text-4xl">
          <Crown className="size-8 text-[#ffb02e]" /> Classement mondial
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les meilleurs calculateurs de MathArena — {entries.length} joueur{entries.length > 1 ? 's' : ''} classé{entries.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          {entries.slice(0, 3).map((top, i) => {
            const topDiv = divisionFor(top.elo);
            const topAccent = ACCENT_CLASSES[topDiv.accent];
            const topCls = classById(top.class);
            return (
              <motion.div
                key={top.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'relative overflow-hidden rounded-2xl border bg-card/60 p-4',
                  i === 0 && 'sm:order-2 sm:-translate-y-3',
                  i === 1 && 'sm:order-1',
                  i === 2 && 'sm:order-3',
                  topAccent.border,
                  topAccent.glow,
                )}
              >
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-25',
                    topAccent.from,
                    topAccent.to,
                  )}
                />
                <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                  <div className="text-3xl">{MEDALS[i]}</div>
                  <div className="text-2xl">{topCls?.emoji ?? '🧠'}</div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="truncate">{top.name}</span>
                    {top.isMe && (
                      <Badge variant="default" className="px-1.5 text-[10px]">TOI</Badge>
                    )}
                  </div>
                  <Badge variant="outline" className={cn('gap-1', topAccent.text, topAccent.border)}>
                    {topDiv.emoji} {topDiv.name}
                  </Badge>
                  <div className="text-2xl font-black text-glow-magenta">{top.elo}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {top.wins}V · {top.losses}D · {top.winrate}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-[#ffb02e]" /> Classement complet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rang</TableHead>
                <TableHead>Joueur</TableHead>
                <TableHead>Division</TableHead>
                <TableHead className="text-right">Elo</TableHead>
                <TableHead className="text-right">Niveau</TableHead>
                <TableHead className="text-right">V/D</TableHead>
                <TableHead className="text-right">Winrate</TableHead>
                <TableHead className="text-right">Combo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e, i) => {
                const rank = i + 1;
                const div = divisionFor(e.elo);
                const accent = ACCENT_CLASSES[div.accent];
                const cls = classById(e.class);
                return (
                  <TableRow
                    key={e.id}
                    className={cn(
                      e.isMe && 'border-l-4 border-l-primary bg-primary/10',
                    )}
                  >
                    <TableCell><RankCell rank={rank} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cls?.emoji ?? '🧠'}</span>
                        <span className="font-medium">{e.name}</span>
                        {e.isMe && (
                          <Badge variant="default" className="px-1.5 text-[10px]">TOI</Badge>
                        )}
                        {e.isBot && (
                          <Badge variant="outline" className="px-1.5 text-[10px]">BOT</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('gap-1', accent.text, accent.border)}>
                        {div.emoji} {div.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-glow-magenta">{e.elo}</TableCell>
                    <TableCell className="text-right">{e.level}</TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="text-emerald-400">{e.wins}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-red-400">{e.losses}</span>
                    </TableCell>
                    <TableCell className="text-right">{e.winrate}%</TableCell>
                    <TableCell className="text-right">
                      <span className="text-[#ff3d8b]">x{e.bestCombo}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {entries.map((e, i) => {
          const rank = i + 1;
          const div = divisionFor(e.elo);
          const accent = ACCENT_CLASSES[div.accent];
          const cls = classById(e.class);
          return (
            <div
              key={e.id}
              className={cn(
                'relative flex items-center gap-3 rounded-xl border bg-card/50 p-3',
                e.isMe ? cn('border-l-4 border-l-primary', accent.border) : accent.border,
                rank <= 3 && accent.glow,
              )}
            >
              <div className="grid w-10 shrink-0 place-items-center text-xl">
                <RankCell rank={rank} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{cls?.emoji ?? '🧠'}</span>
                  <span className="truncate font-semibold">{e.name}</span>
                  {e.isMe && (
                    <Badge variant="default" className="px-1 text-[9px]">TOI</Badge>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className={cn('gap-0.5 px-1 text-[9px]', accent.text, accent.border)}>
                    {div.emoji} {div.name}
                  </Badge>
                  <span>Lvl {e.level}</span>
                  <span>·</span>
                  <span className="text-emerald-400">{e.wins}V</span>
                  <span className="text-red-400">{e.losses}D</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-black text-glow-magenta">{e.elo}</span>
                <span className="text-[10px] text-[#ff3d8b]">x{e.bestCombo}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={() => setView('classselect')} className="min-h-11">
          <Sword /> Nouveau duel
        </Button>
      </div>
    </div>
  );
}
