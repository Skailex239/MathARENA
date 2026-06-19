"use client";

import { SPELL_LIST } from "@/lib/game/spells";
import { CLASSES } from "@/lib/game/classes";
import type { ClassId, SpellId } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  classId: ClassId;
  combo: number;
  energy: number;
  locked: boolean;
  canSpell: (id: SpellId) => boolean;
  canUlt: () => boolean;
  canShield: () => boolean;
  onSpell: (id: SpellId) => boolean;
  onUlt: () => boolean;
  onShield: () => boolean;
}

export function SpellDock({
  classId,
  combo,
  energy,
  locked,
  canSpell,
  canUlt,
  canShield,
  onSpell,
  onUlt,
  onShield,
}: Props) {
  const def = CLASSES[classId];
  const comboUnlocked = combo >= 8;
  const ultUnlocked = combo >= 10;

  const handleSpell = (id: SpellId, cost: number) => {
    if (locked) {
      toast("Patientez la prochaine question", { description: "Les sorts se lancent pendant une question active." });
      return;
    }
    if (!comboUnlocked) {
      toast("Combo insuffisant", { description: "Atteins un combo de 8 pour débloquer les sorts." });
      return;
    }
    if (energy < cost) {
      toast("Énergie insuffisante", { description: `Il te faut ${cost} d'énergie.` });
      return;
    }
    const ok = onSpell(id);
    if (!ok) toast("Impossible de lancer ce sort maintenant.");
  };

  const handleUlt = () => {
    if (locked) return;
    if (!ultUnlocked) {
      toast("Ultime verrouillé", { description: "Atteins un combo de 10 pour débloquer ton ultime." });
      return;
    }
    const ok = onUlt();
    if (!ok) toast("Impossible de déclencher l'ultime.");
  };

  const handleShield = () => {
    if (locked) return;
    if (!canShield()) {
      toast("Bouclier indisponible", { description: "Il faut 40 d'énergie (max 30 de bouclier)." });
      return;
    }
    onShield();
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sorts &amp; Compétences
        </span>
        <span className="text-[11px] text-muted-foreground">
          Combo <span className="font-mono text-foreground">{combo}</span> · Énergie{" "}
          <span className="font-mono text-foreground">{energy}</span>
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {SPELL_LIST.map((s) => {
          const ok = !locked && canSpell(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSpell(s.id, s.cost)}
              disabled={!ok}
              title={`${s.name} — ${s.description} (coût ${s.cost})`}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-0.5 rounded-xl border p-2 transition-all min-h-[56px]",
                ok
                  ? "border-[#b15cff]/60 bg-[#b15cff]/10 hover:bg-[#b15cff]/20 hover:scale-[1.04] cursor-pointer"
                  : "border-border/40 bg-black/20 opacity-50 cursor-not-allowed",
              )}
            >
              <span className="text-xl leading-none">{s.emoji}</span>
              <span className="text-[10px] font-medium leading-none">{s.name}</span>
              <span className="text-[9px] text-amber-400/90 leading-none">{s.cost}⚡</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          type="button"
          onClick={handleShield}
          disabled={locked || !canShield()}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all min-h-[44px]",
            !locked && canShield()
              ? "border-[#3ddc84]/60 bg-[#3ddc84]/10 hover:bg-[#3ddc84]/20 cursor-pointer"
              : "border-border/40 bg-black/20 opacity-50 cursor-not-allowed",
          )}
        >
          🛡️ Bouclier <span className="text-[10px] text-amber-400/90">40⚡</span>
        </button>
        <button
          type="button"
          onClick={handleUlt}
          disabled={locked || !canUlt()}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all min-h-[44px]",
            !locked && canUlt()
              ? "border-[#ff3d8b] bg-[#ff3d8b]/15 hover:bg-[#ff3d8b]/25 cursor-pointer animate-pulse-glow"
              : "border-border/40 bg-black/20 opacity-50 cursor-not-allowed",
          )}
          style={ultUnlocked ? {} : undefined}
        >
          ⚡ {def.ultimate.name}
        </button>
      </div>
    </div>
  );
}
