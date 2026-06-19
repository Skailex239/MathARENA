import type {
  AnswerResult,
  ClassId,
  Combatant,
  DuelLogEntry,
  DuelState,
  GameMode,
  Question,
  SpellId,
} from "./types";
import { CLASSES } from "./classes";
import { generateQuestion } from "./math";

// compteur d'ids de log (module-level, suffit pour l'unicité)
let logId = 1;

function makeLog(
  side: DuelLogEntry["side"],
  text: string,
  kind: DuelLogEntry["kind"],
): DuelLogEntry {
  return { id: logId++, side, text, kind, ts: Date.now() };
}

export function createCombatant(classId: ClassId): Combatant {
  const def = CLASSES[classId];
  return {
    classId,
    hp: def.hp,
    maxHp: def.hp,
    energy: 0,
    combo: 0,
    shield: 0,
    goodAnswers: 0,
    burnTurns: 0,
    poisonTurns: 0,
    mirrorActive: false,
    wallCharges: 0,
    fireBoost: false,
    slowTurns: 0,
    confusedTurns: 0,
  };
}

export function timeLimitFor(mode: GameMode, slow: boolean): number {
  let base = mode === "BLITZ" ? 3000 : 10000;
  if (slow) base -= 3000;
  return Math.max(1500, base);
}

/** Multiplicateur de combo selon le streak et la classe. */
export function comboMultiplier(streak: number, classId: ClassId): number {
  const x2t = CLASSES[classId].x2Threshold;
  if (streak >= 8) return 3;
  if (streak >= x2t) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

/** Dégâts de base selon le temps de réponse (ms). */
export function baseDamageForTime(timeMs: number): {
  base: number;
  isCrit: boolean;
} {
  if (timeMs < 2000) return { base: 20, isCrit: true };
  if (timeMs < 4000) return { base: 15, isCrit: false };
  if (timeMs < 6000) return { base: 10, isCrit: false };
  if (timeMs < 10000) return { base: 5, isCrit: false };
  return { base: 0, isCrit: false };
}

function clampHp(c: Combatant): void {
  if (c.hp < 0) c.hp = 0;
  if (c.hp > c.maxHp) c.hp = c.maxHp;
}

/** Applique des dégâts à un combattant en respectant bouclier et Mur Mental. */
function dealDamage(
  target: Combatant,
  amount: number,
): { dealt: number; blocked: boolean } {
  if (amount <= 0) return { dealt: 0, blocked: false };
  if (target.wallCharges > 0) {
    target.wallCharges -= 1;
    return { dealt: 0, blocked: true };
  }
  let remaining = amount;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }
  target.hp -= remaining;
  clampHp(target);
  return { dealt: amount, blocked: target.shield > 0 && remaining === 0 };
}

function heal(target: Combatant, amount: number): number {
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  return target.hp - before;
}

export function createDuel(
  playerClassId: ClassId,
  opponentClassId: ClassId,
  mode: GameMode,
): DuelState {
  const player = createCombatant(playerClassId);
  const opponent = createCombatant(opponentClassId);
  const question = generateQuestion({ mode, questionIndex: 0 });
  return {
    mode,
    player,
    opponent,
    question,
    questionStartTs: Date.now(),
    timeLimitMs: timeLimitFor(mode, false),
    phase: "question",
    winner: null,
    log: [
      makeLog(
        "system",
        `Duel lancé — ${CLASSES[playerClassId].name} vs ${CLASSES[opponentClassId].name}`,
        "info",
      ),
    ],
    questionIndex: 0,
  };
}

function clone(c: Combatant): Combatant {
  return { ...c };
}

function cloneState(s: DuelState): DuelState {
  return {
    ...s,
    player: clone(s.player),
    opponent: clone(s.opponent),
    log: [...s.log],
    question: { ...s.question },
  };
}

export function isGameOver(s: DuelState): boolean {
  return s.player.hp <= 0 || s.opponent.hp <= 0;
}

/**
 * Résout la réponse du joueur. NE fait PAS avancer à la question suivante
 * (le hook programme ensuite la réponse de l'adversaire puis advance()).
 */
