'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Trophy, Sword, Target, Timer, Flame, Pencil, Check, X,
  RefreshCw, Play, Gauge, Brain,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';

import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { api, type Profile, type MatchRecord } from '@/lib/api';
import { useApp } from '@/lib/store';
import { CLASSES, ACCENT_CLASSES } from '@/lib/game/classes';
import { divisionFor } from '@/lib/game/divisions';
import type { Accent, ClassDef } from '@/lib/game/types';

const CHART_MAGENTA = '#ff3d8b';
const CHART_EMERALD = '#3ddc84';
const CHART_RED = '#f44747';

const TOOLTIP_STYLE = {
  background: '#16131f',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
} as const;

const AXIS_STROKE = 'rgba(255,255,255,0.55)';
const GRID_STROKE = 'rgba(255,255,255,0.06)';

const MODE_LABELS: Record<string, string> = {
  PRACTICE: 'Practice',
  QUICK: 'Quick',
  BLITZ: 'Blitz',
  RANKED: 'Ranked',
};

function classById(id: string | null): ClassDef | null {
  if (!id) return null;
  return (CLASSES as Record<string, ClassDef>)[id] ?? null;
}

interface ModeAgg {
  mode: string;
  label: string;
  wins: number;
  losses: number;
}

function aggregateByMode(matches: MatchRecord[]): ModeAgg[] {
  const map = new Map<string, ModeAgg>();
  for (const m of matches) {
    let e = map.get(m.mode);
    if (!e) {
      e = { mode: m.mode, label: MODE_LABELS[m.mode] ?? m.mode, wins: 0, losses: 0 };
      map.set(m.mode, e);
    }
    if (m.result === 'WIN') e.wins += 1;
    else e.losses += 1;
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

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function StatCard({
  icon, label, value, accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: Accent;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <Card className="relative overflow-hidden py-4">
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-40',
          a.from,
          a.to,
        )}
      />
      <CardContent className="relative z-10 flex items-center gap-3">
        <div
          className={cn(
            'grid size-10 place-items-center rounded-lg border bg-card/60',
            a.text,
            a.border,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className={cn('truncate text-lg font-bold', a.text)}>{value}</div>
        </div>
      </CardContent>
    </Card>
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
        'flex items-center gap-3 rounded-lg border bg-card/40 px-3 py-2 transition-colors hover:bg-card/70',
        win ? 'border-emerald-500/30' : 'border-red-500/30',
      )}
    >
      <div className="flex items-center gap-1 text-xl">
        <span title={pc?.name ?? 'Classe'}>{pc?.emoji ?? '🧠'}</span>
        <span className="text-xs text-muted-foreground">vs</span>
        <span title={oc?.name ?? 'Classe'}>{oc?.emoji ?? '🤖'}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{m.opponentName}</div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{modeLabel}</Badge>
          <span>🔥 x{m.maxCombo}</span>
          <span>⏱ {(m.avgTimeMs / 1000).toFixed(1)}s</span>
          <span>· {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: fr })}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <Badge
          variant={win ? 'default' : 'destructive'}
          className={cn('px-2', win && 'bg-emerald-500/90 text-white')}
        >
          {win ? 'WIN' : 'LOSE'}
        </Badge>
        <span
          className={cn(
            'text-xs font-bold',
            m.eloChange > 0 ? 'text-emerald-400'
              : m.eloChange < 0 ? 'text-red-400'
                : 'text-muted-foreground',
          )}
        >
          {m.eloChange > 0 ? '+' : ''}{m.eloChange}
        </span>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-10 pt-6">
      <Card>
        <CardContent className="flex items-center gap-5 pt-2">
          <Skeleton className="size-20 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-2 w-full" />
          </div>
          <Skeleton className="h-20 w-24 rounded-xl" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}

