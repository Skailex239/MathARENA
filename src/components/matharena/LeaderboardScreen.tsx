'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, RefreshCw, Swords } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { api, type LeaderboardEntry } from '@/lib/api';
import { useApp } from '@/lib/store';
import { CLASS_LIST } from '@/lib/game/classes';
import { divisionFor } from '@/lib/game/divisions';
import { Btn, Panel, RankBadge, SectionTitle } from '@/components/matharena/ui';
import type { ClassDef } from '@/lib/game/types';

const MEDALS = ['🥇', '🥈', '🥉'];

function classById(id: string | null): ClassDef | null {
  if (!id) return null;
  return CLASS_LIST.find((c) => c.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Skeleton & error                                                 */
/* ------------------------------------------------------------------ */

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-10 pt-6 lg:px-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-10">
      <Panel className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="text-4xl">⚠️</div>
        <div>
          <div className="font-display text-lg font-bold">Erreur de chargement</div>
          <div className="mt-1 text-sm text-[#8b949e]">{message}</div>
        </div>
        <Btn variant="secondary" onClick={onRetry}>
          <RefreshCw className="size-4" /> Réessayer
        </Btn>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Podium                                                            */
/* ------------------------------------------------------------------ */

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const div = divisionFor(entry.elo);
  const cls = classById(entry.class);
  const isFirst = rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.08 }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 text-center',
        isFirst && 'sm:-translate-y-3',
      )}
      style={{
        borderColor: `${div.color}80`,
        background: `linear-gradient(180deg, ${div.color}14, #161b22 70%)`,
        boxShadow: `0 0 24px ${div.color}33, inset 0 1px 0 ${div.color}22`,
      }}
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="text-3xl">{MEDALS[rank - 1]}</div>
        <div
          className="clip-hex grid size-14 place-items-center text-2xl"
          style={{
            background: '#0d1117',
            border: `2px solid ${div.color}`,
          }}
        >
          {cls?.emoji ?? '🧠'}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-base font-bold text-white">{entry.name}</span>
          {entry.isMe && (
            <span className="rounded bg-[#2563eb] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              TOI
            </span>
          )}
          {entry.isBot && (
            <span className="rounded border border-[#30363d] bg-[#21262d] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8b949e]">
              BOT
            </span>
          )}
        </div>
        <RankBadge elo={entry.elo} />
        <div className="font-mono text-3xl font-black text-white text-glow-cyan">{entry.elo}</div>
        <div className="text-[11px] text-[#8b949e]">
          <span className="font-mono">Niv. {entry.level}</span> ·{' '}
          <span className="text-[#22c55e]">{entry.wins}V</span>{' '}
          <span className="text-[#8b949e]">/</span>{' '}
          <span className="text-[#ef4444]">{entry.losses}D</span> ·{' '}
          <span className="font-mono">{entry.winrate}%</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table desktop                                                     */
/* ------------------------------------------------------------------ */

function RankCell({ rank }: { rank: number }) {
  if (rank >= 1 && rank <= 3) return <span className="text-lg">{MEDALS[rank - 1]}</span>;
  return <span className="font-mono text-sm text-[#8b949e]">#{rank}</span>;
}

function DesktopTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Panel className="p-2 sm:p-4">
      <div className="scrollbar-neo overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#30363d] hover:bg-transparent">
              <TableHead className="w-16 text-[#8b949e]">Rang</TableHead>
              <TableHead className="text-[#8b949e]">Joueur</TableHead>
              <TableHead className="text-[#8b949e]">Division</TableHead>
              <TableHead className="text-right text-[#8b949e]">Elo</TableHead>
              <TableHead className="text-right text-[#8b949e]">Niveau</TableHead>
              <TableHead className="text-right text-[#8b949e]">V-D</TableHead>
              <TableHead className="text-right text-[#8b949e]">Winrate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, i) => {
              const rank = i + 1;
              const cls = classById(e.class);
              return (
                <TableRow
                  key={e.id}
                  className={cn(
                    'border-[#30363d] transition-colors',
                    e.isMe
                      ? 'bg-[rgba(37,99,235,0.12)] shadow-[inset_3px_0_0_#2563eb]'
                      : 'hover:bg-[#21262d]/60',
                  )}
                >
                  <TableCell><RankCell rank={rank} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg" title={cls?.name ?? ''}>{cls?.emoji ?? '🧠'}</span>
                      <span className={cn('font-medium', e.isMe ? 'text-white' : 'text-white/90')}>
                        {e.name}
                      </span>
                      {e.isMe && (
                        <span className="rounded bg-[#2563eb] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                          TOI
                        </span>
                      )}
                      {e.isBot && (
                        <span className="rounded border border-[#30363d] bg-[#21262d] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8b949e]">
                          BOT
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><RankBadge elo={e.elo} /></TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-base font-bold text-white text-glow-cyan">{e.elo}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-[#8b949e]">{e.level}</TableCell>
                  <TableCell className="text-right text-sm">
                    <span className="font-mono text-[#22c55e]">{e.wins}</span>
                    <span className="text-[#8b949e]"> - </span>
                    <span className="font-mono text-[#ef4444]">{e.losses}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-white">{e.winrate}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Cards mobile                                                      */
/* ------------------------------------------------------------------ */

function MobileCards({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="space-y-2">
      {entries.map((e, i) => {
        const rank = i + 1;
        const div = divisionFor(e.elo);
        const cls = classById(e.class);
        const isPodium = rank <= 3;
        return (
          <div
            key={e.id}
            className={cn(
              'relative flex items-center gap-3 rounded-xl border p-3',
              e.isMe
                ? 'border-[#2563eb] bg-[rgba(37,99,235,0.12)] shadow-[inset_3px_0_0_#2563eb]'
                : isPodium
                  ? 'border-[#30363d] bg-[#161b22]'
                  : 'border-[#30363d] bg-[#161b22]',
            )}
            style={
              isPodium && !e.isMe
                ? { boxShadow: `0 0 18px ${div.color}33` }
                : undefined
            }
          >
            <div className="grid w-10 shrink-0 place-items-center">
              <RankCell rank={rank} />
            </div>
            <div
              className="clip-hex grid size-10 shrink-0 place-items-center text-xl"
              style={{
                background: '#0d1117',
                border: `2px solid ${div.color}`,
              }}
            >
              {cls?.emoji ?? '🧠'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-semibold text-white">{e.name}</span>
                {e.isMe && (
                  <span className="rounded bg-[#2563eb] px-1 text-[9px] font-bold uppercase tracking-wider text-white">
                    TOI
                  </span>
                )}
                {e.isBot && (
                  <span className="rounded border border-[#30363d] bg-[#21262d] px-1 text-[9px] font-bold uppercase tracking-wider text-[#8b949e]">
                    BOT
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#8b949e]">
                <RankBadge elo={e.elo} />
                <span className="font-mono">Niv. {e.level}</span>
                <span>·</span>
                <span className="text-[#22c55e]">{e.wins}V</span>
                <span className="text-[#ef4444]">{e.losses}D</span>
                <span>·</span>
                <span className="font-mono">{e.winrate}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-lg font-black text-white text-glow-cyan">{e.elo}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant principal                                               */
/* ------------------------------------------------------------------ */

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
  if (error) return <ErrorState message={error} onRetry={load} />;

  const top3 = entries.slice(0, 3);
  // Desktop order: 2nd | 1st | 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];
  const podiumRank = (e: LeaderboardEntry) => entries.indexOf(e) + 1;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-10 pt-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-[#2563eb]" />
            <SectionTitle className="text-2xl sm:text-3xl">Classement</SectionTitle>
          </div>
          <p className="mt-1 pl-4 text-sm text-[#8b949e]">
            Les meilleurs calculateurs de MathArena — {entries.length} joueur{entries.length > 1 ? 's' : ''} classé{entries.length > 1 ? 's' : ''}
          </p>
        </div>
        <Btn size="sm" onClick={() => setView('classselect')} className="min-h-11">
          <Swords className="size-4" /> Nouveau duel
        </Btn>
      </div>

      {/* Podium */}
      {top3.length === 3 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          {podiumOrder.map((entry) => (
            <PodiumCard key={entry.id} entry={entry} rank={podiumRank(entry)} />
          ))}
        </div>
      )}

      {/* Table desktop / cards mobile */}
      <div className="hidden sm:block">
        <DesktopTable entries={entries} />
      </div>
      <div className="sm:hidden">
        <MobileCards entries={entries} />
      </div>

      {/* Footer note */}
      <div className="flex items-center justify-center gap-2 pt-2 text-center text-xs text-[#8b949e]">
        <Crown className="size-3.5 text-[#f59e0b]" />
        L&apos;Elo évolue en modes Ranked et Blitz. Gagne pour grimper.
      </div>
    </div>
  );
}
