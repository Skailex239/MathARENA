"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Save, X, AlertCircle, Clock } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Legend,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { Btn, Panel, PageTitle, SectionLabel, StatTile, RankBadge, DataTable } from "@/components/matharena/ui";
import { api, type Profile, type MatchRecord } from "@/lib/api";
import { useApp } from "@/lib/store";
import { CLASSES } from "@/lib/game/classes";
import { cn } from "@/lib/utils";

/* ============================================================
   ProfileScreen — Chess.com dashboard style
   Sidebar nav + Overview / Stats / Games (real) + Achievements / Settings (todo)
   ============================================================ */

type Tab = "overview" | "stats" | "games" | "achievements" | "settings";

const NAV: { id: Tab; label: string; available: boolean }[] = [
  { id: "overview", label: "Vue d'ensemble", available: true },
  { id: "stats", label: "Statistiques", available: true },
  { id: "games", label: "Parties", available: true },
  { id: "achievements", label: "Succès", available: false },
  { id: "settings", label: "Réglages", available: false },
];

const MODE_LABEL: Record<string, string> = {
  PRACTICE: "Entraînement",
  QUICK: "Rapide",
  BLITZ: "Blitz",
  RANKED: "Classé",
};

export default function ProfileScreen() {
  const setView = useApp((s) => s.setView);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("overview");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, m] = await Promise.all([api.getProfile(), api.getMatches(50)]);
      setProfile(p);
      setMatches(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Mobile horizontal nav */}
      <nav className="mb-4 flex gap-1 overflow-x-auto scrollbar-none lg:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => n.available && setTab(n.id)}
            disabled={!n.available}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md border transition-colors",
              !n.available && "opacity-50 cursor-not-allowed",
              tab === n.id
                ? "bg-[#3b82f6] text-white border-[#3b82f6]"
                : "bg-transparent text-[#9ba4b0] border-[#2d333b] hover:bg-[#22272e] hover:text-[#e6edf3]",
            )}
          >
            {n.label}
            {!n.available && <span className="ml-1.5 text-[10px] uppercase text-[#6e7681]">bientôt</span>}
          </button>
        ))}
      </nav>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[200px] shrink-0">
          <div className="sticky top-20">
            <SectionLabel className="mb-2">Navigation</SectionLabel>
            <nav className="flex flex-col gap-0.5">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => n.available && setTab(n.id)}
                  disabled={!n.available}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                    !n.available && "opacity-50 cursor-not-allowed",
                    tab === n.id
                      ? "bg-[#1c2128] text-[#e6edf3] border-l-2 border-[#3b82f6] pl-[10px]"
                      : "text-[#9ba4b0] hover:text-[#e6edf3] hover:bg-[#1c2128]",
                  )}
                >
                  <span>{n.label}</span>
                  {!n.available && <span className="text-[10px] uppercase text-[#6e7681]">bientôt</span>}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <ProfileSkeleton />
          ) : error ? (
            <Panel className="p-6 flex items-center gap-3 text-sm text-[#9ba4b0]">
              <AlertCircle className="w-4 h-4 text-[#f85149] shrink-0" />
              <span className="flex-1">{error}</span>
              <Btn size="sm" variant="secondary" onClick={() => void reload()}>
                Réessayer
              </Btn>
            </Panel>
          ) : !profile ? null : tab === "overview" ? (
            <Overview profile={profile} matches={matches} onProfileChange={setProfile} />
          ) : tab === "stats" ? (
            <StatsTab profile={profile} matches={matches} />
          ) : tab === "games" ? (
            <GamesTab matches={matches} />
          ) : (
            <ComingSoon />
          )}

          {/* Common actions */}
          <div className="mt-6 flex items-center gap-2">
            <Btn size="sm" variant="secondary" onClick={() => setView("classselect")}>
              Nouveau duel
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setView("leaderboard")}>
              Classement
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Overview
   ---------------------------------------------------------------- */

