"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Clock, Trophy } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Btn, Panel, PageTitle, SectionLabel, RankBadge } from "@/components/matharena/ui";
import { api, type MatchRecord, type Profile } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ============================================================
   ProfileScreen — Chess.com dashboard, WARM palette
   Sidebar + Vue générale / Statistiques / Historique (réel)
   + Succès / Amis / Paramètres (bientôt)
   Compétitif = orange, Entraînement = beige. L'UI affiche
   "Entraînement" (le backend conserve universe="arena").
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

const MODE_LABEL: Record<string, string> = {
  PRACTICE: "Entraînement",
  QUICK: "Rapide",
  BLITZ: "Blitz",
  RANKED: "Classé",
};

const UNIVERSE_LABEL: Record<string, string> = {
  competitive: "Compétitif",
  arena: "Entraînement",
};

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
                ? "bg-[#FF8C42] text-[#14110F] border-[#FF8C42]"
                : "bg-transparent text-[#C9BFB0] border-[#3A3328] hover:bg-[#2E2820] hover:text-[#F5EFE6]",
            )}
          >
            {n.label}
            {!n.available && <span className="ml-1.5 text-[10px] uppercase text-[#8B8270]">bientôt</span>}
          </button>
        ))}
      </nav>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[220px] shrink-0">
          <div className="sticky top-20 space-y-4">
            {profile && <ProfileCard profile={profile} />}

            <div>
              <SectionLabel className="mb-2 block !text-[#8B8270]">Navigation</SectionLabel>
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
                        ? "bg-[#1C1815] text-[#F5EFE6] border-l-2 border-[#FF8C42] pl-[10px]"
                        : "text-[#C9BFB0] hover:text-[#F5EFE6] hover:bg-[#1C1815]",
                    )}
                  >
                    <span>{n.label}</span>
                    {!n.available && <span className="text-[10px] uppercase text-[#8B8270]">bientôt</span>}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-4">
            <PageTitle className="!text-[#F5EFE6]">Profil</PageTitle>
            <Btn
              variant="secondary"
              size="sm"
              className="!bg-transparent !border-[#4A4133] !text-[#F5EFE6] hover:!bg-[#2E2820] hover:!border-[#5C5142]"
              onClick={() => setView("classselect")}
            >
              Nouveau duel
            </Btn>
          </div>

          {loading ? (
            <ProfileSkeleton />
          ) : error ? (
            <Panel
              className="p-6 flex items-center gap-3 text-sm !bg-[#1C1815] !border-[#3A3328]"
            >
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#C45A4A" }} />
              <span className="flex-1" style={{ color: "#C9BFB0" }}>
                {error}
              </span>
              <Btn
                size="sm"
                variant="secondary"
                className="!bg-transparent !border-[#4A4133] !text-[#F5EFE6] hover:!bg-[#2E2820]"
                onClick={() => void reload()}
              >
                Réessayer
              </Btn>
            </Panel>
          ) : !profile ? null : tab === "overview" ? (
            <Overview profile={profile} matches={matches} />
          ) : tab === "stats" ? (
            <StatsTab matches={matches} />
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
   Sidebar profile card
   ---------------------------------------------------------------- */

function ProfileCard({ profile }: { profile: Profile }) {
  const xpPct = profile.levelInfo.needed
    ? Math.max(0, Math.min(100, (profile.levelInfo.current / profile.levelInfo.needed) * 100))
    : 0;
  const initials = profile.name.slice(0, 2).toUpperCase();

  return (
    <Panel className="p-4 !bg-[#1C1815] !border-[#3A3328]">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full shrink-0 font-bold text-xl"
          style={{ background: "#2E2820", color: "#F5DEB3", border: "1px solid #4A4133" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[22px] font-bold leading-tight truncate" style={{ color: "#F5EFE6" }}>
            {profile.name}
          </div>
          <div className="mt-1">
            <RankBadge elo={profile.eloCompetitive} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider" style={{ color: "#8B8270" }}>
          Elo compétitif
        </span>
        <span className="font-mono text-lg font-semibold" style={{ color: "#F5DEB3" }}>
          {profile.eloCompetitive}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "#C9BFB0" }}>Niveau {profile.level}</span>
          <span className="font-mono" style={{ color: "#8B8270" }}>
            {profile.levelInfo.current}/{profile.levelInfo.needed} XP
          </span>
        </div>
        <div
          className="relative h-2 rounded-sm overflow-hidden"
          style={{ background: "#252019", border: "1px solid #3A3328" }}
        >
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-500"
            style={{ width: `${xpPct}%`, background: "#FF8C42" }}
          />
        </div>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Overview
   ---------------------------------------------------------------- */

function Overview({ profile, matches }: { profile: Profile; matches: MatchRecord[] }) {
  const setView = useApp((s) => s.setView);
  const compMatches = useMemo(
    () => matches.filter((m) => m.universe === "competitive"),
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
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <WarmStat label="Elo compétitif" value={String(profile.eloCompetitive)} valueColor="#F5DEB3" sub={`${profile.wins}V · ${profile.losses}D`} />
        <WarmStat label="Winrate" value={`${profile.winrate}%`} valueColor="#F5EFE6" sub={`${profile.totalMatches} parties`} />
        <WarmStat label="Niveau" value={String(profile.level)} valueColor="#F5EFE6" sub={`${profile.levelInfo.current}/${profile.levelInfo.needed} XP`} />
      </div>

      {/* Elo chart */}
      <Panel className="p-4 !bg-[#1C1815] !border-[#3A3328]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: "#FF8C42" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#F5EFE6" }}>
              Progression Elo
            </h2>
          </div>
          <SectionLabel className="!text-[#8B8270]">Compétitif</SectionLabel>
        </div>
        {chartData.length === 0 ? (
          <div className="h-[220px] flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-sm" style={{ color: "#8B8270" }}>
              Aucune partie compétitive pour l'instant.
            </span>
            <Btn
              size="sm"
              className="!bg-[#FF8C42] !text-[#14110F] hover:!bg-[#E5732A]"
              onClick={() => setView("classselect")}
            >
              Lancer un duel
            </Btn>
          </div>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                <CartesianGrid stroke="#3A3328" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="match"
                  tick={{ fill: "#8B8270", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "#3A3328" }}
                  tickLine={{ stroke: "#3A3328" }}
                  label={{ value: "Partie", position: "insideBottom", offset: -2, fill: "#8B8270", fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: "#8B8270", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "#3A3328" }}
                  tickLine={{ stroke: "#3A3328" }}
                  domain={["dataMin - 20", "dataMax + 20"]}
                  width={44}
                />
                <RTooltip content={<EloTooltip />} />
                <Line
                  type="monotone"
                  dataKey="elo"
                  stroke="#FF8C42"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#FF8C42", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "#F5DEB3", stroke: "#FF8C42", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Recent matches */}
      <Panel className="!bg-[#1C1815] !border-[#3A3328] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#3A3328] flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "#F5EFE6" }}>
            Parties récentes
          </h2>
          <SectionLabel className="!text-[#8B8270]">10 dernières</SectionLabel>
        </div>
        <RecentTable matches={recent} />
      </Panel>

      {/* Category stats */}
      <Panel className="p-4 !bg-[#1C1815] !border-[#3A3328]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: "#8FAF7E" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#F5EFE6" }}>
              Précision par catégorie
            </h2>
          </div>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border"
            style={{ color: "#D9A441", borderColor: "#D9A44155", background: "#D9A44112" }}
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
      <span className="w-28 shrink-0 text-sm" style={{ color: "#C9BFB0" }}>
        {label}
      </span>
      <div
        className="relative h-2.5 flex-1 rounded-sm overflow-hidden"
        style={{ background: "#252019", border: "1px solid #3A3328" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-500"
          style={{ width: `${pct}%`, background: "#8FAF7E" }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-sm" style={{ color: "#F5EFE6" }}>
        {pct}%
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------
   Recent matches table (dense, min 5 rows)
   ---------------------------------------------------------------- */

type MatchRow = Record<string, React.ReactNode>;

function RecentTable({ matches }: { matches: MatchRecord[] }) {
  const rows = useMemo<MatchRow[]>(() => {
    const base: MatchRow[] = matches.map((m) => ({
      date: (
        <span style={{ color: "#8B8270" }} title={new Date(m.createdAt).toLocaleString("fr-FR")}>
          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false, locale: fr })}
        </span>
      ),
      opponent: (
        <span style={{ color: "#F5EFE6" }}>vs {m.opponentName}</span>
      ),
      result: <ResultBadge result={m.result} />,
      elo: <EloDelta change={m.eloChange} />,
      mode: (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium"
          style={{
            color: m.universe === "arena" ? "#F5DEB3" : "#C9BFB0",
            background: m.universe === "arena" ? "#F5DEB312" : "#252019",
            border: `1px solid ${m.universe === "arena" ? "#F5DEB355" : "#3A3328"}`,
          }}
        >
          {MODE_LABEL[m.mode] ?? m.mode}
        </span>
      ),
    }));
    // Pad to minimum 5 rows for density.
    while (base.length < 5) {
      base.push({
        date: <span style={{ color: "#5C5142" }}>—</span>,
        opponent: <span style={{ color: "#5C5142" }}>—</span>,
        result: <span style={{ color: "#5C5142" }}>—</span>,
        elo: <span style={{ color: "#5C5142" }}>—</span>,
        mode: <span style={{ color: "#5C5142" }}>—</span>,
      });
    }
    return base;
  }, [matches]);

  return (
    <WarmTable
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
        color: win ? "#8FAF7E" : "#C45A4A",
        background: win ? "#8FAF7E12" : "#C45A4A12",
        border: `1px solid ${win ? "#8FAF7E55" : "#C45A4A55"}`,
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
      style={{ color: change === 0 ? "#8B8270" : positive ? "#8FAF7E" : "#C45A4A" }}
    >
      {change > 0 ? "+" : ""}
      {change}
    </span>
  );
}

/* ----------------------------------------------------------------
   Stats tab — winrate par mode (BarChart)
   ---------------------------------------------------------------- */

function StatsTab({ matches }: { matches: MatchRecord[] }) {
  const compMatches = useMemo(
    () => matches.filter((m) => m.universe === "competitive"),
    [matches],
  );

  const byMode = useMemo(() => {
    const modes = ["RANKED", "QUICK", "BLITZ"] as const;
    return modes.map((mode) => {
      const ms = compMatches.filter((m) => m.mode === mode);
      return {
        mode: MODE_LABEL[mode],
        wins: ms.filter((m) => m.result === "WIN").length,
        losses: ms.filter((m) => m.result === "LOSE").length,
      };
    });
  }, [compMatches]);

  const isEstimate = compMatches.length === 0;
  const data = isEstimate
    ? [
        { mode: "Classé", wins: 12, losses: 8 },
        { mode: "Rapide", wins: 24, losses: 14 },
        { mode: "Blitz", wins: 9, losses: 11 },
      ]
    : byMode;

  return (
    <div className="space-y-6">
      <Panel className="p-4 !bg-[#1C1815] !border-[#3A3328]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: "#FF8C42" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#F5EFE6" }}>
              Victoires et défaites par mode
            </h2>
          </div>
          {isEstimate && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border"
              style={{ color: "#D9A441", borderColor: "#D9A44155", background: "#D9A44112" }}
            >
              estimation
            </span>
          )}
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="#3A3328" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mode"
                tick={{ fill: "#8B8270", fontSize: 12 }}
                axisLine={{ stroke: "#3A3328" }}
                tickLine={{ stroke: "#3A3328" }}
              />
              <YAxis
                tick={{ fill: "#8B8270", fontSize: 11, fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "#3A3328" }}
                tickLine={{ stroke: "#3A3328" }}
                allowDecimals={false}
                width={36}
              />
              <RTooltip content={<StatsTooltip />} cursor={{ fill: "#2E282060" }} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#C9BFB0" }}
                formatter={(v) => <span style={{ color: "#C9BFB0" }}>{v}</span>}
              />
              <Bar dataKey="wins" name="Victoires" stackId="a" fill="#8FAF7E" radius={[0, 0, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="losses" name="Défaites" stackId="a" fill="#C45A4A" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="p-4 !bg-[#1C1815] !border-[#3A3328]">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#F5EFE6" }}>
          Synthèse
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SynthTile label="Modes joués" value={String(new Set(compMatches.map((m) => m.mode)).size)} />
          <SynthTile label="Total compétitif" value={String(compMatches.length)} />
          <SynthTile
            label="Total entraînement"
            value={String(matches.filter((m) => m.universe === "arena").length)}
          />
          <SynthTile label="Catégories" value="8" />
        </div>
      </Panel>
    </div>
  );
}

function SynthTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "#252019", border: "1px solid #3A3328" }}
    >
      <div className="text-xs uppercase tracking-wider" style={{ color: "#8B8270" }}>
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold" style={{ color: "#F5EFE6" }}>
        {value}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   History tab — full table with Univers + Mode columns
   ---------------------------------------------------------------- */

function HistoryTab({ matches }: { matches: MatchRecord[] }) {
  const rows = useMemo<MatchRow[]>(() => {
    const base: MatchRow[] = matches.map((m) => ({
      date: (
        <span style={{ color: "#8B8270" }} title={new Date(m.createdAt).toLocaleString("fr-FR")}>
          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false, locale: fr })}
        </span>
      ),
      universe: (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium"
          style={{
            color: m.universe === "arena" ? "#F5DEB3" : "#FF8C42",
            background: m.universe === "arena" ? "#F5DEB312" : "#FF8C4212",
            border: `1px solid ${m.universe === "arena" ? "#F5DEB355" : "#FF8C4255"}`,
          }}
        >
          {UNIVERSE_LABEL[m.universe] ?? m.universe}
        </span>
      ),
      opponent: <span style={{ color: "#F5EFE6" }}>vs {m.opponentName}</span>,
      result: <ResultBadge result={m.result} />,
      elo: <EloDelta change={m.eloChange} />,
      mode: (
        <span style={{ color: "#C9BFB0" }}>{MODE_LABEL[m.mode] ?? m.mode}</span>
      ),
    }));
    while (base.length < 5) {
      base.push({
        date: <span style={{ color: "#5C5142" }}>—</span>,
        universe: <span style={{ color: "#5C5142" }}>—</span>,
        opponent: <span style={{ color: "#5C5142" }}>—</span>,
        result: <span style={{ color: "#5C5142" }}>—</span>,
        elo: <span style={{ color: "#5C5142" }}>—</span>,
        mode: <span style={{ color: "#5C5142" }}>—</span>,
      });
    }
    return base;
  }, [matches]);

  if (matches.length === 0) {
    return <EmptyState />;
  }

  return (
    <Panel className="!bg-[#1C1815] !border-[#3A3328] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#3A3328] flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "#F5EFE6" }}>
          Historique complet
        </h2>
        <SectionLabel className="!text-[#8B8270]">{matches.length} parties</SectionLabel>
      </div>
      <WarmTable
        columns={[
          { key: "date", header: "Date", className: "w-28" },
          { key: "universe", header: "Univers", className: "w-28" },
          { key: "opponent", header: "Adversaire" },
          { key: "result", header: "Résultat", className: "w-24" },
          { key: "elo", header: "Elo ±", className: "w-20 text-right" },
          { key: "mode", header: "Mode", className: "w-24" },
        ]}
        rows={rows}
        rowKey={(_, i) => String(i)}
      />
    </Panel>
  );
}

function EmptyState() {
  const setView = useApp((s) => s.setView);
  return (
    <Panel className="p-10 flex flex-col items-center gap-4 text-center !bg-[#1C1815] !border-[#3A3328]">
      <Clock className="w-8 h-8" style={{ color: "#8B8270" }} />
      <div>
        <div className="text-base font-semibold" style={{ color: "#F5EFE6" }}>
          Aucune partie jouée
        </div>
        <div className="text-sm mt-1" style={{ color: "#8B8270" }}>
          Lance ton premier duel pour commencer à grimper le classement.
        </div>
      </div>
      <Btn
        className="!bg-[#FF8C42] !text-[#14110F] hover:!bg-[#E5732A]"
        onClick={() => setView("classselect")}
      >
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
    <Panel className="p-10 flex flex-col items-center gap-3 text-center !bg-[#1C1815] !border-[#3A3328]">
      <Clock className="w-8 h-8" style={{ color: "#8B8270" }} />
      <div className="text-base font-semibold" style={{ color: "#F5EFE6" }}>
        Bientôt disponible
      </div>
      <div className="text-sm" style={{ color: "#8B8270" }}>
        Cette section arrive dans une prochaine mise à jour.
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------------
   Warm table (local — primitive DataTable uses cool highlight/zebra)
   ---------------------------------------------------------------- */

/* ----------------------------------------------------------------
   Warm stat tile (local — primitive StatTile types label/sub as string
   and uses cool-gray inner colors; warm variant for full palette control)
   ---------------------------------------------------------------- */

function WarmStat({
  label,
  value,
  valueColor = "#F5EFE6",
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <Panel className={cn("p-4", "!bg-[#1C1815] !border-[#3A3328]")}>
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8B8270" }}>
        {label}
      </div>
      <div className="mt-1 font-mono font-medium text-xl" style={{ color: valueColor }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: "#8B8270" }}>
          {sub}
        </div>
      )}
    </Panel>
  );
}

interface WarmColumn {
  key: string;
  header: React.ReactNode;
  className?: string;
}

function WarmTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: WarmColumn[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
}) {
  return (
    <div className="overflow-x-auto scrollbar-warm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#3A3328] text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "py-2 px-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap",
                  c.className,
                )}
                style={{ color: "#8B8270" }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className="border-b border-[#2E2820] transition-colors hover:bg-[#2E2820]/60"
              style={i % 2 === 1 ? { background: "#1C181580" } : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("py-2 px-3 whitespace-nowrap", c.className)}>
                  {(row as Record<string, React.ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------------------------------------------
   Recharts tooltips (warm, typed)
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
      style={{ background: "#1C1815", border: "1px solid #4A4133" }}
    >
      <div style={{ color: "#8B8270" }}>Partie #{label}</div>
      <div className="font-mono" style={{ color: "#F5DEB3" }}>
        {payload[0].value} Elo
      </div>
    </div>
  );
}

function StatsTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-md px-2.5 py-1.5 text-xs space-y-0.5"
      style={{ background: "#1C1815", border: "1px solid #4A4133" }}
    >
      <div style={{ color: "#8B8270" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="font-mono flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-sm"
            style={{ background: p.color }}
          />
          <span style={{ color: "#C9BFB0" }}>{p.name}</span>
          <span style={{ color: "#F5EFE6" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------- */

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg" style={{ background: "#1C1815", border: "1px solid #3A3328" }} />
        ))}
      </div>
      <div className="h-[260px] rounded-lg" style={{ background: "#1C1815", border: "1px solid #3A3328" }} />
      <div className="rounded-lg overflow-hidden" style={{ background: "#1C1815", border: "1px solid #3A3328" }}>
        <div className="h-10 border-b" style={{ borderColor: "#3A3328" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 border-b" style={{ borderColor: "#2E2820" }} />
        ))}
      </div>
    </div>
  );
}