export function playerAnswer(
  prev: DuelState,
  raw: string,
  timeMs: number,
): { state: DuelState; result: AnswerResult } {
  const s = cloneState(prev);
  const p = s.player;
  const o = s.opponent;
  const def = CLASSES[p.classId];
  const timedOut = timeMs >= s.timeLimitMs;

  const result: AnswerResult = {
    correct: false,
    timeMs,
    baseDamage: 0,
    finalDamage: 0,
    comboMultiplier: comboMultiplier(p.combo, p.classId),
    isCrit: false,
    selfDamage: 0,
    opponentHeal: 0,
  };

  if (timedOut) {
    // timeout : l'adversaire régénère 5 PV, combo du joueur brisé
    const gained = heal(o, 5);
    p.combo = 0;
    s.log.push(
      makeLog("opponent", `Temps écoulé ! L'adversaire régénère ${gained} PV.`, "heal"),
    );
    result.reason = "timeout";
    s.phase = "resolved";
    return { state: s, result };
  }

  const submitted = Number.parseInt(raw, 10);
  const correct = Number.isFinite(submitted) && submitted === s.question.answer;

  if (correct) {
    result.correct = true;
    const { base, isCrit } = baseDamageForTime(timeMs);
    result.isCrit = isCrit;
    let dmg = base;
    // passif guerrier : -3 dégâts de base
    if (p.classId === "guerrier") dmg = Math.max(1, dmg - 3);
    // passif assassin : réponse < 2s => dégâts x2.5
    if (p.classId === "assassin" && isCrit) dmg = Math.round(dmg * 2.5);
    // sort Feu : prochaine bonne = x3
    if (p.fireBoost) {
      dmg = Math.round(dmg * 3);
      p.fireBoost = false;
      s.log.push(makeLog("player", "🔥 Feu consommé : dégâts x3 !", "spell"));
    }
    const mult = comboMultiplier(p.combo, p.classId);
    result.comboMultiplier = mult;
    result.baseDamage = dmg;
    dmg = Math.round(dmg * mult);
    result.finalDamage = dmg;

    const { dealt, blocked } = dealDamage(o, dmg);
    if (blocked) {
      s.log.push(makeLog("opponent", `🛡️ L'adversaire bloque l'attaque (${dmg} dégâts) !`, "shield"));
    } else {
      s.log.push(
        makeLog(
          "player",
          isCrit
            ? `💥 CRITIQUE ! ${dealt} dégâts infligés.`
            : `⚔️ ${dealt} dégâts infligés.`,
          isCrit ? "crit" : "hit",
        ),
      );
    }

    // combo / énergie / bonnes réponses
    p.combo += 1;
    p.goodAnswers += 1;
    p.energy = Math.min(100, p.energy + 25);

    // passif alchimiste : +3 PV par bonne réponse
    if (p.classId === "alchimiste") heal(p, 3);
    // passif gardien : bouclier +10 toutes les 5 bonnes réponses
    if (p.classId === "gardien" && p.goodAnswers % 5 === 0) {
      p.shield += 10;
      s.log.push(makeLog("player", "🛡️ Aegis : +10 bouclier.", "shield"));
    }

    // annonces de combo
    if (p.combo === 3) s.log.push(makeLog("player", "Combo x1.5 enclenché !", "combo"));
    if (p.combo === def.x2Threshold)
      s.log.push(makeLog("player", `Combo x2 ! (${def.passive.name})`, "combo"));
    if (p.combo === 8) s.log.push(makeLog("player", "Combo x3 ! Sorts disponibles 🔮", "combo"));
    if (p.combo === 10) s.log.push(makeLog("player", "ULTIME DISPONIBLE ! ⚡", "ult"));
  } else {
    // mauvaise réponse
    result.correct = false;
    let self = 10;
    if (p.classId === "guerrier") self = 5;
    if (p.classId === "assassin") self = 15;
    // miroir adverse actif : +20
    let extra = 0;
    if (o.mirrorActive) {
      extra = 20;
      o.mirrorActive = false;
      s.log.push(makeLog("opponent", "🪞 Miroir : ton erreur inflige +20 !", "spell"));
    }
    const total = self + extra;
    result.selfDamage = total;
    dealDamage(p, total);
    p.combo = 0;
    s.log.push(
      makeLog("player", `✗ Mauvaise réponse : -${total} PV. Combo brisé.`, "miss"),
    );
  }

  s.phase = "resolved";
  return { state: s, result };
}

// --- IA adversaire ---

function aiAccuracy(diff: Question["difficulty"], confused: boolean): number {
  const base: Record<Question["difficulty"], number> = {
    facile: 0.85,
    moyen: 0.72,
    difficile: 0.55,
    extreme: 0.4,
    legendaire: 0.28,
  };
  let d = base[diff];
  if (confused) d -= 0.2;
  return Math.max(0.12, d);
}

function aiThinkMs(diff: Question["difficulty"], mode: GameMode): number {
  const base: Record<Question["difficulty"], number> = {
    facile: 1600,
    moyen: 2200,
    difficile: 3000,
    extreme: 3800,
    legendaire: 4400,
  };
  let t = base[diff] + Math.random() * 900 - 450;
  if (mode === "BLITZ") t = Math.min(t, 2600);
  return Math.max(1100, Math.round(t));
}

export interface OpponentPlan {
  frozen: boolean;
  thinkMs: number;
  correct: boolean;
}