function Overview({
  profile,
  matches,
  onProfileChange,
}: {
  profile: Profile;
  matches: MatchRecord[];
  onProfileChange: (p: Profile) => void;
}) {
  const setView = useApp((s) => s.setView);

  const recent = useMemo(() => matches.slice(0, 10), [matches]);
  const ratingData = useMemo(
    () =>
      [...matches]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((m, i) => ({ match: i + 1, elo: m.eloAfter })),
    [matches],
  );

  // stats
  const wins = profile.wins;
  const losses = profile.losses;
  const winrate = profile.winrate;
  const avgTime = matches.length
    ? Math.round(matches.reduce((s, m) => s + m.avgTimeMs, 0) / matches.length / 100) / 10
    : 0;
  const avgAcc = matches.length
    ? Math.round((matches.reduce((s, m) => s + m.accuracy, 0) / matches.length) * 10) / 10
    : 0;
  const favClass = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of matches) counts.set(m.playerClass, (counts.get(m.playerClass) ?? 0) + 1);
    let best: string | null = null;
    let bestN = 0;
    for (const [k, n] of counts) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return best ?? profile.class;
  }, [matches, profile.class]);

  const xpPct = profile.levelInfo.needed
    ? Math.round((profile.levelInfo.current / profile.levelInfo.needed) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProfileHeader profile={profile} onProfileChange={onProfileChange} xpPct={xpPct} />

      {/* Stat tiles */}
      <section>
        <SectionLabel className="mb-3">Statistiques</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
          <StatTile label="Elo" value={<span className="font-mono">{profile.elo}</span>} />
          <StatTile label="Niveau" value={<span className="font-mono">{profile.level}</span>} />
          <StatTile label="Parties" value={<span className="font-mono">{profile.totalMatches}</span>} />
          <StatTile label="Victoires" value={<span className="font-mono text-[#2ea043]">{wins}</span>} />
          <StatTile label="Défaites" value={<span className="font-mono text-[#f85149]">{losses}</span>} />
          <StatTile
            label="Winrate"
            value={<span className="font-mono">{winrate}%</span>}
            sub={`${wins}V / ${losses}D`}
          />
          <StatTile
            label="Meilleur combo"
            value={<span className="font-mono">x{profile.bestCombo}</span>}
          />
          <StatTile label="Vitesse moyenne" value={<span className="font-mono">{avgTime}s</span>} sub="par question" />
          <StatTile label="Précision" value={<span className="font-mono">{avgAcc}%</span>} />
          <StatTile
            label="Classe préférée"
            value={
              <span className="text-base">
                {favClass ? CLASSES[favClass as keyof typeof CLASSES]?.emoji : "—"}{" "}
                {favClass ? CLASSES[favClass as keyof typeof CLASSES]?.name : "—"}
              </span>
            }
          />
        </div>
      </section>

      {/* Rating history */}
      <section>
        <SectionLabel className="mb-3">Historique du rating</SectionLabel>
        <Panel className="p-4">
          {ratingData.length === 0 ? (
            <EmptyHint text="Aucune partie pour l'instant." />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                  <CartesianGrid stroke="#232a33" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="match"
                    stroke="#6e7681"
                    tick={{ fontSize: 11, fill: "#6e7681" }}
                    tickLine={false}
                    axisLine={{ stroke: "#2d333b" }}
                  />
                  <YAxis
                    stroke="#6e7681"
                    tick={{ fontSize: 11, fill: "#6e7681" }}
                    tickLine={false}
                    axisLine={{ stroke: "#2d333b" }}
                    width={48}
                  />
                  <RTooltip
                    cursor={{ stroke: "#3b82f6", strokeWidth: 1 }}
                    contentStyle={{
                      background: "#161b22",
                      border: "1px solid #2d333b",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#e6edf3",
                    }}
                    labelFormatter={(l) => `Match #${l}`}
                    formatter={(v: number) => [`${v} Elo`, ""]}
                  />
                  <Line
                    type="monotone"
                    dataKey="elo"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </section>

      {/* Recent games */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Parties récentes</SectionLabel>
          <span className="text-xs text-[#6e7681]">{recent.length} / {matches.length}</span>
        </div>
        {recent.length === 0 ? (
          <Panel className="p-8 flex flex-col items-center gap-3 text-center">
            <Clock className="w-5 h-5 text-[#6e7681]" />
            <div className="text-sm text-[#9ba4b0]">Aucune partie jouée.</div>
            <Btn size="sm" onClick={() => setView("classselect")}>
              Jouer
            </Btn>
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <RecentGamesTable rows={recent} />
          </Panel>
        )}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------
   Profile header — name editable, rank, level/XP, elo mono
   ---------------------------------------------------------------- */

function ProfileHeader({
  profile,
  onProfileChange,
  xpPct,
}: {
  profile: Profile;
  onProfileChange: (p: Profile) => void;
  xpPct: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(profile.name), [profile.name]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === profile.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patchProfile({ name: trimmed.slice(0, 24) });
      onProfileChange(updated);
      toast.success("Profil mis à jour");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setName(profile.name);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <Panel className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void save();
                    if (e.key === "Escape") {
                      setName(profile.name);
                      setEditing(false);
                    }
                  }}
                  className="h-8 px-2 text-lg font-semibold bg-[#0e1116] border border-[#2d333b] rounded-md text-[#e6edf3] focus:outline-none focus:border-[#3b82f6]"
                />
                <Btn size="sm" onClick={() => void save()} disabled={saving}>
                  <Save className="w-3.5 h-3.5" /> Enregistrer
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setName(profile.name);
                    setEditing(false);
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Btn>
              </div>
            ) : (
              <>
                <PageTitle className="text-lg leading-tight">{profile.name}</PageTitle>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-[#6e7681] hover:text-[#e6edf3] transition-colors"
                  aria-label="Renommer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-[#9ba4b0]">
            <RankBadge elo={profile.elo} />
            <span className="flex items-center gap-1">
              Niveau <span className="font-mono text-[#e6edf3]">{profile.level}</span>
            </span>
            <span className="flex items-center gap-1">
              Elo <span className="font-mono text-[#e6edf3]">{profile.elo}</span>
            </span>
            <span>
              {profile.wins}V · {profile.losses}D
            </span>
          </div>
        </div>

        {/* Level / XP */}
        <div className="w-full sm:w-56 shrink-0">
          <div className="flex items-center justify-between text-xs text-[#6e7681] mb-1">
            <span>XP niveau {profile.level}</span>
            <span className="font-mono">
              {profile.levelInfo.current}/{profile.levelInfo.needed}
            </span>
          </div>
          <div className="h-2 rounded-sm bg-[#1c2128] border border-[#2d333b] overflow-hidden">
            <div
              className="h-full bg-[#3b82f6] transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(100, xpPct))}%` }}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Recent games DataTable
   ---------------------------------------------------------------- */

function RecentGamesTable({ rows }: { rows: MatchRecord[] }) {
  const data = useMemo(
    () =>
      rows.map((m) => ({
        date: (
          <span className="text-[#9ba4b0]" title={new Date(m.createdAt).toLocaleString("fr-FR")}>
            {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: fr })}
          </span>
        ),
        opponent: <span className="text-[#e6edf3]">{m.opponentName}</span>,
        class: (
          <span className="text-[#9ba4b0]">
            {CLASSES[m.playerClass as keyof typeof CLASSES]?.emoji ?? "·"}{" "}
            {CLASSES[m.playerClass as keyof typeof CLASSES]?.name ?? m.playerClass}
          </span>
        ),
        result: <ResultBadge result={m.result} />,
        elo: <EloChange change={m.eloChange} after={m.eloAfter} />,
        combo: <span className="font-mono text-[#9ba4b0]">x{m.maxCombo}</span>,
        time: <span className="font-mono text-[#9ba4b0]">{Math.round(m.avgTimeMs / 100) / 10}s</span>,
        mode: <span className="text-[#9ba4b0]">{MODE_LABEL[m.mode] ?? m.mode}</span>,
      })),
    [rows],
  );

  return (
    <DataTable
      columns={[
        { key: "date", header: "Date" },
        { key: "opponent", header: "Adversaire" },
        { key: "class", header: "Classe" },
        { key: "result", header: "Résultat" },
        { key: "elo", header: "Elo ±" },
        { key: "combo", header: "Combo" },
        { key: "time", header: "Temps" },
        { key: "mode", header: "Mode" },
      ]}
      rows={data}
      rowKey={(_, i) => String(i)}
    />
  );
}

function ResultBadge({ result }: { result: "WIN" | "LOSE" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border",
        result === "WIN"
          ? "text-[#2ea043] border-[#2ea043]/40 bg-[#2ea043]/10"
          : "text-[#f85149] border-[#f85149]/40 bg-[#f85149]/10",
      )}
    >
      {result === "WIN" ? "Victoire" : "Défaite"}
    </span>
  );
}

function EloChange({ change, after }: { change: number; after: number }) {
  const sign = change > 0 ? "+" : "";
  const color = change > 0 ? "text-[#2ea043]" : change < 0 ? "text-[#f85149]" : "text-[#9ba4b0]";
  return (
    <span className="font-mono text-xs">
      <span className={color}>{sign}{change}</span>
      <span className="text-[#6e7681] ml-1">→ {after}</span>
    </span>
  );
}

/* ----------------------------------------------------------------
   Stats tab — BarChart winrate par mode + per-mode table
   ---------------------------------------------------------------- */

function StatsTab({ profile, matches }: { profile: Profile; matches: MatchRecord[] }) {
  const byMode = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number; total: number; avgTime: number; avgAcc: number }>();
    for (const m of matches) {
      const cur = map.get(m.mode) ?? { wins: 0, losses: 0, total: 0, avgTime: 0, avgAcc: 0 };
      cur.total += 1;
      if (m.result === "WIN") cur.wins += 1;
      else cur.losses += 1;
      cur.avgTime += m.avgTimeMs;
      cur.avgAcc += m.accuracy;
      map.set(m.mode, cur);
    }
    return Array.from(map.entries()).map(([mode, v]) => ({
      mode: MODE_LABEL[mode] ?? mode,
      wins: v.wins,
      losses: v.losses,
      winrate: v.total ? Math.round((v.wins / v.total) * 100) : 0,
      avgTime: v.total ? Math.round(v.avgTime / v.total / 100) / 10 : 0,
      avgAcc: v.total ? Math.round(v.avgAcc / v.total * 10) / 10 : 0,
      total: v.total,
    }));
  }, [matches]);

  return (
    <div className="space-y-6">
      <section>
        <SectionLabel className="mb-3">Répartition par mode</SectionLabel>
        <Panel className="p-4">
          {byMode.length === 0 ? (
            <EmptyHint text="Aucune partie pour l'instant." />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMode} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                  <CartesianGrid stroke="#232a33" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="mode"
                    stroke="#6e7681"
                    tick={{ fontSize: 11, fill: "#6e7681" }}
                    tickLine={false}
                    axisLine={{ stroke: "#2d333b" }}
                  />
                  <YAxis
                    stroke="#6e7681"
                    tick={{ fontSize: 11, fill: "#6e7681" }}
                    tickLine={false}
                    axisLine={{ stroke: "#2d333b" }}
                    width={32}
                  />
                  <RTooltip
                    cursor={{ fill: "#22272e50" }}
                    contentStyle={{
                      background: "#161b22",
                      border: "1px solid #2d333b",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#e6edf3",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "#9ba4b0" }}
                    formatter={(v) => <span style={{ color: "#9ba4b0" }}>{v}</span>}
                  />
                  <Bar dataKey="wins" name="Victoires" stackId="a" fill="#2ea043" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="losses" name="Défaites" stackId="a" fill="#f85149" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </section>

      <section>
        <SectionLabel className="mb-3">Statistiques par mode</SectionLabel>
        {byMode.length === 0 ? (
          <Panel className="p-8 text-center text-sm text-[#9ba4b0]">Aucune donnée disponible.</Panel>
        ) : (
          <Panel className="overflow-hidden">
            <DataTable
              columns={[
                { key: "mode", header: "Mode" },
                { key: "total", header: "Parties" },
                { key: "wins", header: "V" },
                { key: "losses", header: "D" },
                { key: "winrate", header: "Winrate" },
                { key: "avgTime", header: "Temps moyen" },
                { key: "avgAcc", header: "Précision" },
              ]}
              rows={byMode.map((m) => ({
                mode: <span className="text-[#e6edf3]">{m.mode}</span>,
                total: <span className="font-mono text-[#9ba4b0]">{m.total}</span>,
                wins: <span className="font-mono text-[#2ea043]">{m.wins}</span>,
                losses: <span className="font-mono text-[#f85149]">{m.losses}</span>,
                winrate: <span className="font-mono text-[#e6edf3]">{m.winrate}%</span>,
                avgTime: <span className="font-mono text-[#9ba4b0]">{m.avgTime}s</span>,
                avgAcc: <span className="font-mono text-[#9ba4b0]">{m.avgAcc}%</span>,
              }))}
              rowKey={(_, i) => String(i)}
            />
          </Panel>
        )}
      </section>

      <section>
        <SectionLabel className="mb-3">Profil global</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile label="Elo" value={<span className="font-mono">{profile.elo}</span>} />
          <StatTile label="Niveau" value={<span className="font-mono">{profile.level}</span>} />
          <StatTile label="Meilleur combo" value={<span className="font-mono">x{profile.bestCombo}</span>} />
          <StatTile
            label="Winrate global"
            value={<span className="font-mono">{profile.winrate}%</span>}
            sub={`${profile.wins}V / ${profile.losses}D`}
          />
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------
   Games tab — full table
   ---------------------------------------------------------------- */

function GamesTab({ matches }: { matches: MatchRecord[] }) {
  const data = useMemo(
    () =>
      matches.map((m) => ({
        date: (
          <span className="text-[#9ba4b0]" title={new Date(m.createdAt).toLocaleString("fr-FR")}>
            {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: fr })}
          </span>
        ),
        opponent: <span className="text-[#e6edf3]">{m.opponentName}</span>,
        class: (
          <span className="text-[#9ba4b0]">
            {CLASSES[m.playerClass as keyof typeof CLASSES]?.emoji ?? "·"}{" "}
            {CLASSES[m.playerClass as keyof typeof CLASSES]?.name ?? m.playerClass}
          </span>
        ),
        oppClass: (
          <span className="text-[#9ba4b0]">
            {CLASSES[m.opponentClass as keyof typeof CLASSES]?.emoji ?? "·"}{" "}
            {CLASSES[m.opponentClass as keyof typeof CLASSES]?.name ?? m.opponentClass}
          </span>
        ),
        result: <ResultBadge result={m.result} />,
        elo: <EloChange change={m.eloChange} after={m.eloAfter} />,
        combo: <span className="font-mono text-[#9ba4b0]">x{m.maxCombo}</span>,
        time: <span className="font-mono text-[#9ba4b0]">{Math.round(m.avgTimeMs / 100) / 10}s</span>,
        acc: <span className="font-mono text-[#9ba4b0]">{m.accuracy}%</span>,
        mode: <span className="text-[#9ba4b0]">{MODE_LABEL[m.mode] ?? m.mode}</span>,
      })),
    [matches],
  );

  if (matches.length === 0) {
    return (
      <Panel className="p-8 text-center text-sm text-[#9ba4b0]">Aucune partie enregistrée.</Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <DataTable
        columns={[
          { key: "date", header: "Date" },
          { key: "opponent", header: "Adversaire" },
          { key: "class", header: "Classe" },
          { key: "oppClass", header: "Adv. classe" },
          { key: "result", header: "Résultat" },
          { key: "elo", header: "Elo ±" },
          { key: "combo", header: "Combo" },
          { key: "time", header: "Temps" },
          { key: "acc", header: "Précision" },
          { key: "mode", header: "Mode" },
        ]}
        rows={data}
        rowKey={(_, i) => String(i)}
      />
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Coming soon (achievements, settings)
   ---------------------------------------------------------------- */

function ComingSoon() {
  return (
    <Panel className="p-10 text-center">
      <SectionLabel>Bientôt disponible</SectionLabel>
      <p className="mt-3 text-sm text-[#9ba4b0]">Cette section est en cours de développement.</p>
    </Panel>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="h-full min-h-[120px] flex items-center justify-center text-sm text-[#6e7681]">{text}</div>;
}

/* ----------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------- */

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-[#161b22] border border-[#2d333b] rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-20 bg-[#161b22] border border-[#2d333b] rounded-lg" />
        ))}
      </div>
      <div className="h-[252px] bg-[#161b22] border border-[#2d333b] rounded-lg" />
      <div className="h-64 bg-[#161b22] border border-[#2d333b] rounded-lg" />
    </div>
  );
}
