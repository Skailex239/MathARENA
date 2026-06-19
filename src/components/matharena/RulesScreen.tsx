'use client';

import { type ReactNode } from 'react';
import {
  Brain, Heart, Zap, Shield, Sparkles, Flame, Timer, Crown, Swords, Target, Wand2,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CLASS_LIST, ACCENT_CLASSES } from '@/lib/game/classes';
import { SPELL_LIST } from '@/lib/game/spells';
import { DIVISIONS } from '@/lib/game/divisions';
import type { Accent } from '@/lib/game/types';

const DAMAGE_TIERS = [
  { time: '< 2 s', dmg: 20, label: 'CRITIQUE', accent: 'magenta' as Accent },
  { time: '2 – 4 s', dmg: 15, label: 'Élevé', accent: 'amber' as Accent },
  { time: '4 – 6 s', dmg: 10, label: 'Standard', accent: 'emerald' as Accent },
  { time: '6 – 10 s', dmg: 5, label: 'Faible', accent: 'violet' as Accent },
];

const COMBO_TIERS = [
  { combo: 3, mult: 'x1,5', desc: 'Combo déclenché — dégâts amplifiés.' },
  { combo: 5, mult: 'x2', desc: 'Dégâts doublés (seuil ajusté selon la classe).' },
  { combo: 8, mult: 'x3', desc: 'Sorts disponibles — dépense ton énergie.' },
  { combo: 10, mult: 'ULTIME', desc: 'Ultime de classe débloqué.' },
];

interface ModeInfo {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  accent: Accent;
  elo: boolean;
}

const MODES: ModeInfo[] = [
  {
    id: 'PRACTICE',
    emoji: '🧪',
    name: 'Practice',
    desc: "Entraînement contre une IA passive. 0 Elo, 0 pression — parfait pour découvrir les mécaniques.",
    accent: 'violet',
    elo: false,
  },
  {
    id: 'QUICK',
    emoji: '⚡',
    name: 'Quick',
    desc: "Match rapide contre l'IA, sans enjeu (0 Elo). Idéal pour s'échauffer.",
    accent: 'amber',
    elo: false,
  },
  {
    id: 'BLITZ',
    emoji: '🔥',
    name: 'Blitz',
    desc: '3 secondes par question. Mode nerveux qui rapporte de l\'Elo.',
    accent: 'red',
    elo: true,
  },
  {
    id: 'RANKED',
    emoji: '🏆',
    name: 'Ranked',
    desc: 'Match classé contre une IA adaptative. Difficulté croissante, Elo en jeu.',
    accent: 'magenta',
    elo: true,
  },
];

