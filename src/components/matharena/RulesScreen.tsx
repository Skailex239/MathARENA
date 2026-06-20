"use client";

import * as React from "react";
import { Heart, Zap, Shield, Sparkles, AlertTriangle, Swords } from "lucide-react";

import { Panel, PageTitle, SectionLabel, StatTile, DataTable } from "@/components/matharena/ui";
import { Btn } from "@/components/matharena/ui";
import { useApp } from "@/lib/store";
import { CLASS_LIST } from "@/lib/game/classes";
import { SPELL_LIST } from "@/lib/game/spells";
import { DIVISIONS } from "@/lib/game/divisions";
import { cn } from "@/lib/utils";

/* ============================================================
   RulesScreen — Linear / GitHub docs style
   Sobre, dense, peu de couleur
   ============================================================ */

export default function RulesScreen() {
  const setView = useApp((s) => s.setView);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <header className="mb-8">
        <PageTitle>Comment jouer</PageTitle>
        <p className="mt-2 text-sm text-[#9ba4b0] leading-relaxed">
          MathArena est un duel 1v1 de calcul mental. Réponds vite et juste pour infliger des dégâts,
          enchaîne les bonnes réponses pour monter ton combo, débloque des sorts et ton ultime pour
          prendre l'ascendant. Le premier à 0 PV perd.
        </p>
        <div className="mt-4">
          <Btn size="sm" onClick={() => setView("classselect")}>
            <Swords className="w-3.5 h-3.5" />
            Lancer un duel
          </Btn>
        </div>
      </header>

      {/* Sections */}
      <div className="space-y-12">
        <PrincipeSection />
        <DamageSection />
        <ComboSection />
        <ClassesSection />
        <SpellsSection />
        <ModesSection />
        <DivisionsSection />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Section wrapper helper
   ---------------------------------------------------------------- */

function Section({
  id,
  label,
  title,
  intro,
  children,
}: {
  id: string;
  label: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4">
        <SectionLabel>{label}</SectionLabel>
        <h2 className="mt-1 text-lg font-semibold text-[#e6edf3] tracking-tight">{title}</h2>
        {intro && <p className="mt-1 text-sm text-[#9ba4b0] leading-relaxed">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

/* ----------------------------------------------------------------
   Principe — 4 tuiles sobres
   ---------------------------------------------------------------- */

function PrincipeSection() {
  return (
    <Section
      id="principe"
      label="Principe"
      title="Les ressources du combat"
      intro="Chaque combattant démarre avec des PV, de l'énergie, et peut gagner un bouclier. Les ultimes se déclenchent via le combo."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatTile
          label="Points de vie"
          value={
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#f85149]" />
              <span className="font-mono">100</span>
            </span>
          }
          sub="À 0 = défaite"
        />
        <StatTile
          label="Énergie"
          value={
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#3b82f6]" />
              <span className="font-mono">0 → 100</span>
            </span>
          }
          sub="Pour les sorts"
        />
        <StatTile
          label="Bouclier"
          value={
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#9ba4b0]" />
              <span className="font-mono">+10</span>
            </span>
          }
          sub="Absorbe les dégâts"
        />
        <StatTile
          label="Ultime"
          value={
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3b82f6]" />
              <span className="font-mono">combo 10</span>
            </span>
          }
          sub="Spécifique à la classe"
        />
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------
   Dégâts selon la vitesse — DataTable
   ---------------------------------------------------------------- */

function DamageSection() {
  const rows = [
    { time: "< 2 s", dmg: <span className="font-mono text-[#f85149]">20</span>, kind: "Coup critique" },
    { time: "2 – 4 s", dmg: <span className="font-mono text-[#e6edf3]">15</span>, kind: "Élevé" },
    { time: "4 – 6 s", dmg: <span className="font-mono text-[#e6edf3]">10</span>, kind: "Standard" },
    { time: "6 – 10 s", dmg: <span className="font-mono text-[#9ba4b0]">5</span>, kind: "Faible" },
  ];

  return (
    <Section
      id="degats"
      label="Combat"
      title="Dégâts selon la vitesse"
      intro="Plus tu réponds vite, plus tu frappes fort. Le timer de chaque question est de 10 secondes."
    >
      <Panel className="overflow-hidden">
        <DataTable
          columns={[
            { key: "time", header: "Temps" },
            { key: "dmg", header: "Dégâts" },
            { key: "kind", header: "Type" },
          ]}
          rows={rows}
          rowKey={(_, i) => String(i)}
        />
      </Panel>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-start gap-2 text-[#9ba4b0]">
          <AlertTriangle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
          <span>
            <span className="text-[#e6edf3] font-medium">Mauvaise réponse :</span> tu subis des dégâts
            (variable selon ta classe, souvent 10). Certains passifs réduisent ou amplifient ce montant.
          </span>
        </div>
        <div className="flex items-start gap-2 text-[#9ba4b0]">
          <AlertTriangle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
          <span>
            <span className="text-[#e6edf3] font-medium">Timeout (10 s) :</span> l'adversaire régénère
            5 PV et ton combo retombe à 0.
          </span>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------
   Combos — 4 lignes simples
   ---------------------------------------------------------------- */

function ComboSection() {
  const combos = [
    { threshold: "3 bonnes", mult: "×1,5", effect: "Bonus de dégâts" },
    { threshold: "5 bonnes", mult: "×2", effect: "Combo standard (×2 sur la plupart des classes)" },
    { threshold: "8 bonnes", mult: "×3", effect: "Les sorts deviennent disponibles" },
    { threshold: "10 bonnes", mult: "Ultime", effect: "Ultime de classe débloqué" },
  ];
  return (
    <Section
      id="combos"
      label="Combat"
      title="Enchaînement de combos"
      intro="Une bonne réponse incrémente ton combo. Une erreur ou un timeout le remet à 0. Les multiplicateurs s'appliquent aux dégâts infligés."
    >
      <Panel className="overflow-hidden">
        <DataTable
          columns={[
            { key: "threshold", header: "Combo" },
            { key: "mult", header: "Multiplicateur" },
            { key: "effect", header: "Effet" },
          ]}
          rows={combos.map((c) => ({
            threshold: <span className="text-[#e6edf3]">{c.threshold}</span>,
            mult: <span className="font-mono text-[#3b82f6]">{c.mult}</span>,
            effect: <span className="text-[#9ba4b0]">{c.effect}</span>,
          }))}
          rowKey={(_, i) => String(i)}
        />
      </Panel>
    </Section>
  );
}

/* ----------------------------------------------------------------
   Classes — table compacte
   ---------------------------------------------------------------- */

function ClassesSection() {
  return (
    <Section
      id="classes"
      label="Classes"
      title="Les 5 classes"
      intro="Chaque classe a un passif, un ultime et une faiblesse. Le seuil de combo ×2 varie selon la classe."
    >
      <Panel className="overflow-hidden">
        <DataTable
          columns={[
            { key: "name", header: "Classe", className: "min-w-[140px]" },
            { key: "hp", header: "PV" },
            { key: "x2", header: "Combo ×2" },
            { key: "passive", header: "Passif" },
            { key: "ultimate", header: "Ultime" },
            { key: "weakness", header: "Faiblesse" },
          ]}
          rows={CLASS_LIST.map((c) => ({
            name: (
              <span className="text-[#e6edf3]">
                {c.emoji} {c.name}
              </span>
            ),
            hp: <span className="font-mono text-[#9ba4b0]">{c.hp}</span>,
            x2: <span className="font-mono text-[#9ba4b0]">x{c.x2Threshold}</span>,
            passive: (
              <span className="text-[#9ba4b0]">
                <span className="text-[#e6edf3]">{c.passive.name}.</span> {c.passive.description}
              </span>
            ),
            ultimate: (
              <span className="text-[#9ba4b0]">
                <span className="text-[#e6edf3]">{c.ultimate.name}.</span> {c.ultimate.description}
              </span>
            ),
            weakness: <span className="text-[#9ba4b0]">{c.weakness}</span>,
          }))}
          rowKey={(_, i) => String(i)}
        />
      </Panel>
    </Section>
  );
}

/* ----------------------------------------------------------------
   Sorts — table compacte
   ---------------------------------------------------------------- */

function SpellsSection() {
  return (
    <Section
      id="sorts"
      label="Sorts"
      title="Les sorts"
      intro="Les sorts coûtent de l'énergie (gagnée via les bonnes réponses). Ils se débloquent à partir d'un combo de 8."
    >
      <Panel className="overflow-hidden">
        <DataTable
          columns={[
            { key: "name", header: "Sort", className: "min-w-[120px]" },
            { key: "cost", header: "Coût" },
            { key: "target", header: "Cible" },
            { key: "description", header: "Description" },
          ]}
          rows={SPELL_LIST.map((s) => ({
            name: (
              <span className="text-[#e6edf3]">
                {s.emoji} {s.name}
              </span>
            ),
            cost: <span className="font-mono text-[#3b82f6]">{s.cost}</span>,
            target: (
              <span
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide border",
                  s.target === "self"
                    ? "text-[#2ea043] border-[#2ea043]/40 bg-[#2ea043]/10"
                    : "text-[#f85149] border-[#f85149]/40 bg-[#f85149]/10",
                )}
              >
                {s.target === "self" ? "Soi" : "Adv."}
              </span>
            ),
            description: <span className="text-[#9ba4b0]">{s.description}</span>,
          }))}
          rowKey={(_, i) => String(i)}
        />
      </Panel>
    </Section>
  );
}

/* ----------------------------------------------------------------
   Modes — 4 lignes
   ---------------------------------------------------------------- */

function ModesSection() {
  const modes = [
    {
      name: "Entraînement",
      key: "PRACTICE",
      desc: "Mode détendu. Aucun impact sur l'Elo ni l'XP. Idéal pour tester une classe.",
    },
    {
      name: "Rapide",
      key: "QUICK",
      desc: "Duel standard avec gains d'XP. Aucun impact sur l'Elo.",
    },
    {
      name: "Blitz",
      key: "BLITZ",
      desc: "Questions plus courtes, rythme intensif. Gains d'XP accélérés.",
    },
    {
      name: "Classé",
      key: "RANKED",
      desc: "Duel officiel avec mise à jour de l'Elo (gain ou perte selon le résultat).",
    },
  ];
  return (
    <Section
      id="modes"
      label="Modes"
      title="Modes de jeu"
      intro="Quatre modes pour varier l'intensité. Seul le mode Classé affecte ton Elo."
    >
      <Panel className="overflow-hidden">
        <DataTable
          columns={[
            { key: "name", header: "Mode", className: "min-w-[140px]" },
            { key: "key", header: "Identifiant" },
            { key: "desc", header: "Description" },
          ]}
          rows={modes.map((m) => ({
            name: <span className="text-[#e6edf3]">{m.name}</span>,
            key: <span className="font-mono text-[#6e7681]">{m.key}</span>,
            desc: <span className="text-[#9ba4b0]">{m.desc}</span>,
          }))}
          rowKey={(_, i) => String(i)}
        />
      </Panel>
    </Section>
  );
}

/* ----------------------------------------------------------------
   Divisions — table avec dot couleur
   ---------------------------------------------------------------- */

function DivisionsSection() {
  return (
    <Section
      id="divisions"
      label="Progression"
      title="Divisions"
      intro="Ton Elo détermine ta division. Les divisions sont purement cosmétiques mais reflètent ton niveau global."
    >
      <Panel className="overflow-hidden">
        <DataTable
          columns={[
            { key: "tier", header: "Tier" },
            { key: "name", header: "Division", className: "min-w-[140px]" },
            { key: "dot", header: "Couleur" },
            { key: "min", header: "Elo minimum" },
          ]}
          rows={DIVISIONS.map((d) => ({
            tier: <span className="font-mono text-[#6e7681]">{d.tier}</span>,
            name: (
              <span className="text-[#e6edf3] flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: d.color }}
                  aria-hidden
                />
                {d.name}
              </span>
            ),
            dot: (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded border"
                  style={{ background: `${d.color}22`, borderColor: `${d.color}55` }}
                />
                <span className="font-mono text-xs text-[#9ba4b0]">{d.color}</span>
              </span>
            ),
            min: <span className="font-mono text-[#e6edf3]">{d.min}</span>,
          }))}
          rowKey={(_, i) => String(i)}
        />
      </Panel>
    </Section>
  );
}
