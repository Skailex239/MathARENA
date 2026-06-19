import type { Category, Difficulty, GameMode, Question } from "./types";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function round(n: number, d = 0): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

interface Gen {
  text: string;
  answer: number;
}

// --- Générateurs par catégorie / difficulté (réponses entières) ---

function genAdd(d: Difficulty): Gen {
  switch (d) {
    case "facile":
      return { text: `${rand(2, 20)} + ${rand(2, 20)}`, answer: 0 }; // answer fix below
    case "moyen":
      return genText(`${rand(20, 99)} + ${rand(20, 99)}`);
    case "difficile":
      return genText(`${rand(150, 900)} + ${rand(150, 900)}`);
    case "extreme":
      return genText(`${rand(1000, 9999)} + ${rand(1000, 9999)}`);
    case "legendaire": {
      const a = rand(100, 500);
      const b = rand(100, 500);
      const c = rand(100, 500);
      return genText(`${a} + ${b} + ${c}`);
    }
  }
}
function genSub(d: Difficulty): Gen {
  switch (d) {
    case "facile": {
      const a = rand(10, 30);
      const b = rand(1, a);
      return genText(`${a} - ${b}`);
    }
    case "moyen": {
      const a = rand(40, 99);
      const b = rand(10, a);
      return genText(`${a} - ${b}`);
    }
    case "difficile": {
      const a = rand(500, 1500);
      const b = rand(100, a);
      return genText(`${a} - ${b}`);
    }
    case "extreme": {
      const a = rand(3000, 9999);
      const b = rand(500, a);
      return genText(`${a} - ${b}`);
    }
    case "legendaire": {
      const a = rand(500, 2000);
      const b = rand(100, a);
      const c = rand(50, a - b);
      return genText(`${a} - ${b} - ${c}`);
    }
  }
}
function genMul(d: Difficulty): Gen {
  switch (d) {
    case "facile":
      return genText(`${rand(2, 9)} × ${rand(2, 9)}`);
    case "moyen":
      return genText(`${rand(6, 19)} × ${rand(3, 12)}`);
    case "difficile":
      return genText(`${rand(12, 49)} × ${rand(12, 49)}`);
    case "extreme":
      return genText(`${rand(25, 99)} × ${rand(25, 99)}`);
    case "legendaire":
      return genText(`${rand(20, 60)} × ${rand(20, 60)} × ${rand(2, 5)}`);
  }
}
function genDiv(d: Difficulty): Gen {
  switch (d) {
    case "facile": {
      const b = rand(2, 9);
      const q = rand(2, 9);
      return genText(`${b * q} ÷ ${b}`);
    }
    case "moyen": {
      const b = rand(3, 12);
      const q = rand(4, 14);
      return genText(`${b * q} ÷ ${b}`);
    }
    case "difficile": {
      const b = rand(6, 36);
      const q = rand(8, 40);
      return genText(`${b * q} ÷ ${b}`);
    }
    case "extreme": {
      const b = rand(12, 60);
      const q = rand(20, 90);
      return genText(`${b * q} ÷ ${b}`);
    }
    case "legendaire": {
      const a = rand(4, 12);
      const b = rand(3, 9);
      const q = rand(2, 6);
      return genText(`(${a} × ${b * q}) ÷ ${a}`);
    }
  }
}
function genMixed(d: Difficulty): Gen {
  switch (d) {
    case "facile": {
      const a = rand(2, 12);
      const b = rand(2, 9);
      const c = rand(1, 20);
      return genText(`${a} × ${b} + ${c}`);
    }
    case "moyen": {
      const a = rand(3, 9);
      const b = rand(3, 9);
      const c = rand(2, 9);
      return genText(`${a} × ${b} - ${c * 2}`);
    }
    case "difficile": {
      const b = rand(3, 12);
      const q = rand(4, 12);
      const c = rand(10, 60);
      return genText(`${b * q} ÷ ${b} + ${c}`);
    }
    case "extreme": {
      const a = rand(4, 12);
      const b = rand(4, 12);
      const c = rand(5, 30);
      return genText(`${a} × ${b} - ${c * 3}`);
    }
    case "legendaire": {
      const a = rand(4, 9);
      const b = rand(3, 8);
      const c = rand(2, 7);
      const d = rand(2, 6);
      return genText(`(${a} + ${b}) × (${c} - ${d})`);
    }
  }
}
function genPow(d: Difficulty): Gen {
  switch (d) {
    case "facile": {
      const n = rand(2, 6);
      return { text: `${n}²`, answer: n * n };
    }
    case "moyen": {
      const n = rand(2, 12);
      return Math.random() < 0.5
        ? { text: `${n}²`, answer: n * n }
        : { text: `√${n * n}`, answer: n };
    }
    case "difficile": {
      const n = rand(4, 20);
      return Math.random() < 0.5
        ? { text: `${n}²`, answer: n * n }
        : { text: `√${n * n}`, answer: n };
    }
    case "extreme": {
      const r = Math.random();
      if (r < 0.4) {
        const n = rand(2, 6);
        const p = rand(3, 4);
        return { text: `${n}^${p}`, answer: n ** p };
      } else if (r < 0.7) {
        const n = rand(8, 30);
        return { text: `√${n * n}`, answer: n };
      } else {
        const n = rand(5, 15);
        return { text: `${n}²`, answer: n * n };
      }
    }
    case "legendaire": {
      const n = rand(2, 6);
      const p = pick([4, 5]);
      return { text: `${n}^${p}`, answer: n ** p };
    }
  }
}
function genPct(d: Difficulty): Gen {
  const cfg: Record<Difficulty, { p: number[]; base: number[] }> = {
    facile: { p: [10, 20, 25, 50], base: [20, 40, 60, 80, 100] },
    moyen: { p: [15, 30, 40, 60], base: [50, 80, 120, 200] },
    difficile: { p: [12, 35, 45, 65], base: [80, 160, 240, 400] },
    extreme: { p: [8, 18, 37, 73], base: [100, 200, 500, 1000] },
    legendaire: { p: [], base: [200, 400, 600, 800] },
  };
  const c = cfg[d];
  const p = c.p.length ? pick(c.p) : rand(5, 95);
  const base = pick(c.base);
  return { text: `${p}% de ${base}`, answer: round((p * base) / 100) };
}
function genLogic(d: Difficulty): Gen {
  // Suites numériques simples
  switch (d) {
    case "facile": {
      const start = rand(1, 5);
      const step = rand(2, 4);
      return {
        text: `Suite : ${start}, ${start + step}, ${start + 2 * step}, ?`,
        answer: start + 3 * step,
      };
    }
    case "moyen": {
      const start = rand(2, 4);
      const ratio = rand(2, 3);
      return {
        text: `Suite : ${start}, ${start * ratio}, ${start * ratio * ratio}, ?`,
        answer: start * ratio ** 3,
      };
    }
    case "difficile": {
      // Fibonacci-like
      const a = rand(2, 6);
      const b = rand(3, 8);
      return {
        text: `Suite : ${a}, ${b}, ${a + b}, ${a + 2 * b}, ?`,
        answer: 2 * a + 3 * b,
      };
    }
    case "extreme": {
      const start = rand(2, 4);
      const ratio = rand(2, 3);
      return {
        text: `Suite : ${start}, ${start * ratio}, ${start * ratio ** 2}, ${start * ratio ** 3}, ?`,
        answer: start * ratio ** 4,
      };
    }
    case "legendaire": {
      // carrés
      const n = rand(3, 7);
      return {
        text: `Suite : ${n * n}, ${(n + 1) ** 2}, ${(n + 2) ** 2}, ?`,
        answer: (n + 3) ** 2,
      };
    }
  }
}