/** Tire le "plan" de l'IA pour la question courante (thinkMs + issue). */
export function planOpponentTurn(s: DuelState): OpponentPlan {
  const o = s.opponent;
  if (o.slowTurns > 0) {
    return { frozen: true, thinkMs: 0, correct: false };
  }
  const thinkMs = aiThinkMs(s.question.difficulty, s.mode);
  const acc = aiAccuracy(s.question.difficulty, o.confusedTurns > 0);
  const correct = Math.random() < acc;
  return { frozen: false, thinkMs, correct };
}

/** Applique le plan de l'IA (pré-tiré) à l'état. */
export function applyOpponentTurn(
  prev: DuelState,
  plan: OpponentPlan,
): { state: DuelState; info: { correct: boolean; thinkMs: number; damage: number; frozen: boolean } } {
  const s = cloneState(prev);
  const p = s.player;
  const o = s.opponent;

  if (plan.frozen) {
    o.slowTurns -= 1;
    s.log.push(makeLog("opponent", "❄️ Gel : l'adversaire ne peut pas répondre !", "spell"));
    return {
      state: s,
      info: { correct: false, thinkMs: 0, damage: 0, frozen: true },
    };
  }

  const info = { correct: plan.correct, thinkMs: plan.thinkMs, damage: 0, frozen: false };

  if (!plan.correct) {
    o.combo = 0;
    if (p.mirrorActive) {
      p.mirrorActive = false;
      const { dealt } = dealDamage(o, 20);
      s.log.push(makeLog("player", `🪞 Miroir : l'erreur adverse inflige ${dealt} dégâts !`, "spell"));
    } else {
      s.log.push(makeLog("opponent", "L'adversaire se trompe. Aucun dégât.", "miss"));
    }
    return { state: s, info };
  }

  const { base, isCrit } = baseDamageForTime(plan.thinkMs);
  let dmg = base;
  if (o.classId === "guerrier") dmg = Math.max(1, dmg - 3);
  if (o.classId === "assassin" && isCrit) dmg = Math.round(dmg * 2.5);
  const mult = comboMultiplier(o.combo, o.classId);
  dmg = Math.round(dmg * mult);
  info.damage = dmg;

  const { dealt, blocked } = dealDamage(p, dmg);
  o.combo += 1;
  o.goodAnswers += 1;
  o.energy = Math.min(100, o.energy + 25);
  if (o.classId === "alchimiste") heal(o, 3);
  if (o.classId === "gardien" && o.goodAnswers % 5 === 0) o.shield += 10;

  if (blocked) {
    s.log.push(makeLog("player", `🛡️ Tu bloques l'attaque adverse (${dmg}).`, "shield"));
  } else {
    s.log.push(makeLog("opponent", `L'adversaire frappe : -${dealt} PV.`, "hit"));
  }
  return { state: s, info };
}

/** Avance à la question suivante : tick des statuts + génération. */
export function advance(prev: DuelState): DuelState {
  const s = cloneState(prev);
  const p = s.player;
  const o = s.opponent;

  // ticks de statuts (brûlure / poison)
  if (p.burnTurns > 0) {
    dealDamage(p, 5);
    p.burnTurns -= 1;
    s.log.push(makeLog("opponent", "🔥 Brûlure : -5 PV.", "hit"));
  }
  if (p.poisonTurns > 0) {
    dealDamage(p, 3);
    p.poisonTurns -= 1;
    s.log.push(makeLog("opponent", "☠️ Poison : -3 PV.", "hit"));
  }
  if (o.burnTurns > 0) {
    dealDamage(o, 5);
    o.burnTurns -= 1;
    s.log.push(makeLog("player", "🔥 Feu Mental brûle l'adversaire : -5 PV.", "hit"));
  }
  if (o.poisonTurns > 0) {
    dealDamage(o, 3);
    o.poisonTurns -= 1;
    s.log.push(makeLog("player", "☠️ Poison dans les veines adverses : -3 PV.", "hit"));
  }
  if (p.confusedTurns > 0) p.confusedTurns -= 1;
  if (o.confusedTurns > 0) o.confusedTurns -= 1;

  if (isGameOver(s)) {
    s.phase = "gameover";
    s.winner = p.hp <= 0 ? "opponent" : "player";
    return s;
  }

  s.questionIndex += 1;
  s.question = generateQuestion({
    mode: s.mode,
    questionIndex: s.questionIndex,
    confused: o.confusedTurns > 0,
  });
  s.questionStartTs = Date.now();
  s.timeLimitMs = timeLimitFor(s.mode, p.slowTurns > 0);
  if (p.slowTurns > 0) p.slowTurns -= 1;
  s.phase = "question";
  return s;
}

// --- Sorts (joueur uniquement en MVP) ---

