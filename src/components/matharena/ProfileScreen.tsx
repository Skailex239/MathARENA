"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, BarChart3, Clock, Trophy } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import {
  Btn,
  DataTable,
  OrnamentDivider,
  PageTitle,
  Panel,
  RankBadge,
  SectionLabel,
  StatTile,
} from "@/components/matharena/ui";
import { api, type MatchRecord, type Profile } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ============================================================
   ProfileScreen — Chess.com dashboard, LIGHT WARM cream
   Sidebar + Vue générale / Statistiques / Historique (réel)
   + Succès / Amis / Paramètres (bientôt)
   3 Elos séparés par mode (Classique / Rapide / Blitz).
   Entraînement = compteur winsArena/lossesArena (sans Elo).
   ============================================================ */

type Tab = "overview" | "stats" | "history" | "achievements" | "friends" | "settings";

const NAV: { id: Tab; label: string; available: boolean }[] = [
  { id: "overview", label: "Vue générale", available: true },
  { id: "stats", label: "Statistiques", available: true },
  { id: "history", label: "Historique", available: true },
  { id: "achievements", label: "Succès", available: false },
  { id: "friends", label: "Amis", available: false },
  { id: "settings", label: "Paramètres", available: false },
];

const MODE_LABELS: Record<string, string> = {
  RANKED: "Classique",
  QUICK: "Rapide",
  BLITZ: "Blitz",
  PRACTICE: "Entraînement",
};

const COMPETITIVE_MODES: ReadonlySet<string> = new Set(["RANKED", "QUICK", "BLITZ"]);

// Stats par catégorie — valeurs réalistes statiques (l'API ne ventile pas par catégorie).
const CATEGORIES: { label: string; pct: number }[] = [
  { label: "Addition", pct: 94 },
  { label: "Soustraction", pct: 88 },
  { label: "Multiplication", pct: 79 },
  { label: "Division", pct: 72 },
  { label: "Mixte", pct: 68 },
  { label: "Puissances", pct: 61 },
  { label: "Pourcentages", pct: 55 },
  { label: "Logique", pct: 47 },
];

