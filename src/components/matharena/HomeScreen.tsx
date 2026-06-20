"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Btn, Panel, SectionTitle, RankBadge } from "./ui";
import { api, type LeaderboardEntry } from "@/lib/api";
import { divisionFor } from "@/lib/game/divisions";
import { Swords, Eye, Zap, Brain, Flame, Shield, Users, Activity, ArrowRight, ChevronRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const FLOATING = ["7+5", "12×7", "√144", "25%", "9²", "144÷12", "3x=21", "47+38", "8³", "16+29"];

const MODES = [
  { name: "Classé", emoji: "🏆", desc: "Matchmaking par Elo, saisons mensuelles, divisions Fer → Légende.", accent: "#f59e0b", tag: "ELO" },
  { name: "Partie rapide", emoji: "⚡", desc: "Sans enjeu, 10s par question. Pour s'échauffer.", accent: "#22c55e", tag: "CHAUD" },
  { name: "Blitz", emoji: "🔥", desc: "3 secondes par question. Ultra intense, impacte l'Elo.", accent: "#ef4444", tag: "RAPIDE" },
  { name: "Entraînement", emoji: "🧠", desc: "Contre une IA adaptative. Analyse de tes performances.", accent: "#7c3aed", tag: "SOLO" },
];

const STEPS = [
  { n: "01", icon: <Swords className="w-5 h-5" />, title: "Choisis ta classe", desc: "5 classes aux passifs et ultimes uniques. Guerrier tank, Mage burst, Assassin éclair…" },
  { n: "02", icon: <Brain className="w-5 h-5" />, title: "Calcule plus vite", desc: "Réponds en moins de 2s pour un coup critique. Enchaîne les bonnes réponses pour monter en combo." },
  { n: "03", icon: <TrophyIcon />, title: "Grimpe les divisions", desc: "Gagne de l'Elo, débloque sorts et ultimes, atteins le rang Légende." },
];

const TESTIMONIALS = [
  { name: "NeuroBlade", rank: 1480, text: "Le système de combo rend chaque question décisive. On ne peut pas se relâcher une seconde.", emoji: "🗡️" },
  { name: "PyroMath", rank: 1410, text: "Le mode Blitz est une drogue. 3 secondes par question, ton cerveau prend feu.", emoji: "🔮" },
  { name: "CalcQueen", rank: 1230, text: "Enfin un jeu de calcul qui se joue comme un vrai esport. Les classes changent tout.", emoji: "👑" },
];

function TrophyIcon() {
  return <Trophy className="w-5 h-5" />;
}

function useLivePlayers() {
  const [n, setN] = useState(1247);
  useEffect(() => {
    const t = setInterval(() => {
      setN((prev) => {
        const delta = Math.floor(Math.random() * 11) - 4;
        return Math.max(900, Math.min(2200, prev + delta));
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);
  return n;
}

export function HomeScreen() {
  const setView = useApp((s) => s.setView);
  const livePlayers = useLivePlayers();
  const [top, setTop] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.getLeaderboard().then(setTop).catch(() => {});
  }, []);

  return (
    <div className="grid-bg">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {FLOATING.map((t, i) => (
            <motion.span
              key={t}
              className="absolute font-mono font-bold text-white/[0.04] select-none"
              style={{
                left: `${(i * 11 + 5) % 92}%`,
                top: `${(i * 23 + 8) % 78}%`,
                fontSize: `${1.6 + (i % 3) * 0.7}rem`,
              }}
              animate={{ y: [0, -16, 0], opacity: [0.03, 0.1, 0.03] }}
              transition={{ duration: 6 + (i % 4), repeat: Infinity, delay: i * 0.35 }}
            >
              {t}
            </motion.span>
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-16 sm:pt-24 sm:pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(37,99,235,0.4)] bg-[rgba(37,99,235,0.1)] text-[#00d4ff] text-xs font-semibold mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
            </span>
            Bêta compétitive · {livePlayers.toLocaleString("fr-FR")} joueurs en ligne
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display font-extrabold tracking-tight leading-[1.02] text-5xl sm:text-7xl"
          >
            Your brain
            <br />
            is your{" "}
            <span className="text-[#2563eb] text-glow-blue">weapon</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 text-base sm:text-lg text-[#8b949e] max-w-2xl mx-auto"
          >
            MathArena est un <span className="text-white font-semibold">jeu compétitif</span> de calcul
            mental en duel 1v1. Choisis ta classe, enchaîne les combos, déchaîne ton ultime et grimpe
            les divisions. Ici, la rapidité tue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Btn size="lg" onClick={() => setView("classselect")} className="w-full sm:w-auto">
              <Swords className="w-5 h-5" /> Play Now
            </Btn>
            <Btn
              size="lg"
              variant="secondary"
              onClick={() => setView("leaderboard")}
              className="w-full sm:w-auto"
            >
              <Eye className="w-5 h-5" /> Voir un match
            </Btn>
          </motion.div>

          {/* stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
          >
            {[
              { n: "5", l: "Classes", icon: <Brain className="w-4 h-4" />, c: "#7c3aed" },
              { n: "7", l: "Sorts", icon: <Zap className="w-4 h-4" />, c: "#00d4ff" },
              { n: "4", l: "Modes", icon: <Activity className="w-4 h-4" />, c: "#22c55e" },
              { n: "x3", l: "Combo max", icon: <Flame className="w-4 h-4" />, c: "#ef4444" },
            ].map((s) => (
              <Panel key={s.l} className="py-4 px-3">
                <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: s.c }}>
                  {s.icon}
                </div>
                <div className="font-mono font-bold text-2xl">{s.n}</div>
                <div className="text-xs text-[#8b949e]">{s.l}</div>
              </Panel>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center mb-10">
          <SectionTitle className="text-3xl sm:text-4xl">Comment ça marche</SectionTitle>
          <p className="text-[#8b949e] mt-2 text-sm">Trois étapes pour entrer dans l'arène.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Panel hover className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono font-bold text-3xl text-[rgba(37,99,235,0.5)]">{s.n}</span>
                  <span className="grid place-items-center w-10 h-10 rounded-lg bg-[rgba(37,99,235,0.12)] text-[#2563eb]">
                    {s.icon}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-[#8b949e]">{s.desc}</p>
              </Panel>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== GAME MODES ===== */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center mb-10">
          <SectionTitle className="text-3xl sm:text-4xl">Modes de jeu</SectionTitle>
          <p className="text-[#8b949e] mt-2 text-sm">Du échauffement au classé sans pitié.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODES.map((m) => (
            <Panel key={m.name} hover className="p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{m.emoji}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{ color: m.accent, background: `${m.accent}1f`, border: `1px solid ${m.accent}55` }}
                >
                  {m.tag}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg" style={{ color: m.accent }}>{m.name}</h3>
              <p className="text-sm text-[#8b949e] mt-1">{m.desc}</p>
            </Panel>
          ))}
        </div>
      </section>

      {/* ===== LEADERBOARD PREVIEW ===== */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <SectionTitle className="text-3xl sm:text-4xl">Top calculateurs</SectionTitle>
            <p className="text-[#8b949e] mt-2 text-sm">Le classement mondial en temps réel.</p>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => setView("leaderboard")} className="hidden sm:inline-flex">
            Tout voir <ChevronRight className="w-4 h-4" />
          </Btn>
        </div>
        <Panel className="overflow-hidden">
          <div className="divide-y divide-[#30363d]">
            {top.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#21262d]",
                  p.isMe && "bg-[rgba(37,99,235,0.1)]",
                )}
              >
                <span className="font-mono font-bold text-[#8b949e] w-8 text-center">
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                </span>
                <span className="text-lg">{p.class ? classEmoji(p.class) : "🧠"}</span>
                <span className="font-semibold flex-1 min-w-0 truncate">
                  {p.name}
                  {p.isMe && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#2563eb] text-white font-bold">TOI</span>}
                </span>
                <RankBadge elo={p.elo} className="hidden sm:inline-flex" />
                <span className="font-mono font-bold text-lg w-16 text-right">{p.elo}</span>
              </div>
            ))}
            {top.length === 0 && (
              <div className="px-4 py-8 text-center text-[#8b949e] text-sm">Chargement du classement…</div>
            )}
          </div>
        </Panel>
        <div className="mt-4 text-center sm:hidden">
          <Btn variant="secondary" size="sm" onClick={() => setView("leaderboard")}>
            Voir le classement <ArrowRight className="w-4 h-4" />
          </Btn>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center mb-10">
          <SectionTitle className="text-3xl sm:text-4xl">Ils calculent, ils racontent</SectionTitle>
          <p className="text-[#8b949e] mt-2 text-sm">La communauté MathArena.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => {
            const d = divisionFor(t.rank);
            return (
              <Panel key={t.name} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <RankBadge elo={t.rank} />
                    <span className="sr-only">{d.name}</span>
                  </div>
                </div>
                <p className="text-sm text-[#8b949e] italic">« {t.text} »</p>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Panel className="p-8 sm:p-12 glow-blue border-[rgba(37,99,235,0.4)]">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl">Prêt à entrer dans l'arène ?</h2>
          <p className="text-[#8b949e] mt-3 max-w-md mx-auto">
            Premier duel en moins de 10 secondes. Aucune inscription requise.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Btn size="lg" onClick={() => setView("classselect")}>
              <Swords className="w-5 h-5" /> Commencer maintenant
            </Btn>
            <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
              <Users className="w-4 h-4" /> {livePlayers.toLocaleString("fr-FR")} en ligne
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function classEmoji(c: string | null): string {
  const map: Record<string, string> = {
    guerrier: "⚔️",
    mage: "🔮",
    gardien: "🛡️",
    assassin: "🗡️",
    alchimiste: "⚗️",
  };
  return c ? map[c] ?? "🧠" : "🧠";
}
