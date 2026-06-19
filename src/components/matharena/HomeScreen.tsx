"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { CLASS_LIST, ACCENT_CLASSES } from "@/lib/game/classes";
import { SPELL_LIST } from "@/lib/game/spells";
import { Button } from "@/components/ui/button";
import { Swords, Trophy, Zap, Brain, Shield, Sparkles, Flame, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const FLOATING = ["7+5", "12×7", "√144", "25%", "9²", "144÷12", "3x=21", "47+38"];

const MODES = [
  { name: "Classé", desc: "Matchmaking par Elo, saisons mensuelles, divisions Fer → Légende.", emoji: "🏆", accent: "text-[#ffb02e]" },
  { name: "Partie rapide", desc: "Sans enjeu, 5 min max. Pour s'échauffer.", emoji: "⚡", accent: "text-[#3ddc84]" },
  { name: "Blitz", desc: "3 secondes par question. Ultra intense.", emoji: "🔥", accent: "text-[#f44747]" },
  { name: "Entraînement", desc: "Contre une IA adaptative. Analyse de tes perf.", emoji: "🧠", accent: "text-[#b15cff]" },
];

export function HomeScreen() {
  const setView = useApp((s) => s.setView);

  return (
    <div className="grid-bg">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {FLOATING.map((t, i) => (
            <motion.span
              key={t}
              className="absolute font-mono font-bold text-foreground/5 select-none"
              style={{
                left: `${(i * 13 + 6) % 92}%`,
                top: `${(i * 27 + 10) % 80}%`,
                fontSize: `${1.5 + (i % 3)}rem`,
              }}
              animate={{ y: [0, -14, 0], opacity: [0.04, 0.12, 0.04] }}
              transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.4 }}
            >
              {t}
            </motion.span>
          ))}
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ff3d8b]/40 bg-[#ff3d8b]/10 text-[#ff3d8b] text-xs font-semibold mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> Bêta compétitive — 1v1 temps réel
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]"
          >
            Ton cerveau
            <br />
            est ton{" "}
            <span className="text-[#ff3d8b] text-glow-magenta">arme</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            MathArena est un <span className="text-foreground font-semibold">jeu compétitif</span> de
            calcul mental en duel. Choisis ta classe, enchaîne les combos, déchaîne ton ultime et
            grimpe les divisions. Ici, la rapidité tue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              onClick={() => setView("classselect")}
              className="h-12 px-7 text-base bg-[#ff3d8b] hover:bg-[#ff3d8b]/85 text-white font-bold box-glow-magenta"
            >
              <Swords className="w-5 h-5 mr-2" /> Lancer un duel
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView("leaderboard")}
              className="h-12 px-6 text-base border-border/70 hover:border-[#ffb02e]/60"
            >
              <Trophy className="w-5 h-5 mr-2" /> Classement
            </Button>
          </motion.div>

          {/* stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
          >
            {[
              { n: "5", l: "Classes", icon: <Brain className="w-4 h-4" /> },
              { n: "7", l: "Sorts", icon: <Zap className="w-4 h-4" /> },
              { n: "4", l: "Modes", icon: <Timer className="w-4 h-4" /> },
              { n: "x3", l: "Combos max", icon: <Flame className="w-4 h-4" /> },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-border/60 bg-card/50 backdrop-blur py-4 px-3"
              >
                <div className="flex items-center justify-center gap-1.5 text-[#ffb02e] mb-1">
                  {s.icon}
                </div>
                <div className="text-2xl font-black">{s.n}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CLASSES */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black">Choisis ta classe</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Cinq styles de combat, cinq ultimes dévastateurs.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CLASS_LIST.map((c, i) => {
            const a = ACCENT_CLASSES[c.accent];
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setView("classselect")}
                className={cn(
                  "group rounded-2xl border bg-gradient-to-b p-4 text-left transition-all hover:scale-[1.03]",
                  a.border,
                  a.from,
                  a.to,
                )}
              >
                <div className="text-4xl mb-2">{c.emoji}</div>
                <div className={cn("font-bold", a.text)}>{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.tagline}</div>
                <div className="mt-2 text-[11px] font-mono">{c.hp} PV</div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* COMBAT SYSTEM */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <Flame className="w-5 h-5 text-[#ff3d8b]" />,
              title: "Dégâts selon la vitesse",
              desc: "Moins de 2s = coup critique (20 dégâts). Au-delà de 6s, à peine 5. Chaque milliseconde compte.",
            },
            {
              icon: <Zap className="w-5 h-5 text-[#ffb02e]" />,
              title: "Combos enchaînés",
              desc: "3 bonnes = x1.5, 5 = x2, 8 = x3 + sorts débloqués, 10 = ULTIME disponible.",
            },
            {
              icon: <Shield className="w-5 h-5 text-[#3ddc84]" />,
              title: "Sorts & stratégies",
              desc: `${SPELL_LIST.length} sorts : gel, feu, soin, confusion, miroir, silence, échange. Perturbe, survis, frappe.`,
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODES */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black">Modes de jeu</h2>
          <p className="text-muted-foreground mt-2 text-sm">Du échauffement au classé sans pitié.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODES.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5"
            >
              <div className="text-3xl mb-2">{m.emoji}</div>
              <h3 className={cn("font-bold", m.accent)}>{m.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-[#ff3d8b]/40 bg-gradient-to-br from-[#ff3d8b]/10 to-transparent p-8 sm:p-12 box-glow-magenta">
          <h2 className="text-3xl sm:text-4xl font-black">Prêt à entrer dans l'arène ?</h2>
          <p className="text-muted-foreground mt-3">
            Premier duel en moins de 10 secondes. Aucune inscription requise.
          </p>
          <Button
            size="lg"
            onClick={() => setView("classselect")}
            className="mt-6 h-12 px-8 text-base bg-[#ff3d8b] hover:bg-[#ff3d8b]/85 text-white font-bold"
          >
            <Swords className="w-5 h-5 mr-2" /> Commencer maintenant
          </Button>
        </div>
      </section>
    </div>
  );
}