interface ModeStat {
  key: "classique" | "rapide" | "blitz";
  label: string;
  elo: number;
  wins: number;
  losses: number;
  winrate: number;
}

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

  const noMatches = matches.length === 0;

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
                ? "border-[#e8823d] text-[#e8823d] bg-[rgba(232,130,61,0.06)]"
                : "border-[#ebe2d2] text-[#6b5f4f] bg-[#faf6f0] hover:bg-[#efe8db] hover:text-[#2a2520]",
            )}
          >
            {n.label}
            {!n.available && (
              <span className="ml-1.5 text-[10px] uppercase tracking-wide text-[#9c8e7a]">bientôt</span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[220px] shrink-0">
          <div className="sticky top-20 space-y-4">
            {profile && <ProfileCard profile={profile} />}

            <div>
              <SectionLabel className="mb-2 block">Navigation</SectionLabel>
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
                        ? "bg-[#efe8db] text-[#2a2520] border-l-2 border-[#e8823d] pl-[10px]"
                        : "text-[#6b5f4f] hover:text-[#2a2520] hover:bg-[#efe8db]",
                    )}
                  >
                    <span>{n.label}</span>
                    {!n.available && (
                      <span className="text-[10px] uppercase tracking-wide text-[#9c8e7a]">bientôt</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-4">
            <PageTitle>Profil</PageTitle>
            <Btn variant="secondary" size="sm" onClick={() => setView("classselect")}>
              Nouveau duel
            </Btn>
          </div>

          {loading ? (
            <ProfileSkeleton />
          ) : error ? (
            <Panel className="p-6 flex items-center gap-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#b5524a]" />
              <span className="flex-1 text-[#6b5f4f]">{error}</span>
              <Btn size="sm" variant="secondary" onClick={() => void reload()}>
                Réessayer
              </Btn>
            </Panel>
          ) : !profile ? null : noMatches && tab !== "achievements" && tab !== "friends" && tab !== "settings" ? (
            <EmptyState />
          ) : tab === "overview" ? (
            <Overview profile={profile} matches={matches} />
          ) : tab === "stats" ? (
            <StatsTab profile={profile} matches={matches} />
          ) : tab === "history" ? (
            <HistoryTab matches={matches} />
          ) : (
            <ComingSoon />
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Sidebar profile card — avatar + pseudo + XP bar + niveau
   ---------------------------------------------------------------- */

function ProfileCard({ profile }: { profile: Profile }) {
  const xpPct = profile.levelInfo.needed
    ? Math.max(0, Math.min(100, (profile.levelInfo.current / profile.levelInfo.needed) * 100))
    : 0;
  const initials = profile.name.slice(0, 2).toUpperCase();

  return (
    <Panel className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full shrink-0 font-bold text-xl font-mono"
          style={{ background: "#fce5d1", color: "#d26f2a", border: "1px solid #e8823d55" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[22px] font-semibold leading-tight truncate text-[#2a2520] tracking-[-0.01em]">
            {profile.name}
          </div>
          {profile.title ? (
            <div className="text-xs text-[#9c8e7a] mt-0.5 truncate">{profile.title}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#6b5f4f]">Niveau {profile.level}</span>
          <span className="font-mono text-[#9c8e7a]">
            {profile.levelInfo.current}/{profile.levelInfo.needed} XP
          </span>
        </div>
        <div
          className="relative h-2 rounded-sm overflow-hidden"
          style={{ background: "#efe8db", border: "1px solid #ebe2d2" }}
        >
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-500"
            style={{ width: `${xpPct}%`, background: "#e8823d" }}
          />
        </div>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Overview — 3 Elos + graphe + parties récentes + catégories
   ---------------------------------------------------------------- */

function Overview({ profile, matches }: { profile: Profile; matches: MatchRecord[] }) {
  const setView = useApp((s) => s.setView);

  const compMatches = useMemo(
    () => matches.filter((m) => COMPETITIVE_MODES.has(m.mode)),
    [matches],
  );

  const recent = useMemo(() => matches.slice(0, 10), [matches]);

  const chartData = useMemo(
    () =>
      [...compMatches]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((m, i) => ({ match: i + 1, elo: m.eloAfter })),
    [compMatches],
  );

  return (
    <div className="space-y-4">
      {/* 3 Elo stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          label="Elo Classique"
          value={String(profile.eloClassique)}
          sub={`${profile.winrateClassique}% · ${profile.winsClassique}V-${profile.lossesClassique}D`}
        />
        <StatTile
          label="Elo Rapide"
          value={String(profile.eloRapide)}
          sub={`${profile.winrateRapide}% · ${profile.winsRapide}V-${profile.lossesRapide}D`}
        />
        <StatTile
          label="Elo Blitz"
          value={String(profile.eloBlitz)}
          sub={`${profile.winrateBlitz}% · ${profile.winsBlitz}V-${profile.lossesBlitz}D`}
        />
      </div>

      <OrnamentDivider />

      {/* Elo chart */}
      <Panel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#e8823d]" />
            <h2 className="text-sm font-semibold text-[#2a2520]">Progression Elo</h2>
          </div>
          <SectionLabel>Compétitif · tous modes</SectionLabel>
        </div>
        {chartData.length === 0 ? (
          <div className="h-[220px] flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-sm text-[#9c8e7a]">
              Aucune partie compétitive pour l&apos;instant.
            </span>
            <Btn variant="primary" size="sm" onClick={() => setView("classselect")}>
              Lancer un duel
            </Btn>
          </div>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                <CartesianGrid stroke="#ebe2d2" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="match"
                  tick={{ fill: "#9c8e7a", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "#ebe2d2" }}
                  tickLine={{ stroke: "#ebe2d2" }}
                  label={{ value: "Partie", position: "insideBottom", offset: -2, fill: "#9c8e7a", fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: "#9c8e7a", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "#ebe2d2" }}
                  tickLine={{ stroke: "#ebe2d2" }}
                  domain={["dataMin - 20", "dataMax + 20"]}
                  width={44}
                />
                <RTooltip content={<EloTooltip />} />
                <Line
                  type="monotone"
                  dataKey="elo"
                  stroke="#e8823d"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#e8823d", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "#fce5d1", stroke: "#e8823d", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <OrnamentDivider />

      {/* Recent matches */}
      <Panel className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ebe2d2] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#2a2520]">Parties récentes</h2>
          <SectionLabel>10 dernières</SectionLabel>
        </div>
        <RecentTable matches={recent} />
      </Panel>

      <OrnamentDivider />

      {/* Category stats */}
      <Panel className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#7a9b6e]" />
            <h2 className="text-sm font-semibold text-[#2a2520]">Précision par catégorie</h2>
          </div>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border"
            style={{ color: "#c9974a", borderColor: "#c9974a55", background: "#c9974a12" }}
          >
            estimation
          </span>
        </div>
        <div className="space-y-2.5">
          {CATEGORIES.map((c) => (
            <CategoryBar key={c.label} label={c.label} pct={c.pct} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CategoryBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-[#6b5f4f]">{label}</span>
      <div
        className="relative h-2.5 flex-1 rounded-sm overflow-hidden"
        style={{ background: "#efe8db", border: "1px solid #ebe2d2" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-500"
          style={{ width: `${pct}%`, background: "#7a9b6e" }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-sm text-[#2a2520]">{pct}%</span>
    </div>
  );
}

/* ----------------------------------------------------------------
   Recent matches table (dense, min 5 rows)
   ---------------------------------------------------------------- */

type MatchRow = Record<string, ReactNode>;

function RecentTable({ matches }: { matches: MatchRecord[] }) {
  const rows = useMemo<MatchRow[]>(() => {
    const base: MatchRow[] = matches.map((m) => ({
      date: (
        <span className="text-[#9c8e7a]" title={new Date(m.createdAt).toLocaleString("fr-FR")}>
          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false, locale: fr })}
        </span>
      ),
      opponent: <span className="text-[#2a2520]">vs {m.opponentName}</span>,
      result: <ResultBadge result={m.result} />,
      elo: <EloDelta change={m.eloChange} />,
      mode: <ModeBadge mode={m.mode} />,
    }));
    // Pad to minimum 5 rows for density.
    while (base.length < 5) {
      base.push({
        date: <span className="text-[#c9bba0]">—</span>,
        opponent: <span className="text-[#c9bba0]">—</span>,
        result: <span className="text-[#c9bba0]">—</span>,
        elo: <span className="text-[#c9bba0]">—</span>,
        mode: <span className="text-[#c9bba0]">—</span>,
      });
    }
    return base;
  }, [matches]);

  return (
    <DataTable
      columns={[
        { key: "date", header: "Date", className: "w-28" },
        { key: "opponent", header: "Adversaire" },
        { key: "result", header: "Résultat", className: "w-24" },
        { key: "elo", header: "Elo ±", className: "w-20 text-right" },
        { key: "mode", header: "Mode", className: "w-28" },
      ]}
      rows={rows}
      rowKey={(_, i) => String(i)}
    />
  );
}

function ResultBadge({ result }: { result: "WIN" | "LOSE" }) {
  const win = result === "WIN";
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide"
      style={{
        color: win ? "#7a9b6e" : "#b5524a",
        background: win ? "#7a9b6e12" : "#b5524a12",
        border: `1px solid ${win ? "#7a9b6e55" : "#b5524a55"}`,
      }}
    >
      {win ? "Victoire" : "Défaite"}
    </span>
  );
}

function EloDelta({ change }: { change: number }) {
  const positive = change >= 0;
  return (
    <span
      className="font-mono text-right inline-block w-full"
      style={{ color: change === 0 ? "#9c8e7a" : positive ? "#7a9b6e" : "#b5524a" }}
    >
      {change > 0 ? "+" : ""}
      {change}
    </span>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const training = mode === "PRACTICE";
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium"
      style={{
        color: training ? "#c9974a" : "#6b5f4f",
        background: training ? "#faead8" : "#efe8db",
        border: `1px solid ${training ? "#f0b27a55" : "#ebe2d2"}`,
      }}
    >
      {MODE_LABELS[mode] ?? mode}
    </span>
  );
}

/* ----------------------------------------------------------------
   Stats tab — 3 cartes (une par mode) + synthèse
   ---------------------------------------------------------------- */

function StatsTab({ profile, matches }: { profile: Profile; matches: MatchRecord[] }) {
  const modes: ModeStat[] = [
    {
      key: "classique",
      label: "Classique",
      elo: profile.eloClassique,
      wins: profile.winsClassique,
      losses: profile.lossesClassique,
      winrate: profile.winrateClassique,
    },
    {
      key: "rapide",
      label: "Rapide",
      elo: profile.eloRapide,
      wins: profile.winsRapide,
      losses: profile.lossesRapide,
      winrate: profile.winrateRapide,
    },
    {
      key: "blitz",
      label: "Blitz",
      elo: profile.eloBlitz,
      wins: profile.winsBlitz,
      losses: profile.lossesBlitz,
      winrate: profile.winrateBlitz,
    },
  ];

  const arenaTotal = profile.winsArena + profile.lossesArena;
  const arenaWinrate = arenaTotal > 0 ? Math.round((profile.winsArena / arenaTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((m) => (
          <ModeStatCard key={m.key} stat={m} />
        ))}
      </div>

      <OrnamentDivider />

      <Panel className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-[#f0b27a]" />
          <h2 className="text-sm font-semibold text-[#2a2520]">Entraînement</h2>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border"
            style={{ color: "#c9974a", borderColor: "#c9974a55", background: "#c9974a12" }}
          >
            sans Elo
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SynthTile label="Victoires" value={String(profile.winsArena)} color="#7a9b6e" />
          <SynthTile label="Défaites" value={String(profile.lossesArena)} color="#b5524a" />
          <SynthTile label="Winrate" value={`${arenaWinrate}%`} color="#6b5f4f" />
        </div>
      </Panel>

      <Panel className="p-4">
        <h2 className="text-sm font-semibold mb-3 text-[#2a2520]">Synthèse</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SynthTile label="Modes joués" value={String(new Set(matches.map((m) => m.mode)).size)} color="#6b5f4f" />
          <SynthTile
            label="Total compétitif"
            value={String(matches.filter((m) => COMPETITIVE_MODES.has(m.mode)).length)}
            color="#6b5f4f"
          />
          <SynthTile
            label="Total entraînement"
            value={String(matches.filter((m) => m.mode === "PRACTICE").length)}
            color="#6b5f4f"
          />
          <SynthTile label="Catégories" value="8" color="#6b5f4f" />
        </div>
      </Panel>
    </div>
  );
}

function ModeStatCard({ stat }: { stat: ModeStat }) {
  const total = stat.wins + stat.losses;
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <SectionLabel>{stat.label}</SectionLabel>
        <RankBadge elo={stat.elo} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono font-bold text-2xl text-[#2a2520]">{stat.elo}</span>
        <span className="text-xs text-[#9c8e7a]">Elo</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-mono">
          <span className="text-[#7a9b6e]">{stat.wins}V</span>
          <span className="text-[#9c8e7a]"> · </span>
          <span className="text-[#b5524a]">{stat.losses}D</span>
        </span>
        <span className="font-mono text-[#6b5f4f]">{total} parties</span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1 text-[#9c8e7a]">
          <span>Winrate</span>
          <span className="font-mono">{stat.winrate}%</span>
        </div>
        <div
          className="relative h-1.5 rounded-sm overflow-hidden"
          style={{ background: "#efe8db", border: "1px solid #ebe2d2" }}
        >
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-500"
            style={{ width: `${Math.min(100, stat.winrate)}%`, background: "#e8823d" }}
          />
        </div>
      </div>
    </Panel>
  );
}

function SynthTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md p-3 bg-[#efe8db] border border-[#ebe2d2]">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a]">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   History tab — full table
   ---------------------------------------------------------------- */

function HistoryTab({ matches }: { matches: MatchRecord[] }) {
  const rows = useMemo<MatchRow[]>(() => {
    const base: MatchRow[] = matches.map((m) => ({
      date: (
        <span className="text-[#9c8e7a]" title={new Date(m.createdAt).toLocaleString("fr-FR")}>
          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false, locale: fr })}
        </span>
      ),
      opponent: <span className="text-[#2a2520]">vs {m.opponentName}</span>,
      result: <ResultBadge result={m.result} />,
      elo: <EloDelta change={m.eloChange} />,
      mode: <ModeBadge mode={m.mode} />,
      score: (
        <span className="font-mono text-[#6b5f4f]">
          {m.playerScore}-{m.opponentScore}
        </span>
      ),
    }));
    while (base.length < 5) {
      base.push({
        date: <span className="text-[#c9bba0]">—</span>,
        opponent: <span className="text-[#c9bba0]">—</span>,
        result: <span className="text-[#c9bba0]">—</span>,
        elo: <span className="text-[#c9bba0]">—</span>,
        mode: <span className="text-[#c9bba0]">—</span>,
        score: <span className="text-[#c9bba0]">—</span>,
      });
    }
    return base;
  }, [matches]);

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-[#ebe2d2] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#2a2520]">Historique complet</h2>
        <SectionLabel>{matches.length} parties</SectionLabel>
      </div>
      <DataTable
        columns={[
          { key: "date", header: "Date", className: "w-28" },
          { key: "opponent", header: "Adversaire" },
          { key: "result", header: "Résultat", className: "w-24" },
          { key: "elo", header: "Elo ±", className: "w-20 text-right" },
          { key: "score", header: "Score", className: "w-24 text-right" },
          { key: "mode", header: "Mode", className: "w-28" },
        ]}
        rows={rows}
        rowKey={(_, i) => String(i)}
      />
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Empty state — 0 match
   ---------------------------------------------------------------- */

function EmptyState() {
  const setView = useApp((s) => s.setView);
  return (
    <Panel className="p-10 flex flex-col items-center gap-4 text-center">
      <Clock className="w-8 h-8 text-[#9c8e7a]" />
      <div>
        <div className="text-base font-semibold text-[#2a2520]">Aucune partie jouée</div>
        <div className="text-sm mt-1 text-[#9c8e7a]">
          Lance ton premier duel pour commencer à grimper le classement.
        </div>
      </div>
      <Btn variant="primary" onClick={() => setView("classselect")}>
        Jouer
      </Btn>
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Coming soon (Succès / Amis / Paramètres)
   ---------------------------------------------------------------- */

function ComingSoon() {
  return (
    <Panel className="p-10 flex flex-col items-center gap-3 text-center">
      <Clock className="w-8 h-8 text-[#9c8e7a]" />
      <div className="text-base font-semibold text-[#2a2520]">Bientôt disponible</div>
      <div className="text-sm text-[#9c8e7a]">
        Cette section arrive dans une prochaine mise à jour.
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Recharts tooltips (warm light, typed)
   ---------------------------------------------------------------- */

interface TooltipPayloadItem {
  value?: number | string;
  name?: string;
  color?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number | string;
}

function EloTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-md px-2.5 py-1.5 text-xs"
      style={{ background: "#faf6f0", border: "1px solid #dcd0bc" }}
    >
      <div className="text-[#9c8e7a]">Partie #{label}</div>
      <div className="font-mono text-[#2a2520]">{payload[0].value} Elo</div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------- */

function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-md"
            style={{ background: "#faf6f0", border: "1px solid #ebe2d2" }}
          />
        ))}
      </div>
      <div
        className="h-[260px] rounded-md"
        style={{ background: "#faf6f0", border: "1px solid #ebe2d2" }}
      />
      <div
        className="rounded-md overflow-hidden"
        style={{ background: "#faf6f0", border: "1px solid #ebe2d2" }}
      >
        <div className="h-10 border-b border-[#ebe2d2]" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 border-b border-[#ebe2d2]" />
        ))}
      </div>
    </div>
  );
}
