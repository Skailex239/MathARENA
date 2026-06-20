'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Trophy, Swords, Target, Timer, Flame, Pencil, Check, X,
  RefreshCw, Play, Gauge, LayoutGrid, BarChart3, History,
  Award, Users, Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, Cell,
  CartesianGrid, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { api, type MatchRecord, type Profile } from '@/lib/api';
import { useApp } from '@/lib/store';
import { CLASS_LIST } from '@/lib/game/classes';
import { divisionFor } from '@/lib/game/divisions';
import { Btn, Panel, RankBadge, SectionTitle, StatTile } from '@/components/matharena/ui';
import type { ClassDef } from '@/lib/game/types';

/* ------------------------------------------------------------------ */
/*  Constantes & helpers                                              */
/* ------------------------------------------------------------------ */

const MODE_LABELS: Record<string, string> = {
  PRACTICE: 'Practice',
  QUICK: 'Quick',
  BLITZ: 'Blitz',
  RANKED: 'Ranked',
};

const TOOLTIP_STYLE = {
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
} as const;

const AXIS_STROKE = '#8b949e';
const GRID_STROKE = 'rgba(255,255,255,0.06)';

const PIE_COLORS = ['#22c55e', '#ef4444', '#8b949e'];
const BAR_COLORS = ['#2563eb', '#00d4ff', '#7c3aed', '#f59e0b', '#22c55e', '#ef4444'];

type ProfileTab =
  | 'overview'
  | 'stats'
  | 'history'
  | 'achievements'
  | 'friends'
  | 'settings';

interface NavItem {
  id: ProfileTab;
  label: string;
  icon: LucideIcon;
  available: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, available: true },
  { id: 'stats', label: 'Stats', icon: BarChart3, available: true },
  { id: 'history', label: 'Historique', icon: History, available: true },
  { id: 'achievements', label: 'Succès', icon: Award, available: false },
  { id: 'friends', label: 'Amis', icon: Users, available: false },
  { id: 'settings', label: 'Réglages', icon: Settings, available: false },
];

