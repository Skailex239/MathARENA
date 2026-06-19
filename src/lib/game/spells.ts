import type { SpellDef, SpellId } from "./types";

export const SPELLS: Record<SpellId, SpellDef> = {
  gel: {
    id: "gel",
    name: "Gel",
    emoji: "❄️",
    description: "L'adversaire dispose de 3 s de moins pour la prochaine question.",
    cost: 50,
    target: "enemy",
  },
  feu: {
    id: "feu",
    name: "Feu",
    emoji: "🔥",
    description: "Ta prochaine bonne réponse inflige dégâts x3.",
    cost: 50,
    target: "self",
  },
  soin: {
    id: "soin",
    name: "Soin",
    emoji: "💚",
    description: "Récupère immédiatement 20 PV.",
    cost: 50,
    target: "self",
  },
  confusion: {
    id: "confusion",
    name: "Confusion",
    emoji: "🌀",
    description: "L'adversaire reçoit une question de difficulté supérieure (3 questions).",
    cost: 50,
    target: "enemy",
  },
  miroir: {
    id: "miroir",
    name: "Miroir",
    emoji: "🪞",
    description: "La prochaine erreur de l'adversaire lui inflige 20 dégâts.",
    cost: 50,
    target: "self",
  },
  silence: {
    id: "silence",
    name: "Silence",
    emoji: "🔇",
    description: "L'adversaire perd immédiatement son combo actuel.",
    cost: 50,
    target: "enemy",
  },
  echange: {
    id: "echange",
    name: "Échange",
    emoji: "🔄",
    description: "Échange tes PV actuels avec ceux de l'adversaire.",
    cost: 75,
    target: "self",
  },
};

export const SPELL_LIST: SpellDef[] = Object.values(SPELLS);
