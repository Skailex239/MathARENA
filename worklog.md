# MathArena — Worklog

Projet : jeu compétitif 1v1 de calcul mental temps réel (gaming). Stack Next.js 16 + Tailwind v4 + shadcn + Prisma/SQLite + Zustand + Recharts + Framer Motion. MVP : 1v1 contre IA (combat complet : PV/énergie/combo/sorts/ultime), profil + stats, leaderboard, design néon sombre.

Thème choisi : palette néon sombre SANS indigo/bleu — magenta/violet, ambre/or, rouge, émeraude.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Foundation — thème gaming globals.css, layout, Prisma schema, db push, git, worklog.

Work Log:
- Lecture de l'existant (package.json, page.tsx, layout, globals.css, schema.prisma, configs).
- Dev server déjà actif sur 3000, git sur branche main.
- Création du worklog partagé.

Stage Summary:
- Point de départ confirmé : scaffold Next.js 16 + Tailwind v4 (oklch vars) + shadcn new-york + Prisma SQLite.
- Décision thème : néon sombre magenta/violet/ambre/rouge/émeraude (pas d'indigo/bleu).
- À suivre : thème CSS, layout, schema Prisma, puis game logic + API en parallèle.

---
Task ID: 2-a
Agent: backend-api (general-purpose)
Task: Backend API MathArena (profile/matches/leaderboard) + seed bots.

Work Log:
- Lecture du worklog (task 1 fondation posée) + vérification schema Prisma, db.ts, configs ESLint/TS.
- Création de `src/lib/game/progression.ts` : helpers purs (levelFromXp, xpForLevelStart, xpForNextLevel, xpProgressInLevel, computeEloChange, computeXpGained) + types MatchResult/GameMode + PlayerLike/ProfileShape/toProfile (purs, sans import Prisma) pour réutilisation entre routes.
- Création de `src/app/api/profile/route.ts` : GET (upsert human id=1, seed 11 bots via transaction idempotente, retourne profile shape) + PATCH (validation body, update name/title/class, title/class nullables).
- Création de `src/app/api/matches/route.ts` : GET (liste triée desc, ?limit= défaut 50 plafonné à 200) + POST (validation stricte body via type guards, calcul eloChange/xpGained, transaction create Match + update Player atomique, retourne {match, profile}).
- Création de `src/app/api/leaderboard/route.ts` : GET top 50 par elo desc avec isMe/winrate/level calculés.
- Tests live via curl : 200 sur les 3 endpoints GET, POST match RANKED WIN (eloChange=16, xpGained=190 = 100 base + 70 combo + 20 speed ✓), POST PRACTICE LOSE (eloChange=0, xpGained=10 ✓), PATCH profile OK, 400 sur body invalide/manquant/JSON cassé/mode invalide.
- Nettoyage des données de test (matches supprimés, player id=1 réinitialisé à Joueur/elo 1000/xp 0). Bots conservés (11).
- `bun run lint` : passe sans erreur ni warning. dev.log : aucune erreur de compilation (grep "error|failed to compile|⨯" → 0 match).

Stage Summary:
- 4 fichiers créés : `src/lib/game/progression.ts`, `src/app/api/profile/route.ts`, `src/app/api/matches/route.ts`, `src/app/api/leaderboard/route.ts`.
- Décisions : (1) toProfile/ProfileShape/PlayerLike placés dans progression.ts (purs, pas d'import Prisma) pour éviter la duplication entre routes profile & matches ; (2) seed bots via `db.$transaction` des 11 creates, idempotent sur `count isBot:true === 0` ; (3) validation POST via type guards explicites (pas de zod) pour rester léger ; (4) cleanup des données de test effectué pour laisser un état vierge au prochain agent (joueur humain reset, 0 match, 11 bots en base).
- Vérification : lint OK, compilation Turbopack OK, tous les endpoints répondent 200/400 attendus. Backend prêt pour la couche UI (task suivante).

---
Task ID: 2-b
Agent: main (Z.ai Code)
Task: Game logic lib — types, classes (5), spells (7), générateur de calculs, duel-engine (pure).

Work Log:
- types.ts : ClassId, SpellId, Difficulty, Category, GameMode, Question, ClassDef, SpellDef, Combatant, DuelState, DuelLogEntry, AnswerResult.
- classes.ts : 5 classes (Guerrier/Mage/Gardien/Assassin/Alchimiste) avec PV, passifs, ultimes, faiblesses, accents néon + map ACCENT_CLASSES.
- spells.ts : 7 sorts (Gel/Feu/Soin/Confusion/Miroir/Silence/Échange) avec coûts énergie.
- math.ts : générateur par catégorie×difficulté (addition/soustraction/multiplication/division/mixte/puissances/pourcentages/logique × facile→légendaire), pickDifficulty selon mode/avancée/confusion, réponses entières.
- duel-engine.ts : createCombatant, createDuel, comboMultiplier (x2 threshold par classe), baseDamageForTime (<2s crit 20, …), playerAnswer (dégâts+combos+passifs+miroir), opponentAnswer (IA: accuracy par difficulté, thinkMs, dégâts), advance (ticks brûlure/poison/confusion + next question), castSpell/castUltimate/activateShield avec gardes.
- Refactor prévu : séparer plan/apply IA pour orchestration timers (cf task 3).

Stage Summary:
- Moteur de combat complet et pur (fonctions immuables). Lint OK (0 erreurs).
- Combats : PV/énergie/combo (x1.5/x2/x3), sorts dès combo≥8, ultime dès combo≥10, passifs de classe, effets de statut (burn/poison/gel/confusion/miroir/mur).
- Prochaine étape : store Zustand + hook useDuel (timers temps réel) + écran Duel.

---
Task ID: 4-a
Agent: ui-profile-leaderboard-rules (general-purpose)
Task: Écrans Profil (stats + charts), Classement, Règles.

Work Log:
- Lecture du worklog (tasks 1, 2-a, 2-b posées : thème néon sombre, backend API, game logic). Vérification de api.ts, store.ts, classes.ts, spells.ts, divisions.ts, types.ts, math.ts, globals.css, page.tsx, et des composants shadcn utilisés (Card, Progress, Table, Skeleton, Badge, Button, Input, Tabs, Separator).
- Création de `src/components/matharena/ProfileScreen.tsx` :
  - Fetch parallèle `api.getProfile()` + `api.getMatches(50)` au mount via useEffect/useCallback, états loading/error.
  - En-tête : avatar emoji de la classe préférée (profile.class ou 🧠), nom éditable (bouton crayon → Input + save via api.patchProfile avec maxLength 24, Echap pour annuler, Entrée pour sauver), titre (Badge), division (divisionFor + emoji + accent), niveau + barre XP (Progress sur levelInfo.current/needed), Elo en gros.
  - Grille de 8 StatCards compactes avec gradient accent : Parties, Victoires, Winrate, Défaites, Meilleur combo, Vitesse moyenne (avgTimeMs/1000), Précision (avg accuracy), Classe préférée (la plus jouée, fallback profile.class).
  - 2 charts Recharts (240px) : LineChart Évolution Elo (magenta, X=numero match, Y=eloAfter, labelFormatter "Match #N") + BarChart Winrate par mode (bars empilées wins émeraude / losses rouge, Légende).
  - Historique des matchs : scroll scrollbar-neon max-h-80, 8 derniers, lignes avec emoji vs emoji, opponentName, Badge WIN/LOSE, eloChange coloré, maxCombo, avgTime, mode badge, date relative FR via date-fns formatDistanceToNow.
  - Empty state "Aucun match joué" + bouton Jouer. Bouton Nouveau duel → setView('classselect'). Skeletons dédiés.
- Création de `src/components/matharena/LeaderboardScreen.tsx` :
  - Fetch `api.getLeaderboard()`, loading/error gérés.
  - Header "Classement mondial" + sous-titre dynamique (count).
  - Top 3 podium animé (Framer Motion, stagger) avec réordonnancement sm: (argent | OR | bronze), glow accent par division, Badge TOI si isMe.
  - Tableau desktop (sm:block) : Rang (#/🥇🥈🥉), Joueur (emoji + nom + TOI/BOT), Division (badge accent), Elo (glow magenta), Niveau, V/D (vert/rouge), Winrate, Combo. Ligne isMe surlignée bg-primary/10 + bordure gauche primary.
  - Cards mobile (sm:hidden) : layout compact, top3 avec glow.
  - Bouton Nouveau duel. Skeletons.
- Création de `src/components/matharena/RulesScreen.tsx` :
  - Hero "Comment jouer" avec grid-bg + gradient magenta/violet.
  - Section Principe : 4 cards (PV 100, Énergie, Bouclier, Ultime).
  - Section Dégâts selon la vitesse : 4 cards (CRITIQUE 20 / Élevé 15 / Standard 10 / Faible 5) avec accent + Separator + Mauvaise réponse (-10/-5/-15) et Timeout (+5 adv).
  - Section Combos : 4 cards (3→x1,5, 5→x2, 8→x3 + sorts, 10→ULTIME).
  - Section Classes : mappe CLASS_LIST → cards avec emoji, nom, PV, Badge x2@threshold, tagline, passif, ultime, faiblesse, accent via ACCENT_CLASSES.
  - Section Sorts : mappe SPELL_LIST → grille (emoji, nom, coût énergie, description, cible).
  - Section Modes : 4 cards PRACTICE/QUICK/BLITZ/RANKED avec emoji, nom, desc, Badge Elo/0 Elo.
  - Section Divisions : mappe DIVISIONS → badges (emoji + nom + "min+ Elo").
- Vérifications : `bun run lint` passe (0 erreurs, 0 warnings). `bunx tsc --noEmit` ne remonte AUCUNE erreur sur les 3 nouveaux fichiers (erreurs pré-existantes dans examples/, skills/, src/hooks/useDuel.ts non concernées par cette task). dev.log : "✓ Compiled" sans erreur après sauvegarde des fichiers.

Stage Summary:
- 3 fichiers créés : `src/components/matharena/ProfileScreen.tsx`, `src/components/matharena/LeaderboardScreen.tsx`, `src/components/matharena/RulesScreen.tsx` (tous 'use client', TypeScript strict sans `any`).
- Lint OK (0 erreurs). Compilation Turbopack OK. Type-check OK sur les 3 fichiers.
- Design : palette néon (magenta/violet/ambre/émeraude/rouge, AUCUN indigo/bleu), utilitaires du thème (.text-glow-*, .box-glow-*, .grid-bg, .scrollbar-neon), accents par division/classe via ACCENT_CLASSES, mobile-first responsive (breakpoints sm:/lg:), touch targets ≥ 44px (min-h-11 sur boutons primaires).
- Non recréé (déjà en place) : thème globals.css, composants shadcn, store Zustand, API client, game data. Pas de navbar/footer ajoutés (gérés par page.tsx). Pas de route ajoutée.
- À noter pour le câblage : `page.tsx` est encore le scaffold par défaut (logo centré). Il faudra que l'agent principal (ou un subagent dédié) importe ces 3 composants + les autres vues (home, classselect, duel, results) et switch via `useApp(s => s.view)`. Les composants sont prêts à être rendus tels quels.

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Store Zustand + hook useDuel (timers temps réel) + composants duel + DuelScreen + IA adversaire.

Work Log:
- store.ts : view (home/classselect/duel/results/profile/leaderboard/rules), selectedClass/Mode, opponent, lastResult.
- api.ts : types Profile/MatchRecord/LeaderboardEntry + helpers fetch (getProfile/patchProfile/getMatches/saveMatch/getLeaderboard).
- divisions.ts : 9 divisions (Fer→Légende) avec seuils Elo + divisionFor().
- useDuel.ts : orchestration temps réel. Refs pour state/answered/opponentDone/plan/timers. Cycle : startQuestion (countdown + timer adversaire via planOpponentTurn) → player submit/timeout ou opponent fire → maybeAdvance (advance() après 800ms). Gestion simultanée joueur+IA, gel, KO, finalize avec stats (answered/correct/totalTimeMs/maxCombo).
- Refactor engine : planOpponentTurn (tire thinkMs+correct+frozen) + applyOpponentTurn (applique) pour permettre au hook de programmer le timer IA au bon thinkMs.
- Composants : CombatantPanel (avatar hex accent, barres PV/énergie, combo badge, statuts, dispo sorts/ultime), SpellDock (7 sorts + bouclier + ultime avec toasts sonner), DuelLog (scroll auto), DuelScreen (header abandon, 2 panneaux, question+timer+input, dock+log).
- Fix TS : startQuestionRef typé en (s: DuelState) => void.

Stage Summary:
- Duel complet et réactif : timers joueur+IA simultanés, dégâts selon vitesse, combos, sorts, ultime, passifs de classe, effets de statut, journal, flashs.
- Lint OK (0 erreurs). Compilation OK.

---
Task ID: 4-b
Agent: main (Z.ai Code)
Task: Écrans Home (landing gaming), ClassSelect, Results + page.tsx router + Navbar + Footer.

Work Log:
- Navbar.tsx : sticky top, logo MathArena, liens (Accueil/Jouer/Profil/Classement/Règles) avec icônes lucide, actif surligné magenta.
- Footer.tsx : sticky bottom (mt-auto), slogan + mentions.
- HomeScreen.tsx : hero "Ton cerveau est ton arme" avec symboles math flottants animés, CTAs, stats strip (5/7/4/x3), preview classes, système combat (3 cards), modes (4 cards), CTA final.
- ClassSelectScreen.tsx : 3 étapes (classe/mode/adversaire), 5 classes sélectionnables avec détail (passif/ultime/faiblesse), 4 modes, adversaire aléatoire reroll, bouton lancer sticky.
- ResultsScreen.tsx : bannière WIN/LOSE animée, sauvegarde match on mount (api.saveMatch), affichage Elo±/XP/level up/division, stats grid, actions Rejouer/Profil/Accueil. Fix lint set-state-in-effect.
- page.tsx : router view. Duel = plein écran sans nav/footer ; autres vues dans layout min-h-screen flex-col avec Navbar + Footer sticky.

Stage Summary:
- App complète et navigable. Lint 0 erreurs, compilation OK.
- Prochaine étape : vérification Agent Browser (render + golden path + responsive + sticky footer), puis git push.

---
Task ID: 5
Agent: main (Z.ai Code)
Task: Vérification end-to-end via Agent Browser (render + golden path + responsive + sticky footer) + corrections.

Work Log:
- Agent Browser : home rendue (slogan/CTA visibles, design gaming validé par VLM).
- Golden path : Home → ClassSelect (Mage+Classé) → Duel → combat → Results. Mécaniques vérifiées via log : crit Assassin ×2.5=50, passif Guerrier erreur=5, timeout→regen adverse, combos, avancement questions.
- BUG CRITIQUE trouvé & corrigé : genPct ("p% de base") et genPow ("n²") produisaient des expressions non-évaluables par Function() → crash createDuel/advance. Refactor : calcul direct des réponses (plus de genText pour ces cas) + try/catch + fallback addition dans generateQuestion.
- BUG trouvé & corrigé : ResultsScreen — setLastResult dans .then changeait une dep de l'effect → cleanup annulait setSaving(false) → skeleton Elo éternel. Refactor avec état `saved` séparé (ne change pas les deps).
- BUG trouvé & corrigé : bouton "Entrer" sticky recouvrait le bouton Blitz → ajout pb-28 au conteneur ClassSelect.
- BUG trouvé & corrigé : imports page.tsx (subagent utilisait export default) → imports default.
- Affichage : suffixe " = ?" retiré pour les questions de suites (déjà "…?").
- Vérifié : Results affiche Elo 968 -16 🥉 Bronze +30 XP. Profil (stats + charts Elo/winrate + historique). Classement (podium + table + badges BOT). Règles. Mobile 390px : pas d'overflow, home validée VLM. Footer sticky (min-h-screen flex-col + mt-auto).
- DB réinitialisée état propre (Joueur, 1000 Elo, 0 match). Lint 0 erreurs.

Stage Summary:
- App vérifiée de bout en bout, interactive, responsive. Tous les bugs bloquants corrigés.

---
Task ID: 6
Agent: main (Z.ai Code)
Task: Git push vers MathARENA repo + paramètres GitHub Pages.

Work Log:
- .gitignore complété (dev.log, verify-*.png, db/*.db, upload/, skills/, etc.).
- Commit complet (thème, game logic, backend, écrans, store, worklog).
- Push sur https://github.com/Skailex239/MathARENA.git branche main : OK.

Stage Summary:
- Code livré sur GitHub (main). 
- NOTE honnête pour l'utilisateur : GitHub Pages = statique uniquement, ne peut PAS exécuter les API routes Next.js ni Prisma. Recommandation : Vercel (full-stack, zéro config). Pages possible seulement via static export + persistance localStorage (refactor à prévoir).