function SectionHeader({
  icon, title, subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function RulesScreen() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-10 pt-6">
      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff3d8b]/25 via-transparent to-[#b15cff]/20" />
        <CardContent className="relative z-10 flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-5xl">🧠</div>
          <h1 className="text-3xl font-black text-glow-magenta sm:text-4xl">Comment jouer</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            MathArena est un duel 1v1 de calcul mental en temps réel. Ton cerveau est ton arme :
            réponds vite, enchaîne les combos, déchaîne ton ultime.
          </p>
        </CardContent>
      </Card>

      {/* Principe */}
      <Card>
        <CardHeader>
          <SectionHeader icon={<Brain className="size-5" />} title="Le principe" subtitle="Un duel 1v1 au mental" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-card/40 p-3 text-center">
              <Heart className="mx-auto size-5 text-[#f44747]" />
              <div className="mt-1 text-lg font-bold">100 PV</div>
              <div className="text-[11px] text-muted-foreground">Points de vie</div>
            </div>
            <div className="rounded-xl border bg-card/40 p-3 text-center">
              <Zap className="mx-auto size-5 text-[#ffb02e]" />
              <div className="mt-1 text-lg font-bold">Énergie</div>
              <div className="text-[11px] text-muted-foreground">Pour lancer des sorts</div>
            </div>
            <div className="rounded-xl border bg-card/40 p-3 text-center">
              <Shield className="mx-auto size-5 text-[#3ddc84]" />
              <div className="mt-1 text-lg font-bold">Bouclier</div>
              <div className="text-[11px] text-muted-foreground">Absorbe les dégâts</div>
            </div>
            <div className="rounded-xl border bg-card/40 p-3 text-center">
              <Sparkles className="mx-auto size-5 text-[#ff3d8b]" />
              <div className="mt-1 text-lg font-bold">Ultime</div>
              <div className="text-[11px] text-muted-foreground">À combo 10</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            À chaque question, le plus rapide inflige des dégâts. Le premier qui tombe à 0 PV perd.
            Les sorts coûtent de l&apos;énergie, l&apos;ultime se débloque via les combos.
          </p>
        </CardContent>
      </Card>

      {/* Dégâts selon la vitesse */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Timer className="size-5" />}
            title="Dégâts selon la vitesse"
            subtitle="Plus tu réponds vite, plus tu frappes fort"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            {DAMAGE_TIERS.map((t) => {
              const a = ACCENT_CLASSES[t.accent];
              return (
                <div key={t.time} className={cn('relative overflow-hidden rounded-xl border p-3', a.border)}>
                  <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-25', a.from, a.to)} />
                  <div className="relative z-10">
                    <div className={cn('text-[10px] font-bold uppercase tracking-widest', a.text)}>{t.label}</div>
                    <div className="mt-1 text-2xl font-black">{t.dmg}</div>
                    <div className="text-[11px] text-muted-foreground">dégâts · {t.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <Separator className="my-4" />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <Flame className="size-5 shrink-0 text-[#f44747]" />
              <div>
                <div className="text-sm font-semibold">Mauvaise réponse</div>
                <div className="text-[11px] text-muted-foreground">
                  Tu perds 10 PV (5 en Guerrier, 15 en Assassin).
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <Timer className="size-5 shrink-0 text-[#ffb02e]" />
              <div>
                <div className="text-sm font-semibold">Timeout</div>
                <div className="text-[11px] text-muted-foreground">
                  L&apos;adversaire récupère 5 PV si tu ne réponds pas à temps.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combos */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Sparkles className="size-5" />}
            title="Combos"
            subtitle="Enchaîne les bonnes réponses pour amplifier tes dégâts"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            {COMBO_TIERS.map((c) => (
              <div key={c.combo} className="rounded-xl border bg-card/40 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Combo</span>
                  <span className="font-mono text-sm font-bold text-[#ff3d8b]">{c.combo}</span>
                </div>
                <div className="mt-1 text-2xl font-black text-glow-magenta">{c.mult}</div>
                <div className="text-[11px] text-muted-foreground">{c.desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Une mauvaise réponse ou un timeout réinitialise le combo à 0. Le seuil x2 varie selon la
            classe (4 pour le Mage, 7 pour l&apos;Alchimiste).
          </p>
        </CardContent>
      </Card>

      {/* Classes */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Swords className="size-5" />}
            title="Classes"
            subtitle={`${CLASS_LIST.length} styles de jeu uniques`}
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {CLASS_LIST.map((c) => {
              const a = ACCENT_CLASSES[c.accent];
              return (
                <div key={c.id} className={cn('relative overflow-hidden rounded-xl border p-4', a.border)}>
                  <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-20', a.from, a.to)} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'grid size-12 shrink-0 place-items-center rounded-xl border bg-card/60 text-2xl',
                          a.border,
                          a.glow,
                        )}
                      >
                        {c.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className={cn('text-lg font-bold', a.text)}>{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">PV {c.hp}</div>
                      </div>
                      <div className="ml-auto">
                        <Badge variant="outline" className={cn('gap-1', a.text, a.border)}>
                          x2 @ {c.x2Threshold}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] italic text-muted-foreground">« {c.tagline} »</p>
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex gap-2">
                        <span className={cn('w-16 shrink-0 font-semibold', a.text)}>Passif</span>
                        <span><b>{c.passive.name}</b> — {c.passive.description}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn('w-16 shrink-0 font-semibold', a.text)}>Ultime</span>
                        <span><b>{c.ultimate.name}</b> — {c.ultimate.description}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="w-16 shrink-0 font-semibold text-red-400">Faiblesse</span>
                        <span className="text-muted-foreground">{c.weakness}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sorts */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Wand2 className="size-5" />}
            title="Sorts"
            subtitle={`${SPELL_LIST.length} sorts — débloqués à combo 8`}
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SPELL_LIST.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="min-w-0">
                    <div className="truncate font-bold">{s.name}</div>
                    <Badge variant="outline" className="mt-0.5 gap-1 px-1.5 text-[10px]">
                      <Zap className="size-3 text-[#ffb02e]" /> {s.cost} énergie
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{s.description}</p>
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {s.target === 'self' ? 'Sur soi' : "Sur l'adversaire"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modes */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Target className="size-5" />}
            title="Modes de jeu"
            subtitle="4 façons de s'affronter"
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => {
              const a = ACCENT_CLASSES[m.accent];
              return (
                <div key={m.id} className={cn('relative overflow-hidden rounded-xl border p-4', a.border)}>
                  <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-20', a.from, a.to)} />
                  <div className="relative z-10 flex items-start gap-3">
                    <div
                      className={cn(
                        'grid size-12 shrink-0 place-items-center rounded-xl border bg-card/60 text-2xl',
                        a.border,
                      )}
                    >
                      {m.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-bold', a.text)}>{m.name}</span>
                        {m.elo ? (
                          <Badge variant="outline" className={cn('px-1.5 text-[10px]', a.text, a.border)}>Elo</Badge>
                        ) : (
                          <Badge variant="outline" className="px-1.5 text-[10px]">0 Elo</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{m.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Divisions */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Crown className="size-5" />}
            title="Divisions"
            subtitle="Échelle de progression par Elo"
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DIVISIONS.map((d) => {
              const a = ACCENT_CLASSES[d.accent];
              const range = `${d.min}+ Elo`;
              return (
                <div key={d.name} className={cn('flex items-center gap-2 rounded-lg border bg-card/40 px-3 py-2', a.border)}>
                  <span className="text-xl">{d.emoji}</span>
                  <div>
                    <div className={cn('text-sm font-bold', a.text)}>{d.name}</div>
                    <div className="text-[10px] text-muted-foreground">{range}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            L&apos;Elo évolue uniquement en modes <b>Ranked</b> et <b>Blitz</b>. Gagne pour grimper,
            perds pour descendre.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