export function canCastSpell(s: DuelState, spellId: SpellId): boolean {
  if (s.phase === "gameover") return false;
  const p = s.player;
  if (p.combo < 8) return false;
  return p.energy >= spellCost(spellId);
}

function spellCost(id: SpellId): number {
  if (id === "echange") return 75;
  return 50;
}

export function castSpell(
  prev: DuelState,
  spellId: SpellId,
): { state: DuelState; ok: boolean; reason?: string } {
  if (!canCastSpell(prev, spellId)) {
    return {
      state: prev,
      ok: false,
      reason: prev.player.combo < 8 ? "Combo insuffisant (≥8 requis)" : "Énergie insuffisante",
    };
  }
  const s = cloneState(prev);
  const p = s.player;
  const o = s.opponent;
  p.energy -= spellCost(spellId);

  switch (spellId) {
    case "gel":
      o.slowTurns = 1;
      s.log.push(makeLog("player", "❄️ Gel : l'adversaire saute sa prochaine réponse !", "spell"));
      break;
    case "feu":
      p.fireBoost = true;
      s.log.push(makeLog("player", "🔥 Feu : ta prochaine bonne réponse inflige x3 !", "spell"));
      break;
    case "soin": {
      const g = heal(p, 20);
      s.log.push(makeLog("player", `💚 Soin : +${g} PV.`, "heal"));
      break;
    }
    case "confusion":
      o.confusedTurns = 3;
      s.log.push(makeLog("player", "🌀 Confusion : l'adversaire a une difficulté majorée (3 questions).", "spell"));
      break;
    case "miroir":
      p.mirrorActive = true;
      s.log.push(makeLog("player", "🪞 Miroir : la prochaine erreur adverse coûte 20 PV.", "spell"));
      break;
    case "silence":
      o.combo = 0;
      s.log.push(makeLog("player", "🔇 Silence : le combo adverse tombe à 0 !", "spell"));
      break;
    case "echange": {
      const tmp = p.hp;
      p.hp = Math.min(p.maxHp, o.hp);
      o.hp = Math.min(o.maxHp, tmp);
      s.log.push(makeLog("player", "🔄 Échange : les PV sont permutés !", "spell"));
      break;
    }
  }
  return { state: s, ok: true };
}

export function canCastUltimate(s: DuelState): boolean {
  return s.phase !== "gameover" && s.player.combo >= 10;
}

export function castUltimate(prev: DuelState): {
  state: DuelState;
  ok: boolean;
  reason?: string;
} {
  if (!canCastUltimate(prev)) {
    return { state: prev, ok: false, reason: "Combo insuffisant (≥10 requis)" };
  }
  const s = cloneState(prev);
  const p = s.player;
  const o = s.opponent;
  const def = CLASSES[p.classId];

  switch (p.classId) {
    case "guerrier": {
      const { dealt } = dealDamage(o, 50);
      s.log.push(makeLog("player", `⚡ COUP DE RAGE : -${dealt} PV à l'adversaire !`, "ult"));
      break;
    }
    case "mage":
      o.burnTurns = 3;
      s.log.push(makeLog("player", "⚡ FEU MENTAL : l'adversaire brûle (-5 PV/question, 3 questions).", "ult"));
      break;
    case "gardien":
      p.wallCharges = 2;
      s.log.push(makeLog("player", "⚡ MUR MENTAL : les 2 prochaines attaques adverses sont bloquées !", "ult"));
      break;
    case "assassin":
      if (o.hp > 0 && o.hp < 25) {
        dealDamage(o, o.hp);
        s.log.push(makeLog("player", "⚡ EXÉCUTION : élimination directe !", "ult"));
      } else {
        // pas éligible : gros dégâts à la place (consolation)
        const { dealt } = dealDamage(o, 30);
        s.log.push(makeLog("player", `⚡ Exécution ratée (adv ≥ 25 PV) : -${dealt} PV.`, "ult"));
      }
      break;
    case "alchimiste":
      o.poisonTurns = 5;
      s.log.push(makeLog("player", "⚡ POTION TOXIQUE : empoisonne l'adversaire (-3 PV/question, 5 questions).", "ult"));
      break;
  }

  p.combo = 0; // l'ultime consomme le combo
  void def;
  return { state: s, ok: true };
}

export function canActivateShield(s: DuelState): boolean {
  return s.phase !== "gameover" && s.player.energy >= 40 && s.player.shield < 30;
}

export function activateShield(prev: DuelState): {
  state: DuelState;
  ok: boolean;
} {
  if (!canActivateShield(prev)) return { state: prev, ok: false };
  const s = cloneState(prev);
  s.player.energy -= 40;
  s.player.shield += 20;
  s.log.push(makeLog("player", "🛡️ Bouclier activé : +20 PV absorbés.", "shield"));
  return { state: s, ok: true };
}
