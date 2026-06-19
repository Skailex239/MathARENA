import type { ClassDef, ClassId, Accent } from "./types";

export const CLASSES: Record<ClassId, ClassDef> = {
  guerrier: {
    id: "guerrier",
    name: "Guerrier",
    emoji: "⚔️",
    tagline: "Le mur d'acier. Encaisse, frappe fort, ne lâche rien.",
    hp: 120,
    accent: "red",
    color: "#f44747",
    passive: {
      name: "Peau de fer",
      description: "Les erreurs ne t'infligent que 5 dégâts au lieu de 10.",
    },
    ultimate: {
      name: "Coup de Rage",
      description: "Déchaîne 50 dégâts brutaux à l'adversaire.",
    },
    weakness: "Dégâts de base réduits de 3.",
    x2Threshold: 5,
  },
  mage: {
    id: "mage",
    name: "Mage",
    emoji: "🔮",
    tagline: "Verre de canon. Peu de PV, mais combos explosifs très tôt.",
    hp: 80,
    accent: "violet",
    color: "#b15cff",
    passive: {
      name: "Esprit ardent",
      description: "Combo x2 dès 4 bonnes réponses au lieu de 5.",
    },
    ultimate: {
      name: "Feu Mental",
      description: "Brûle l'adversaire : -5 PV par question pendant 3 questions.",
    },
    weakness: "Très peu de points de vie (80).",
    x2Threshold: 4,
  },
  gardien: {
    id: "gardien",
    name: "Gardien",
    emoji: "🛡️",
    tagline: "Impassible. Accumule des boucliers et bloque les assauts.",
    hp: 100,
    accent: "emerald",
    color: "#3ddc84",
    passive: {
      name: "Aegis",
      description: "Gagne un bouclier de 10 PV toutes les 5 bonnes réponses.",
    },
    ultimate: {
      name: "Mur Mental",
      description: "Bloque les 2 prochaines attaques adverses.",
    },
    weakness: "Aucun bonus offensif.",
    x2Threshold: 5,
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    emoji: "🗡️",
    tagline: "Frappe éclair. Les réponses ultra-rapides déciment.",
    hp: 90,
    accent: "amber",
    color: "#ffb02e",
    passive: {
      name: "Lame temporelle",
      description: "Une réponse en moins de 2s inflige dégâts x2,5.",
    },
    ultimate: {
      name: "Exécution",
      description: "Si l'adversaire a moins de 25 PV : élimination directe.",
    },
    weakness: "Les erreurs t'infligent 15 dégâts au lieu de 10.",
    x2Threshold: 5,
  },
  alchimiste: {
    id: "alchimiste",
    name: "Alchimiste",
    emoji: "⚗️",
    tagline: "Métabolisme régénérateur. Survie par la conversion.",
    hp: 100,
    accent: "magenta",
    color: "#ff3d8b",
    passive: {
      name: "Transmutation",
      description: "Chaque bonne réponse régénère 3 PV.",
    },
    ultimate: {
      name: "Potion Toxique",
      description: "Empoisonne l'adversaire : -3 PV par question pendant 5 questions.",
    },
    weakness: "Combo x2 seulement à partir de 7 bonnes réponses.",
    x2Threshold: 7,
  },
};

export const CLASS_LIST: ClassDef[] = Object.values(CLASSES);

export const ACCENT_CLASSES: Record<
  Accent,
  { text: string; bg: string; border: string; glow: string; from: string; to: string }
> = {
  magenta: {
    text: "text-[#ff3d8b]",
    bg: "bg-[#ff3d8b]",
    border: "border-[#ff3d8b]/60",
    glow: "box-glow-magenta",
    from: "from-[#ff3d8b]/25",
    to: "to-[#ff3d8b]/0",
  },
  violet: {
    text: "text-[#b15cff]",
    bg: "bg-[#b15cff]",
    border: "border-[#b15cff]/60",
    glow: "box-glow-violet",
    from: "from-[#b15cff]/25",
    to: "to-[#b15cff]/0",
  },
  amber: {
    text: "text-[#ffb02e]",
    bg: "bg-[#ffb02e]",
    border: "border-[#ffb02e]/60",
    glow: "box-glow-amber",
    from: "from-[#ffb02e]/25",
    to: "to-[#ffb02e]/0",
  },
  emerald: {
    text: "text-[#3ddc84]",
    bg: "bg-[#3ddc84]",
    border: "border-[#3ddc84]/60",
    glow: "box-glow-emerald",
    from: "from-[#3ddc84]/25",
    to: "to-[#3ddc84]/0",
  },
  red: {
    text: "text-[#f44747]",
    bg: "bg-[#f44747]",
    border: "border-[#f44747]/60",
    glow: "box-glow-magenta",
    from: "from-[#f44747]/25",
    to: "to-[#f44747]/0",
  },
};