function classById(id: string | null): ClassDef | null {
  if (!id) return null;
  return CLASS_LIST.find((c) => c.id === id) ?? null;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

interface ModeAgg {
  mode: string;
  label: string;
  wins: number;
  losses: number;
  avgTime: number;
}

function aggregateByMode(matches: MatchRecord[]): ModeAgg[] {
  const map = new Map<string, ModeAgg>();
  for (const m of matches) {
    let e = map.get(m.mode);
    if (!e) {
      e = {
        mode: m.mode,
        label: MODE_LABELS[m.mode] ?? m.mode,
        wins: 0,
        losses: 0,
        avgTime: 0,
      };
      map.set(m.mode, e);
    }
    if (m.result === 'WIN') e.wins += 1;
    else e.losses += 1;
    e.avgTime += m.avgTimeMs;
  }
  for (const e of map.values()) {
    const n = e.wins + e.losses;
    e.avgTime = n > 0 ? e.avgTime / n : 0;
  }
  return Array.from(map.values());
}

function preferredClass(matches: MatchRecord[], fallback: string | null): ClassDef | null {
  if (matches.length === 0) return classById(fallback);
  const counts = new Map<string, number>();
  for (const m of matches) counts.set(m.playerClass, (counts.get(m.playerClass) ?? 0) + 1);
  let best: string | null = null;
  let bestN = -1;
  for (const [k, v] of counts) {
    if (v > bestN) {
      best = k;
      bestN = v;
    }
  }
  return classById(best);
}

interface EloPoint {
  idx: number;
  label: string;
  elo: number;
}

function eloSeries(matches: MatchRecord[]): EloPoint[] {
  const asc = [...matches].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return asc.map((m, i) => ({ idx: i + 1, label: String(i + 1), elo: m.eloAfter }));
}

function relativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                   */
/* ------------------------------------------------------------------ */

function StatCardSkeleton() {
  return <Skeleton className="h-[88px] rounded-xl" />;
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:pl-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Skeleton className="h-10 w-full rounded-lg lg:h-12 lg:w-56" />
        <div className="flex-1 space-y-6">
          <Panel className="p-5">
            <div className="flex items-center gap-5">
              <Skeleton className="size-20 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-20 w-24 rounded-xl" />
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      </div>
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

function EmptyMatches({ onPlay }: { onPlay: () => void }) {
  return (
    <Panel className="flex flex-col items-center gap-4 p-12 text-center">
      <div className="text-5xl">🎯</div>
      <div>
        <div className="font-display text-xl font-bold">Aucun match joué</div>
        <div className="mt-1 text-sm text-[#8b949e]">
          Lance ton premier duel et grimpe dans le classement.
        </div>
      </div>
      <Btn size="lg" onClick={onPlay} className="min-h-11">
        <Play className="size-4" /> Jouer
      </Btn>
    </Panel>
  );
}

function MatchRow({ m }: { m: MatchRecord }) {
  const pc = classById(m.playerClass);
  const oc = classById(m.opponentClass);
  const win = m.result === 'WIN';
  const modeLabel = MODE_LABELS[m.mode] ?? m.mode;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-[#0d1117]/60 px-3 py-2.5 transition-colors hover:bg-[#21262d]',
        win ? 'border-[#22c55e]/30' : 'border-[#ef4444]/30',
      )}
    >
      <div className="flex items-center gap-1 text-xl">
        <span title={pc?.name ?? 'Classe'}>{pc?.emoji ?? '🧠'}</span>
        <span className="text-xs text-[#8b949e]">vs</span>
        <span title={oc?.name ?? 'Classe'}>{oc?.emoji ?? '🤖'}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">{m.opponentName}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#8b949e]">
          <span className="rounded border border-[#30363d] px-1.5 py-0 font-mono uppercase tracking-wider">
            {modeLabel}
          </span>
          <span className="text-[#f59e0b]">🔥 x{m.maxCombo}</span>
          <span className="font-mono">⏱ {(m.avgTimeMs / 1000).toFixed(1)}s</span>
          <span>· {relativeDate(m.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
            win ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-[#ef4444]/15 text-[#ef4444]',
          )}
        >
          {win ? 'WIN' : 'LOSE'}
        </span>
        <span
          className={cn(
            'font-mono text-xs font-bold',
            m.eloChange > 0 ? 'text-[#22c55e]' : m.eloChange < 0 ? 'text-[#ef4444]' : 'text-[#8b949e]',
          )}
        >
          {m.eloChange > 0 ? '+' : ''}
          {m.eloChange}
        </span>
      </div>
    </div>
  );
}

function ResultPie({ wins, losses }: { wins: number; losses: number }) {
  const data = [
    { name: 'Victoires', value: wins },
    { name: 'Défaites', value: losses },
  ].filter((d) => d.value > 0);
  const total = wins + losses;
  if (total === 0) return null;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={48}
          outerRadius={80}
          paddingAngle={3}
          stroke="#0d1117"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={entry.name === 'Victoires' ? PIE_COLORS[0] : PIE_COLORS[1]}
              fillOpacity={i === 0 ? 0.95 : 0.85}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number, n: string) => [`${v} (${Math.round((v / total) * 100)}%)`, n]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8b949e' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                           */
/* ------------------------------------------------------------------ */

function Sidebar({
  active,
  onChange,
}: {
  active: ProfileTab;
  onChange: (t: ProfileTab) => void;
}) {
  return (
    <>
      {/* Desktop vertical */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-20 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.available}
                onClick={() => item.available && onChange(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'min-h-11 disabled:cursor-not-allowed disabled:opacity-40',
                  isActive
                    ? 'bg-[rgba(37,99,235,0.15)] text-white shadow-[inset_2px_0_0_#2563eb]'
                    : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white',
                )}
              >
                <Icon className={cn('size-4', isActive && 'text-[#2563eb]')} />
                <span className="flex-1 text-left">{item.label}</span>
                {!item.available && (
                  <span className="rounded bg-[#21262d] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#8b949e]">
                    bientôt
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile horizontal scroll */}
      <div className="scrollbar-none -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!item.available}
              onClick={() => item.available && onChange(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                'min-h-11 disabled:cursor-not-allowed disabled:opacity-40',
                isActive
                  ? 'border-[#2563eb] bg-[rgba(37,99,235,0.15)] text-white'
                  : 'border-[#30363d] bg-[#161b22] text-[#8b949e]',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet Overview                                                   */
/* ------------------------------------------------------------------ */

function OverviewTab({
  profile,
  matches,
  onPlay,
}: {
  profile: Profile;
  matches: MatchRecord[];
  onPlay: () => void;
}) {
  const stats = useMemo(() => {
    const total = matches.length;
    const wins = matches.filter((m) => m.result === 'WIN').length;
    const losses = total - wins;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const bestCombo = matches.reduce((mx, m) => Math.max(mx, m.maxCombo), 0);
    const avgTimeMs = avg(matches.map((m) => m.avgTimeMs));
    const avgAcc = avg(matches.map((m) => m.accuracy));
    const pref = preferredClass(matches, profile.class);
    return { total, wins, losses, winrate, bestCombo, avgTimeMs, avgAcc, pref };
  }, [matches, profile]);

  const eloData = useMemo(() => eloSeries(matches), [matches]);
  const modeData = useMemo(() => aggregateByMode(matches), [matches]);
  const recentMatches = useMemo(() => matches.slice(0, 8), [matches]);

  const div = divisionFor(profile.elo);
  const prefClass = classById(profile.class);
  const avatarEmoji = prefClass?.emoji ?? '🧠';
  const xpPct = Math.min(
    100,
    Math.round((profile.levelInfo.current / profile.levelInfo.needed) * 100),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Panel className="relative overflow-hidden p-5 sm:p-6">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 15% 0%, ${div.color}22, transparent 55%)`,
          }}
        />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="clip-hex relative grid size-20 shrink-0 place-items-center text-4xl"
            style={{
              background: '#0d1117',
              border: `2px solid ${div.color}`,
              boxShadow: `0 0 22px ${div.color}55, inset 0 0 16px ${div.color}22`,
            }}
          >
            <span>{avatarEmoji}</span>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {profile.name}
              </h1>
              <RankBadge elo={profile.elo} />
              {prefClass && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-[10px] font-medium text-[#8b949e]">
                  <Swords className="size-3" /> {prefClass.name}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[#8b949e]">
                <span>
                  Niveau{' '}
                  <span className="font-mono font-bold text-white">{profile.levelInfo.level}</span>
                </span>
                <span className="font-mono">
                  {profile.levelInfo.current} / {profile.levelInfo.needed} XP
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full border border-[#30363d] bg-[#21262d]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg, #2563eb, #00d4ff)',
                    boxShadow: '0 0 10px rgba(0,212,255,0.45)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-[#30363d] bg-[#0d1117]/70 px-5 py-3">
            <span className="text-[10px] uppercase tracking-widest text-[#8b949e]">Elo</span>
            <span className="font-mono text-3xl font-black text-white text-glow-cyan">
              {profile.elo}
            </span>
          </div>
        </div>
      </Panel>

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Elo" value={profile.elo} accent="text-[#00d4ff]" sub={div.name} />
        <StatTile label="Niveau" value={profile.levelInfo.level} accent="text-[#2563eb]" sub={`${profile.levelInfo.needed - profile.levelInfo.current} XP au niveau suivant`} />
        <StatTile label="Parties" value={stats.total} accent="text-white" />
        <StatTile label="Victoires" value={stats.wins} accent="text-[#22c55e]" />
        <StatTile label="Défaites" value={stats.losses} accent="text-[#ef4444]" />
        <StatTile label="Winrate" value={`${stats.winrate}%`} accent="text-[#f59e0b]" />
        <StatTile label="Meilleur combo" value={`x${stats.bestCombo}`} accent="text-[#7c3aed]" />
        <StatTile label="Vitesse moyenne" value={`${(stats.avgTimeMs / 1000).toFixed(1)}s`} accent="text-[#22c55e]" />
        <StatTile label="Précision" value={`${stats.avgAcc.toFixed(0)}%`} accent="text-[#f59e0b]" />
        <StatTile label="Classe préférée" value={stats.pref?.name ?? '—'} accent="text-[#2563eb]" />
      </section>

      {matches.length === 0 ? (
        <EmptyMatches onPlay={onPlay} />
      ) : (
        <>
          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="size-4 text-[#2563eb]" />
                <SectionTitle className="text-base">Évolution de l&apos;Elo</SectionTitle>
              </div>
              <p className="mb-3 text-xs text-[#8b949e]">
                Progression sur tes {eloData.length} derniers matchs
              </p>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={eloData} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis
                      dataKey="label"
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(l) => `Match #${l}`}
                      cursor={{ stroke: 'rgba(37,99,235,0.4)', strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="elo"
                      name="Elo"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="url(#eloGrad)"
                      dot={{ r: 2, fill: '#2563eb' }}
                      activeDot={{ r: 5, fill: '#00d4ff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Target className="size-4 text-[#f59e0b]" />
                <SectionTitle className="text-base">Winrate par mode</SectionTitle>
              </div>
              <p className="mb-3 text-xs text-[#8b949e]">Victoires et défaites par mode de jeu</p>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modeData} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis
                      dataKey="label"
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="wins" name="Victoires" stackId="a" fill="#22c55e" />
                    <Bar dataKey="losses" name="Défaites" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          {/* Recent history */}
          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="size-4 text-[#7c3aed]" />
              <SectionTitle className="text-base">Historique récent</SectionTitle>
            </div>
            <p className="mb-3 text-xs text-[#8b949e]">
              {recentMatches.length} matchs affichés sur {matches.length}
            </p>
            <div className="scrollbar-neo max-h-96 space-y-2 overflow-y-auto pr-1">
              {recentMatches.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </div>
          </Panel>
        </>
      )}

      <div className="flex justify-center pt-2">
        <Btn size="lg" onClick={onPlay} className="min-h-11">
          <Swords className="size-4" /> Nouveau duel
        </Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet Stats                                                      */
/* ------------------------------------------------------------------ */

function StatsTab({ matches }: { matches: MatchRecord[] }) {
  const modeData = useMemo(() => aggregateByMode(matches), [matches]);
  const wins = useMemo(() => matches.filter((m) => m.result === 'WIN').length, [matches]);
  const losses = matches.length - wins;

  if (matches.length === 0) {
    return (
      <Panel className="p-10 text-center text-sm text-[#8b949e]">
        Aucune donnée statistique. Joue quelques matchs pour voir tes analyses.
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Timer className="size-4 text-[#00d4ff]" />
            <SectionTitle className="text-base">Vitesse moyenne par mode</SectionTitle>
          </div>
          <p className="mb-3 text-xs text-[#8b949e]">Temps de réponse moyen en secondes</p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modeData} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="label" stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  formatter={(v: number) => [`${(v / 1000).toFixed(2)} s`, 'Temps moyen']}
                />
                <Bar dataKey="avgTime" name="Temps moyen (ms)" radius={[4, 4, 0, 0]}>
                  {modeData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="size-4 text-[#22c55e]" />
            <SectionTitle className="text-base">Répartition des résultats</SectionTitle>
          </div>
          <p className="mb-3 text-xs text-[#8b949e]">{wins} V · {losses} D sur {matches.length} matchs</p>
          <div className="h-[260px] w-full">
            <ResultPie wins={wins} losses={losses} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet History                                                    */
/* ------------------------------------------------------------------ */

function HistoryTab({ matches }: { matches: MatchRecord[] }) {
  if (matches.length === 0) {
    return (
      <Panel className="p-10 text-center text-sm text-[#8b949e]">
        Aucun match à afficher.
      </Panel>
    );
  }
  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="size-4 text-[#2563eb]" />
        <SectionTitle className="text-base">Historique complet</SectionTitle>
        <span className="ml-auto font-mono text-xs text-[#8b949e]">{matches.length} matchs</span>
      </div>
      <div className="scrollbar-neo overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#30363d] hover:bg-transparent">
              <TableHead className="text-[#8b949e]">Date</TableHead>
              <TableHead className="text-[#8b949e]">Adversaire</TableHead>
              <TableHead className="text-[#8b949e]">Classe</TableHead>
              <TableHead className="text-[#8b949e]">Résultat</TableHead>
              <TableHead className="text-right text-[#8b949e]">Elo</TableHead>
              <TableHead className="text-right text-[#8b949e]">Combo</TableHead>
              <TableHead className="text-right text-[#8b949e]">Temps</TableHead>
              <TableHead className="text-[#8b949e]">Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((m) => {
              const win = m.result === 'WIN';
              const pc = classById(m.playerClass);
              return (
                <TableRow
                  key={m.id}
                  className={cn(
                    'border-[#30363d]',
                    win ? 'bg-[rgba(34,197,94,0.04)]' : 'bg-[rgba(239,68,68,0.04)]',
                  )}
                >
                  <TableCell className="text-xs text-[#8b949e]">{relativeDate(m.createdAt)}</TableCell>
                  <TableCell className="font-medium text-white">{m.opponentName}</TableCell>
                  <TableCell>
                    <span className="text-lg" title={pc?.name ?? ''}>{pc?.emoji ?? '🧠'}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                        win ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-[#ef4444]/15 text-[#ef4444]',
                      )}
                    >
                      {win ? 'WIN' : 'LOSE'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-mono text-sm font-bold',
                        m.eloChange > 0 ? 'text-[#22c55e]' : m.eloChange < 0 ? 'text-[#ef4444]' : 'text-[#8b949e]',
                      )}
                    >
                      {m.eloChange > 0 ? '+' : ''}
                      {m.eloChange}
                    </span>
                    <span className="ml-1 font-mono text-xs text-[#8b949e]">→ {m.eloAfter}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[#7c3aed]">x{m.maxCombo}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-[#8b949e]">
                    {(m.avgTimeMs / 1000).toFixed(1)}s
                  </TableCell>
                  <TableCell>
                    <span className="rounded border border-[#30363d] px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider text-[#8b949e]">
                      {MODE_LABELS[m.mode] ?? m.mode}
                    </span>
                  </TableCell>
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
/*  État « Bientôt disponible »                                       */
/* ------------------------------------------------------------------ */

function ComingSoon({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <Panel className="flex flex-col items-center gap-4 p-12 text-center">
      <div className="grid size-16 place-items-center rounded-2xl border border-[#30363d] bg-[#21262d] text-[#2563eb]">
        <Icon className="size-7" />
      </div>
      <div>
        <div className="font-display text-xl font-bold text-white">{label}</div>
        <div className="mt-1 text-sm text-[#8b949e]">
          Cette section arrive bientôt. Reste à l&apos;affût.
        </div>
      </div>
      <span className="rounded-full border border-[#30363d] bg-[#21262d] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">
        Bientôt disponible
      </span>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant principal                                               */
/* ------------------------------------------------------------------ */

export default function ProfileScreen() {
  const setView = useApp((s) => s.setView);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ProfileTab>('overview');

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, ms] = await Promise.all([api.getProfile(), api.getMatches(50)]);
      setProfile(p);
      setMatches(ms);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveName = useCallback(async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || !profile) return;
    setSavingName(true);
    try {
      const updated = await api.patchProfile({ name: trimmed.slice(0, 24) });
      setProfile(updated);
      setEditingName(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingName(false);
    }
  }, [nameDraft, profile]);

  if (loading) return <ProfileSkeleton />;
  if (error && !profile) return <ErrorState message={error} onRetry={load} />;
  if (!profile) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-8">
      {/* Top page title + edit */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-[#2563eb]" />
          <SectionTitle className="text-2xl sm:text-3xl">Profil</SectionTitle>
        </div>
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={nameDraft}
              maxLength={24}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') setEditingName(false);
              }}
              className="h-10 w-48 bg-[#0d1117]"
            />
            <Btn size="sm" onClick={saveName} disabled={savingName} className="min-h-11">
              <Check className="size-4" /> Sauver
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditingName(false)} className="min-h-11">
              <X className="size-4" />
            </Btn>
          </div>
        ) : (
          <Btn
            size="sm"
            variant="secondary"
            onClick={() => {
              setNameDraft(profile.name);
              setEditingName(true);
            }}
            className="min-h-11"
          >
            <Pencil className="size-4" /> Renommer
          </Btn>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Sidebar active={tab} onChange={setTab} />

        <main className="min-w-0 flex-1">
          {tab === 'overview' && (
            <OverviewTab profile={profile} matches={matches} onPlay={() => setView('classselect')} />
          )}
          {tab === 'stats' && <StatsTab matches={matches} />}
          {tab === 'history' && <HistoryTab matches={matches} />}
          {tab === 'achievements' && <ComingSoon label="Succès" icon={Award} />}
          {tab === 'friends' && <ComingSoon label="Amis" icon={Users} />}
          {tab === 'settings' && <ComingSoon label="Réglages" icon={Settings} />}
        </main>
      </div>
    </div>
  );
}