function genText(expr: string): Gen {
  // évalue une expression sûre construite localement (nombres et opérateurs uniquement)
  const safe = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
  const val = Function(`"use strict"; return (${safe});`)() as number;
  return { text: expr, answer: round(val) };
}

const GEN_BY_CAT: Record<Category, (d: Difficulty) => Gen> = {
  addition: genAdd,
  soustraction: genSub,
  multiplication: genMul,
  division: genDiv,
  mixte: genMixed,
  puissances: genPow,
  pourcentages: genPct,
  logique: genLogic,
};

const ALL_CATS: Category[] = [
  "addition",
  "soustraction",
  "multiplication",
  "division",
  "mixte",
  "puissances",
  "pourcentages",
  "logique",
];

/** Choisit une difficulté selon le mode, le numéro de question et le streak. */
export function pickDifficulty(
  mode: GameMode,
  questionIndex: number,
  confused: boolean
): Difficulty {
  // base pondérée selon l'avancée
  let pool: Difficulty[];
  if (mode === "BLITZ") {
    pool =
      questionIndex < 3
        ? ["facile", "facile", "moyen"]
        : questionIndex < 7
          ? ["facile", "moyen", "moyen"]
          : ["moyen", "moyen", "difficile"];
  } else if (questionIndex < 2) {
    pool = ["facile", "facile", "moyen"];
  } else if (questionIndex < 5) {
    pool = ["facile", "moyen", "moyen", "difficile"];
  } else if (questionIndex < 9) {
    pool = ["moyen", "difficile", "difficile", "extreme"];
  } else {
    pool = ["difficile", "extreme", "extreme", "legendaire"];
  }
  let d = pick(pool);
  if (confused && (d === "facile" || d === "moyen" || d === "difficile")) {
    const up: Record<string, Difficulty> = {
      facile: "moyen",
      moyen: "difficile",
      difficile: "extreme",
    };
    d = up[d];
  }
  return d;
}

export function generateQuestion(opts: {
  mode: GameMode;
  questionIndex: number;
  confused?: boolean;
  category?: Category;
}): Question {
  const difficulty = pickDifficulty(opts.mode, opts.questionIndex, !!opts.confused);
  const category = opts.category ?? pick(ALL_CATS);
  try {
    const gen = GEN_BY_CAT[category](difficulty);
    if (!Number.isFinite(gen.answer)) throw new Error("non-finite answer");
    return { text: gen.text, answer: gen.answer, category, difficulty };
  } catch {
    // fallback robuste : addition simple (ne crash jamais)
    const a = rand(2, 20);
    const b = rand(2, 20);
    return { text: `${a} + ${b}`, answer: a + b, category: "addition", difficulty };
  }
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facile: "Facile",
  moyen: "Moyen",
  difficile: "Difficile",
  extreme: "Extrême",
  legendaire: "Légendaire",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  addition: "Addition",
  soustraction: "Soustraction",
  multiplication: "Multiplication",
  division: "Division",
  mixte: "Mixte",
  puissances: "Puissances / Racines",
  pourcentages: "Pourcentages",
  logique: "Logique",
};
