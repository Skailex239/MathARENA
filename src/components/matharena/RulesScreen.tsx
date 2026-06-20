'use client';

import { type ReactNode } from 'react';
import {
  Heart, Zap, Shield, Sparkles, Flame, Timer, Swords, Target,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { CLASS_LIST } from '@/lib/game/classes';
import { SPELL_LIST } from '@/lib/game/spells';
import { DIVISIONS } from '@/lib/game/divisions';
import { Btn, Panel, SectionTitle } from '@/components/matharena/ui';
import { useApp } from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

interface DamageTier {
  time: string;
  label: string;
  dmg: number;
  color: string;
}

const DAMAGE_TIERS: DamageTier[] = [
  { time: '< 2 s', label: 'CRIT', dmg: 20, color: '#ef4444' },
  { time: '2 – 4 s', label: 'Élevé', dmg: 15, color: '#f59e0b' },
  { time: '4 – 6 s', label: 'Standard', dmg: 10, color: '#00d4ff' },
  { time: '6 – 10 s', label: 'Faible', dmg: 5, color: '#7c3aed' },
];

const COMBO_TIERS = [
  { combo: 3, mult: 'x1.5', desc: 'Combo déclenché — dégâts amplifiés.', color: '#f59e0b' },
  { combo: 5, mult: 'x2', desc: 'Dégâts doublés (seuil ajusté par classe).', color: '#7c3aed' },
  { combo: 8, mult: 'x3', desc: 'Sorts disponibles — dépense ton énergie.', color: '#00d4ff' },
  { combo: 10, mult: 'ULTIME', desc: 'Ultime de classe débloqué.', color: '#ef4444' },
];

interface ModeInfo {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  elo: boolean;
  color: string;
}

const MODES: ModeInfo[] = [
  {
    id: 'PRACTICE',
    emoji: '🧪',
    name: 'Practice',
    desc: "Entraînement contre une IA passive. 0 Elo, 0 pression — parfait pour découvrir les mécaniques.",
    elo: false,
    color: '#7c3aed',
  },
  {
    id: 'QUICK',
    emoji: '⚡',
    name: 'Quick',
    desc: "Match rapide contre l'IA, sans enjeu (0 Elo). Idéal pour s'échauffer.",
    elo: false,
    color: '#f59e0b',
  },
  {
    id: 'BLITZ',
    emoji: '🔥',
    name: 'Blitz',
    desc: '3 secondes par question. Mode nerveux qui rapporte de l\'Elo.',
    elo: true,
    color: '#ef4444',
  },
  {
    id: 'RANKED',
    emoji: '🏆',
    name: 'Ranked',
    desc: 'Match classé contre une IA adaptative. Difficulté croissante, Elo en jeu.',
    elo: true,
    color: '#2563eb',
  },
];

const PRINCIPLE_TILES: { icon: LucideIcon; label: string; value: string; desc: string; color: string }[] = [
  { icon: Heart, label: 'PV', value: '100', desc: 'Points de vie', color: '#ef4444' },
  { icon: Zap, label: 'Énergie', value: '0-100', desc: 'Pour lancer des sorts', color: '#f59e0b' },
  { icon: Shield, label: 'Bouclier', value: '+10', desc: 'Absorbe les dégâts', color: '#22c55e' },
  { icon: Sparkles, label: 'Ultime', value: 'Combo 10', desc: 'Débloqué via combos', color: '#00d4ff' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function RuleSectionTitle({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-5 w-1 shrink-0 rounded-full bg-[#2563eb] shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
      <div className="min-w-0">
        <SectionTitle className="text-xl sm:text-2xl">{children}</SectionTitle>
        {subtitle && <p className="mt-0.5 text-sm text-[#8b949e]">{subtitle}</p>}
      </div>
    </div>
  );
}

function SectionWrap({
  children,
}: {
  children: ReactNode;
}) {
  return <section className="space-y-4">{children}</section>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function RulesScreen() {
  const setView = useApp((s) => s.setView);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 pt-6 lg:px-8">
      {/* Hero */}
      <Panel className="relative overflow-hidden p-6 sm:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 0%, rgba(37,99,235,0.18), transparent 55%), radial-gradient(circle at 90% 0%, rgba(124,58,237,0.14), transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <div className="text-5xl">🧠</div>
          <SectionTitle className="text-3xl text-glow-cyan sm:text-4xl">Comment jouer</SectionTitle>
          <p className="max-w-2xl text-sm text-[#8b949e]">
            MathArena est un duel 1v1 de calcul mental en temps réel. Ton cerveau est ton arme :
            réponds vite, enchaîne les combos, déchaîne ton ultime.
          </p>
          <Btn size="lg" onClick={() => setView('classselect')} className="mt-2 min-h-11">
            <Swords className="size-4" /> Lancer un duel
          </Btn>
        </div>
      </Panel>

      {/* Principe */}
      <SectionWrap>
        <RuleSectionTitle subtitle="Un duel 1v1 au mental">
          Le principe
        </RuleSectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRINCIPLE_TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Panel key={t.label} className="p-4 text-center" hover>
                <div
                  className="mx-auto grid size-11 place-items-center rounded-lg border"
                  style={{
                    borderColor: `${t.color}80`,
                    background: `${t.color}1a`,
                    color: t.color,
                    boxShadow: `0 0 16px ${t.color}33`,
                  }}
                >
                  <Icon className="size-5" />
                </div>
                <div className="mt-2 font-mono text-lg font-bold text-white">{t.value}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
                  {t.label}
                </div>
                <div className="mt-0.5 text-[11px] text-[#8b949e]">{t.desc}</div>
              </Panel>
            );
          })}
        </div>
        <p className="px-1 text-sm text-[#8b949e]">
          À chaque question, le plus rapide inflige des dégâts. Le premier qui tombe à 0 PV perd.
          Les sorts coûtent de l&apos;énergie, l&apos;ultime se débloque via les combos.
        </p>
      </SectionWrap>

      {/* Dégâts selon la vitesse */}
      <SectionWrap>
        <RuleSectionTitle subtitle="Plus tu réponds vite, plus tu frappes fort">
          Dégâts selon la vitesse
        </RuleSectionTitle>
        <Panel className="overflow-hidden p-0">
          <div className="grid grid-cols-1 sm:grid-cols-4">
            {DAMAGE_TIERS.map((t, i) => (
              <div
                key={t.label}
                className={cn(
                  'relative flex items-center justify-between gap-3 p-4 sm:flex-col sm:items-start sm:gap-1',
                  i !== 0 && 'border-t border-[#30363d] sm:border-l sm:border-t-0',
                )}
              >
                <div className="flex flex-col">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: t.color }}
                  >
                    {t.label}
                  </span>
                  <span className="font-mono text-xs text-[#8b949e]">{t.time}</span>
                </div>
                <div
                  className="font-mono text-3xl font-black"
                  style={{ color: t.color, textShadow: `0 0 14px ${t.color}55` }}
                >
                  {t.dmg}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-[#ef4444]/30 bg-[rgba(239,68,68,0.06)] p-3">
            <Flame className="mt-0.5 size-5 shrink-0 text-[#ef4444]" />
            <div>
              <div className="text-sm font-semibold text-white">Mauvaise réponse</div>
              <div className="text-[11px] text-[#8b949e]">
                Tu perds 10 PV (5 en Guerrier, 15 en Assassin).
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-[#f59e0b]/30 bg-[rgba(245,158,11,0.06)] p-3">
            <Timer className="mt-0.5 size-5 shrink-0 text-[#f59e0b]" />
            <div>
              <div className="text-sm font-semibold text-white">Timeout</div>
              <div className="text-[11px] text-[#8b949e]">
                L&apos;adversaire récupère 5 PV si tu ne réponds pas à temps.
              </div>
            </div>
          </div>
        </div>
      </SectionWrap>

      {/* Combos */}
      <SectionWrap>
        <RuleSectionTitle subtitle="Enchaîne les bonnes réponses pour amplifier tes dégâts">
          Combos
        </RuleSectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {COMBO_TIERS.map((c) => (
            <Panel key={c.combo} className="p-4" hover>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#8b949e]">Combo</span>
                <span className="font-mono text-sm font-bold" style={{ color: c.color }}>
                  {c.combo}
                </span>
              </div>
              <div
                className="mt-1 font-display text-2xl font-extrabold"
                style={{ color: c.color, textShadow: `0 0 14px ${c.color}55` }}
              >
                {c.mult}
              </div>
              <div className="mt-1 text-[11px] text-[#8b949e]">{c.desc}</div>
            </Panel>
          ))}
        </div>
        <p className="px-1 text-xs text-[#8b949e]">
          Une mauvaise réponse ou un timeout réinitialise le combo à 0. Le seuil x2 varie selon la
          classe (4 pour le Mage, 7 pour l&apos;Alchimiste).
        </p>
      </SectionWrap>

      {/* Classes */}
      <SectionWrap>
        <RuleSectionTitle subtitle={`${CLASS_LIST.length} styles de jeu uniques`}>
          Classes
        </RuleSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {CLASS_LIST.map((c) => (
            <Panel key={c.id} className="relative overflow-hidden p-4" hover>
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${c.color}1a, transparent 60%)`,
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="clip-hex grid size-12 shrink-0 place-items-center text-2xl"
                    style={{
                      background: '#0d1117',
                      border: `2px solid ${c.color}`,
                      boxShadow: `0 0 18px ${c.color}44`,
                    }}
                  >
                    {c.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-bold" style={{ color: c.color }}>
                      {c.name}
                    </div>
                    <div className="font-mono text-xs text-[#8b949e]">PV {c.hp}</div>
                  </div>
                  <div className="ml-auto">
                    <span
                      className="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: c.color, borderColor: `${c.color}80`, background: `${c.color}1a` }}
                    >
                      x2 @ {c.x2Threshold}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] italic text-[#8b949e]">« {c.tagline} »</p>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span
                      className="w-16 shrink-0 font-semibold uppercase tracking-wider"
                      style={{ color: c.color }}
                    >
                      Passif
                    </span>
                    <span className="text-[#c9d1d9]">
                      <b className="text-white">{c.passive.name}</b> — {c.passive.description}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className="w-16 shrink-0 font-semibold uppercase tracking-wider"
                      style={{ color: c.color }}
                    >
                      Ultime
                    </span>
                    <span className="text-[#c9d1d9]">
                      <b className="text-white">{c.ultimate.name}</b> — {c.ultimate.description}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 font-semibold uppercase tracking-wider text-[#ef4444]">
                      Faiblesse
                    </span>
                    <span className="text-[#8b949e]">{c.weakness}</span>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </SectionWrap>

      {/* Sorts */}
      <SectionWrap>
        <RuleSectionTitle subtitle={`${SPELL_LIST.length} sorts — débloqués à combo 8`}>
          Sorts
        </RuleSectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SPELL_LIST.map((s) => (
            <Panel key={s.id} className="p-4" hover>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{s.emoji}</span>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-bold text-white">{s.name}</div>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Zap className="size-3 text-[#f59e0b]" />
                    <span className="font-mono text-[11px] text-[#f59e0b]">{s.cost} énergie</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-[#8b949e]">{s.description}</p>
              <span
                className={cn(
                  'mt-2 inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  s.target === 'self'
                    ? 'border-[#22c55e]/50 bg-[rgba(34,197,94,0.1)] text-[#22c55e]'
                    : 'border-[#ef4444]/50 bg-[rgba(239,68,68,0.1)] text-[#ef4444]',
                )}
              >
                {s.target === 'self' ? 'Sur soi' : "Sur l'adversaire"}
              </span>
            </Panel>
          ))}
        </div>
      </SectionWrap>

      {/* Modes */}
      <SectionWrap>
        <RuleSectionTitle subtitle="4 façons de s'affronter">
          Modes de jeu
        </RuleSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <Panel key={m.id} className="relative overflow-hidden p-4" hover>
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${m.color}1a, transparent 60%)`,
                }}
              />
              <div className="relative z-10 flex items-start gap-3">
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-lg border text-2xl"
                  style={{
                    borderColor: `${m.color}80`,
                    background: '#0d1117',
                    boxShadow: `0 0 16px ${m.color}33`,
                  }}
                >
                  {m.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold" style={{ color: m.color }}>
                      {m.name}
                    </span>
                    {m.elo ? (
                      <span className="rounded-md border border-[#2563eb]/50 bg-[rgba(37,99,235,0.1)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2563eb]">
                        Elo
                      </span>
                    ) : (
                      <span className="rounded-md border border-[#30363d] bg-[#21262d] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">
                        0 Elo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-[#8b949e]">{m.desc}</p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </SectionWrap>

      {/* Divisions */}
      <SectionWrap>
        <RuleSectionTitle subtitle="Échelle de progression par Elo">
          Divisions
        </RuleSectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {DIVISIONS.map((d) => (
            <div
              key={d.name}
              className="flex items-center gap-2.5 rounded-lg border bg-[#0d1117]/60 p-3"
              style={{
                borderColor: `${d.color}66`,
                boxShadow: `0 0 14px ${d.color}22`,
              }}
            >
              <div
                className="clip-hex grid size-9 shrink-0 place-items-center text-lg"
                style={{
                  background: '#0d1117',
                  border: `2px solid ${d.color}`,
                }}
              >
                {d.emoji}
              </div>
              <div className="min-w-0">
                <div
                  className="truncate text-sm font-bold"
                  style={{ color: d.color }}
                >
                  {d.name}
                </div>
                <div className="font-mono text-[10px] text-[#8b949e]">{d.min}+ Elo</div>
              </div>
            </div>
          ))}
        </div>
        <p className="px-1 text-xs text-[#8b949e]">
          L&apos;Elo évolue uniquement en modes <b className="text-white">Ranked</b> et{' '}
          <b className="text-white">Blitz</b>. Gagne pour grimper, perds pour descendre.
        </p>
      </SectionWrap>

      {/* CTA final */}
      <div className="flex justify-center pt-2">
        <Btn size="lg" onClick={() => setView('classselect')} className="min-h-11">
          <Target className="size-4" /> Prêt à jouer
        </Btn>
      </div>
    </div>
  );
}
