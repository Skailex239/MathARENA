// MathArena — types partagés du moteur de jeu

export type ClassId =
  | "guerrier"
  | "mage"
  | "gardien"
  | "assassin"
  | "alchimiste";

export type SpellId =
  | "gel"
  | "feu"
  | "soin"
  | "confusion"
  | "miroir"
  | "silence"
  | "echange";

export type Accent = "magenta" | "violet" | "amber" | "emerald" | "red";

export type Difficulty =
  | "facile"
  | "moyen"
  | "difficile"
  | "extreme"
  | "legendaire";

export type Category =
  | "addition"
  | "soustraction"
  | "multiplication"
  | "division"
  | "mixte"
  | "puissances"
  | "pourcentages"
  | "logique";

export type GameMode = "PRACTICE" | "QUICK" | "BLITZ" | "RANKED";

export interface Question {
  text: string;
  answer: number;
  category: Category;
  difficulty: Difficulty;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  emoji: string;
  tagline: string;
  hp: number;
  accent: Accent;
  color: string; // hex pour styling inline
  passive: { name: string; description: string };
  ultimate: { name: string; description: string };
  weakness: string;
  /** seuil de streak pour le combo x2 (5 par défaut, 4 mage, 7 alchimiste) */
  x2Threshold: number;
}

export interface SpellDef {
  id: SpellId;
  name: string;
  emoji: string;
  description: string;
  cost: number; // énergie
  target: "self" | "enemy";
}

/** État d'un combattant pendant le duel. */
export interface Combatant {
  classId: ClassId;
  hp: number;
  maxHp: number;
  energy: number; // 0..100
  combo: number; // streak de bonnes réponses consécutives
  shield: number; // PV de bouclier absorbant
  goodAnswers: number; // total bonnes réponses (pour passifs)
  burnTurns: number; // -5 PV/question (Feu Mental mage ult)
  poisonTurns: number; // -3 PV/question (Potion Toxique alchimiste ult)
  mirrorActive: boolean; // prochaine erreur inflige 20
  wallCharges: number; // bloque N prochaines attaques (Mur Mental gardien ult)
  fireBoost: boolean; // prochaine bonne = dégâts x3 (sort Feu)
  slowTurns: number; // -3s sur la prochaine question (sort Gel subi)
  confusedTurns: number; // difficulté supérieure (sort Confusion subi)
}

export type DuelPhase = "question" | "resolved" | "gameover";

export interface DuelState {
  mode: GameMode;
  player: Combatant;
  opponent: Combatant;
  question: Question;
  questionStartTs: number;
  timeLimitMs: number;
  phase: DuelPhase;
  winner: "player" | "opponent" | null;
  log: DuelLogEntry[];
  questionIndex: number;
}

export interface DuelLogEntry {
  id: number;
  side: "player" | "opponent" | "system";
  text: string;
  kind:
    | "hit"
    | "crit"
    | "miss"
    | "heal"
    | "shield"
    | "spell"
    | "ult"
    | "combo"
    | "info";
  ts: number;
}

/** Résultat de l'évaluation d'une réponse du joueur. */
export interface AnswerResult {
  correct: boolean;
  timeMs: number;
  baseDamage: number;
  finalDamage: number;
  comboMultiplier: number;
  isCrit: boolean;
  selfDamage: number;
  opponentHeal: number;
  reason?: string;
}