export default function ProfileScreen() {
  const setView = useApp((s) => s.setView);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    const total = matches.length;
    const wins = matches.filter((m) => m.result === 'WIN').length;
    const losses = total - wins;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const bestCombo = matches.reduce((mx, m) => Math.max(mx, m.maxCombo), 0);
    const avgTimeMs = avg(matches.map((m) => m.avgTimeMs));
    const avgAcc = avg(matches.map((m) => m.accuracy));
    const pref = preferredClass(matches, profile?.class ?? null);
    return { total, wins, losses, winrate, bestCombo, avgTimeMs, avgAcc, pref };
  }, [matches, profile]);

  const eloData = useMemo(() => eloSeries(matches), [matches]);
  const modeData = useMemo(() => aggregateByMode(matches), [matches]);
  const recentMatches = useMemo(() => matches.slice(0, 8), [matches]);

  const startEdit = () => {
    setNameDraft(profile?.name ?? '');
    setEditingName(true);
  };
  const cancelEdit = () => setEditingName(false);

  const saveName = async () => {
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
  };

  if (loading) return <ProfileSkeleton />;

  if (error && !profile) {
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

  if (!profile) return null;

  const div = divisionFor(profile.elo);
  const divAccent = ACCENT_CLASSES[div.accent];
  const prefClass = classById(profile.class);
  const avatarEmoji = prefClass?.emoji ?? '🧠';
  const xpPct = Math.min(
    100,
    Math.round((profile.levelInfo.current / profile.levelInfo.needed) * 100),
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-10 pt-6">
      {/* Header */}
      <Card className="relative overflow-hidden">
        <div
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-30',
            divAccent.from,
            divAccent.to,
          )}
        />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <CardContent className="relative z-10 flex flex-col gap-5 pt-2 sm:flex-row sm:items-center">
          <div
            className={cn(
              'relative grid size-20 shrink-0 place-items-center rounded-2xl border bg-card/70 text-4xl',
              divAccent.border,
              divAccent.glow,
            )}
          >
            <span>{avatarEmoji}</span>
            <span
              className={cn(
                'absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full border bg-card text-base',
                divAccent.border,
              )}
            >
              {div.emoji}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={nameDraft}
                  maxLength={24}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="h-9 max-w-[220px]"
                />
                <Button size="icon" onClick={saveName} disabled={savingName} className="size-9" aria-label="Sauver">
                  <Check />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit} className="size-9" aria-label="Annuler">
                  <X />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-glow-magenta">{profile.name}</h1>
                <Button size="icon" variant="ghost" onClick={startEdit} className="size-7" aria-label="Modifier le nom">
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {profile.title && (
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="size-3" /> {profile.title}
                </Badge>
              )}
              <Badge variant="outline" className={cn('gap-1', divAccent.text, divAccent.border)}>
                {div.emoji} {div.name}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Sword className="size-3" /> {prefClass?.name ?? 'Sans classe'}
              </Badge>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Niveau <span className="font-bold text-foreground">{profile.levelInfo.level}</span>
                </span>
                <span>
                  {profile.levelInfo.current} / {profile.levelInfo.needed} XP
                </span>
              </div>
              <Progress value={xpPct} className="h-2" />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border bg-card/60 px-5 py-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Elo</span>
            <span className="text-3xl font-black text-glow-magenta">{profile.elo}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={<Sword className="size-5" />} label="Parties" value={String(stats.total)} accent="violet" />
        <StatCard icon={<Trophy className="size-5" />} label="Victoires" value={String(stats.wins)} accent="emerald" />
        <StatCard icon={<Target className="size-5" />} label="Winrate" value={`${stats.winrate}%`} accent="amber" />
        <StatCard icon={<X className="size-5" />} label="Défaites" value={String(stats.losses)} accent="red" />
        <StatCard icon={<Flame className="size-5" />} label="Meilleur combo" value={`x${stats.bestCombo}`} accent="magenta" />
        <StatCard icon={<Timer className="size-5" />} label="Vitesse moyenne" value={`${(stats.avgTimeMs / 1000).toFixed(1)} s`} accent="emerald" />
        <StatCard icon={<Gauge className="size-5" />} label="Précision" value={`${stats.avgAcc.toFixed(0)}%`} accent="amber" />
        <StatCard icon={<Brain className="size-5" />} label="Classe préférée" value={stats.pref?.name ?? '—'} accent="violet" />
      </section>

      {/* Empty state OR charts + history */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="text-5xl">🎯</div>
            <div>
              <div className="text-lg font-semibold">Aucun match joué</div>
              <div className="text-sm text-muted-foreground">
                Lance ton premier duel et grimpe dans le classement !
              </div>
            </div>
            <Button size="lg" onClick={() => setView('classselect')} className="min-h-11">
              <Play /> Jouer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-[#ff3d8b]" /> Évolution de l&apos;Elo
                </CardTitle>
                <CardDescription>
                  Progression sur tes {eloData.length} derniers matchs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eloData} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
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
                        cursor={{ stroke: 'rgba(255,61,139,0.4)', strokeWidth: 1 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="elo"
                        name="Elo"
                        stroke={CHART_MAGENTA}
                        strokeWidth={2.5}
                        dot={{ r: 2, fill: CHART_MAGENTA }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="size-4 text-[#ffb02e]" /> Winrate par mode
                </CardTitle>
                <CardDescription>Victoires et défaites par mode de jeu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full">
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
                      <Bar dataKey="wins" name="Victoires" stackId="a" fill={CHART_EMERALD} />
                      <Bar dataKey="losses" name="Défaites" stackId="a" fill={CHART_RED} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Match history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="size-4 text-[#ff3d8b]" /> Historique des matchs
              </CardTitle>
              <CardDescription>
                {recentMatches.length} matchs récents sur {matches.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="scrollbar-neon max-h-80 space-y-2 overflow-y-auto pr-1">
                {recentMatches.map((m) => (
                  <MatchRow key={m.id} m={m} />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Action */}
      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={() => setView('classselect')} className="min-h-11">
          <Sword /> Nouveau duel
        </Button>
      </div>
    </div>
  );
}
