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

---
Task ID: 5
Agent: ui-redesign-profile-leaderboard-rules (general-purpose)
Task: Restyle Profile (sidebar + charts) / Leaderboard (table) / Rules au nouveau design system.

Work Log:
- Lecture du worklog (contexte : nouveau design system Chess.com × Lichess × Valorant × GitHub dark déjà posé via globals.css + ui.tsx + divisions.ts) et des fichiers de référence (globals.css, ui.tsx, divisions.ts, api.ts, store.ts, classes.ts, spells.ts, math.ts, types.ts, layout.tsx, table.tsx, page.tsx, anciens ProfileScreen/LeaderboardScreen/RulesScreen).
- Note : l'ancien code utilisait `div.accent` (inexistant sur le type Division actuel qui n'a que `color`) — remplacé par usage direct de `divisionFor(elo).color` pour les glows/bordures + `RankBadge(elo)` du design system.
- Réécriture de `src/components/matharena/ProfileScreen.tsx` :
  - Layout sidebar + main : sidebar desktop verticale (w-56, sticky top-20, nav avec 6 items Overview/Stats/Historique/Succès/Amis/Réglages, seuls 3 premiers disponibles, badge "bientôt" sur les autres, active state avec inset shadow bleu) + sidebar mobile horizontale scrollable (scrollbar-none) en haut.
  - Header profil : avatar emoji dans clip-hex avec bordure colorée par division (style inline `border` + `boxShadow` glow), nom éditable (Btn "Renommer" → Input + save via api.patchProfile, Echap annule, Entrée sauve), RankBadge(elo), niveau + barre XP custom (gradient #2563eb→#00d4ff + glow), Elo en gros font-mono text-glow-cyan.
  - Grille de 10 StatTiles (Elo/Niveau/Parties/Victoires/Défaites/Winrate/Meilleur combo/Vitesse moyenne/Précision/Classe préférée) avec accents colorés (cyan/bleu/vert/rouge/ambre/violet).
  - 2 charts Panel ~260px : AreaChart "Évolution de l'Elo" (gradient fill #2563eb, X=match #, Y=eloAfter, tooltip sombre #161b22) + BarChart "Winrate par mode" (wins #22c55e / losses #ef4444 empilés).
  - Historique récent : scroll scrollbar-neo max-h-96, 8 derniers matchs (emoji vs emoji, opponentName, badge mode, combo, temps, date relative fr, badge WIN/LOSE coloré, eloChange font-mono coloré).
  - Onglet Stats : BarChart "Vitesse moyenne par mode" (Cell multi-couleurs palette) + PieChart "Répartition des résultats" (donut innerRadius 48, wins #22c55e / losses #ef4444).
  - Onglet History : Table shadcn complète avec colonnes Date/Adversaire/Classe/Résultat/Elo (change→after)/Combo/Temps/Mode, lignes colorées par résultat, scroll-x scrollbar-neo.
  - Onglets Succès/Amis/Réglages : état "Bientôt disponible" gracieux (icône + label + badge).
  - Empty state si 0 match (Panel + emoji + Btn "Jouer"). Btn "Nouveau duel" → setView('classselect'). Fetch parallèle getProfile + getMatches(50), skeletons dédiés, error state avec retry.
- Réécriture de `src/components/matharena/LeaderboardScreen.tsx` :
  - Header : barre bleue + SectionTitle "Classement" + sous-titre "Les meilleurs calculateurs de MathArena" + Btn "Nouveau duel".
  - Podium top 3 : cards animées Framer Motion (stagger 0.08s), ordre desktop 2e|1er|3e (1er surélevé -translate-y-3), chaque card avec médaille 🥇🥈🥉, avatar clip-hex bordure couleur division, RankBadge, Elo font-mono text-glow-cyan, stats V/D/winrate, gradient bg division color.
  - Table desktop : colonnes Rang/Joueur(emoji+nom+badge TOI/BOT)/Division(RankBadge)/Elo/Niveau/V-D/Winrate. Ligne isMe surlignée bg rgba(37,99,235,0.12) + inset shadow gauche #2563eb. Hover bg #21262d/60.
  - Cards mobile : layout compact avec RankCell, avatar clip-hex, nom+badges, RankBadge+stats, Elo font-mono glow. Ligne isMe + podium avec glow couleur division.
  - Footer note avec icône Crown.
- Réécriture de `src/components/matharena/RulesScreen.tsx` :
  - Hero compact : Panel + grid-bg + radial gradients bleu/violet, emoji 🧠, SectionTitle "Comment jouer" text-glow-cyan, intro, Btn "Lancer un duel".
  - Section "Principe" : 4 tuiles (PV/Énergie/Bouclier/Ultime) avec icônes (Heart/Zap/Shield/Sparkles) dans badges colorés glow, valeur font-mono.
  - Section "Dégâts selon la vitesse" : Panel avec 4 colonnes (CRIT 20 rouge / Élevé 15 ambre / Standard 10 cyan / Faible 5 violet), valeur dmg font-mono text-glow + notes mauvaise réponse (rouge) / timeout (ambre).
  - Section "Combos" : 4 tuiles (3→x1.5 ambre / 5→x2 violet / 8→x3 cyan / 10→ULTIME rouge) avec Panel hover.
  - Section "Classes" : mappe CLASS_LIST → cards premium (emoji clip-hex bordure couleur classe + glow, nom Syne coloré, PV font-mono, badge x2@threshold, tagline italique, passif/ultime/faiblesse avec labels colorés).
  - Section "Sorts" : mappe SPELL_LIST → grille (emoji, nom Syne, coût énergie ambre font-mono, description, badge cible self vert/enemy rouge).
  - Section "Modes" : 4 cards (PRACTICE violet/QUICK ambre/BLITZ rouge/RANKED bleu) avec emoji dans badge coloré, badge Elo/0 Elo.
  - Section "Divisions" : mappe DIVISIONS → badges (emoji clip-hex bordure couleur rang + glow, nom coloré, seuil "X+ Elo" font-mono).
  - Tous les titres de section en Syne avec petite barre bleue à gauche (shadow glow bleu) via RuleSectionTitle helper.
- Vérifications : `bun run lint` passe (0 erreurs, 0 warnings). `bunx tsc --noEmit` : 0 erreurs sur les 3 fichiers (erreurs pré-existantes uniquement dans examples/ et skills/, non concernées). dev.log : "✓ Compiled" sans erreur après les éditions finales (un `ReferenceError: Brain is not defined` transitoire apparu pendant l'itération suite à des `void Brain` référençant un import supprimé a été corrigé en retirant les imports unused).
- Design : palette stricte du nouveau design system (#0D1117/#161B22/#21262D/#30363D/#2563EB/#8B949E/#00D4FF/#7C3AED/#F59E0B/#22C55E/#EF4444), AUCUN indigo sauf #2563EB primary, utilitaires .glow-*/.text-glow-cyan/.grid-bg/.scrollbar-neo/.clip-hex utilisés, fonts Syne (titres via SectionTitle) / Inter (corps) / JetBrains Mono (chiffres/elo/scores), dark-first (aucun fond blanc), contrastes forts, espacement 8px, touch targets ≥ 44px (min-h-11 sur tous les Btn), pas de navbar/footer ajoutés.
- Imports utilisés : `Btn, Panel, SectionTitle, StatTile, RankBadge` de `@/components/matharena/ui` ; `divisionFor, DIVISIONS` de divisions ; `CLASS_LIST, SPELL_LIST` ; `api, useApp` ; Recharts (AreaChart/BarChart/PieChart/Cell/Legend) ; Framer Motion (podium) ; date-fns (dates relatives fr) ; lucide-react ; shadcn Table/Input/Skeleton.

Stage Summary:
- 3 fichiers réécrits (écrasés) : `src/components/matharena/ProfileScreen.tsx` (~927 lignes, sidebar 6 tabs + 3 charts + table complète), `src/components/matharena/LeaderboardScreen.tsx` (~357 lignes, podium animé + table desktop + cards mobile), `src/components/matharena/RulesScreen.tsx` (~486 lignes, 7 sections premium depuis données de jeu). Tous 'use client', TypeScript strict sans `any`.
- Lint : 0 erreurs, 0 warnings. Compilation Turbopack : ✓ (dev.log propre après édition finale). Type-check : 0 erreur sur les 3 fichiers (erreurs pré-existantes examples/skills non concernées).
- Design system Chess.com × Lichess × Valorant × GitHub dark appliqué intégralement : palette exacte, primitives ui.tsx (Btn/Panel/StatTile/RankBadge/SectionTitle), utilitaires glow/grid-bg/scrollbar-neo/clip-hex, fonts Syne/Inter/JetBrains Mono, dark-first, rangs via divisionFor().color, RankBadge partout.
- Non modifié : navbar/footer (gérés par page.tsx), store, API, game data, globals.css, ui.tsx, divisions.ts.

---
Task ID: redesign (1-4)
Agent: main (Z.ai Code)
Task: Refonte UI complète vers design system Chess.com × Lichess × Valorant × GitHub dark.

Work Log:
- globals.css : palette exacte spec (#0D1117/#161B22/#21262D/#30363D/#2563EB/#8B949E + cyan/purple/amber + rangs). Utilitaires glow-blue/cyan/purple/amber/danger/success, grid-bg, scrollbar-neo, clip-hex, animations (shake, correct, flash-red/green, pulse-danger/blue, float-up). Note : bleu #2563EB explicitement demandé par l'utilisateur → autorisé.
- layout.tsx : fonts Syne (display) + Inter (sans) + JetBrains Mono (mono) via next/font.
- divisions.ts : 9 rangs avec tier (IRON→LEGEND) + couleurs spec exactes.
- ui.tsx : primitives branded (Btn primary/secondary/danger/ghost, Panel, SectionTitle, StatTile, HealthBar vert/ambre/rouge+pulse, EnergyBar bleu→cyan, ComboBadge, RankBadge pill couleur rang).
- Navbar : Chess.com style (logo + Accueil/Jouer/Classement/Profil + Connexion), sticky backdrop-blur.
- Footer : 4 colonnes + liens (Duel 1v1, Comment jouer).
- HomeScreen : hero "Your brain is your weapon" + live players counter + Play Now/Watch Match + stats strip + How it works (3 steps) + Game modes + Leaderboard preview (fetch live) + Testimonials + CTA.
- CombatantPanel : avatar clip-hex, RankBadge, HealthBar/EnergyBar, ComboBadge, statuts, dispo sorts/ultime, flash/shake.
- SpellDock + EmoteDock (5 emotes limitées anti-spam) + DuelLog.
- DuelScreen : timer top-centre (JetBrains Mono, rouge<3s+pulse), panneaux L/R, question+input glow (flash vert correct+scale / rouge+shake incorrect), sorts+emotes+log en bas.
- ClassSelectScreen + ResultsScreen : refaits au nouveau style (cards hover glow, badges rang, carte Elo animée).
- Subagent 5 : restyle ProfileScreen (sidebar Overview/Stats/Historique + charts AreaChart Elo + BarChart winrate + table), LeaderboardScreen (podium + table + ligne user surlignée), RulesScreen (7 sections premium).

Stage Summary:
- Refonte complète vérifiée via Agent Browser + VLM (home desktop+mobile, duel desktop+mobile, results, profile, leaderboard, rules). Lint 0 erreurs. DB reset. Aucun overflow mobile. Footer sticky.

---
Task ID: 6 (redesign)
Agent: main (Z.ai Code)
Task: Vérification Agent Browser + push git.

Work Log:
- Agent Browser : home validée VLM (dark, typo bold, Play Now bleu, style esport). Duel validé VLM (timer top, panneaux L/R, question centrée, sorts en bas). Réponse correcte testée (Suite 3,5,7→9, avancement Q2). Results validé (carte Elo 984 -16 BRONZE +30 XP). Profile validé (sidebar + 10 StatTiles + AreaChart Elo + BarChart winrate + historique). Leaderboard validé (podium + table + badges BOT). Rules validé (7 sections). Mobile 390px : pas d'overflow, home + duel validés VLM.
- Lint 0 erreurs. DB reset (Joueur 1000 Elo 0 match). Push git sur main.

Stage Summary:
- Redesign livré et vérifié. App premium esport dark-first.

---
Task ID: 6
Agent: ui-sober-profile-leaderboard-rules (general-purpose)
Task: Restyle sobre Profile/Leaderboard/Rules (Chess.com dashboard style).

Work Log:
- Lecture du worklog (contexte : design system sobre Chess.com × Lichess × Faceit × Linear × GitHub dark déjà posé via globals.css + ui.tsx + divisions.ts). Lecture des fichiers de référence : globals.css (palette neutre + accent #3B82F6, semantic success/danger/warning), ui.tsx (primitives Btn/Panel/PageTitle/SectionLabel/StatTile/HealthBar/EnergyBar/RankBadge/Tabs/DataTable), divisions.ts (9 rangs Fer→Légende), api.ts (Profile/MatchRecord/LeaderboardEntry), store.ts (View + setView), classes.ts (5 classes), spells.ts (7 sorts), math.ts (CATEGORY_LABEL/DIFFICULTY_LABEL), types.ts, page.tsx (router view).
- Réécriture de `src/components/matharena/ProfileScreen.tsx` :
  - Layout sidebar desktop (w-200px sticky) + barre horizontale scrollable (scrollbar-none) sur mobile. Nav 5 items : Overview / Stats / Games (réels) + Achievements / Settings (état "Bientôt disponible" sobre).
  - Overview : en-tête sobre Panel avec nom éditable (Pencil → Input + Save via api.patchProfile, Echap annule, Entrée sauve, maxLength 24, toast sonner), RankBadge(elo), niveau + barre XP custom (div simple bleu #3B82F6, pas de gradient), Elo en JetBrains Mono. Grille 10 StatTiles (Elo/Niveau/Parties/V/D/Winrate/Meilleur combo/Vitesse moyenne/Précision/Classe préférée) responsive (2→5 colonnes). Section "Historique du rating" : LineChart Recharts sobre (ligne #3B82F6, pas de gradient fill, axes #6E7681, grid #232A33, tooltip sombre #161B22) hauteur 220px, data = matchs triés date asc, X=match#, Y=eloAfter. Section "Parties récentes" : DataTable dense 8 colonnes (Date relative/Adversaire/Classe/Résultat WIN #2EA043-LOSE #F85149/Elo ±/Combo/Temps/Mode), 10 derniers.
  - Stats tab : BarChart Recharts sobre (wins #2EA043 / losses #F85149 stackées, grid #232A33, axes #6E7681, Legend) hauteur 260px + DataTable "Statistiques par mode" (Mode/Parties/V/D/Winrate/Temps moyen/Précision) + 4 StatTiles profil global.
  - Games tab : DataTable complète 10 colonnes (Date/Adversaire/Classe/Adv. classe/Résultat/Elo ±/Combo/Temps/Précision/Mode) avec scroll-x scrollbar-thin.
  - Achievements/Settings tabs : Panel sobre "Bientôt disponible".
  - Fetch parallèle getProfile + getMatches(50) au mount, skeletons sobres (panels gris), error state avec retry (AlertCircle rouge + Btn "Réessayer"). Empty state si 0 match : Panel + Clock + "Aucune partie jouée" + Btn "Jouer" → setView('classselect'). Boutons communs en bas (Nouveau duel + Classement).
- Réécriture de `src/components/matharena/LeaderboardScreen.tsx` :
  - Header : PageTitle "Classement" + sous-titre gris (count joueurs) + Tabs filtres (Tous / Top 10 / En progression) + Btn "Nouveau duel".
  - Table full-width dense via DataTable : colonnes Rang (# dans badge w-6 h-6, or-argent-bronze colorés)/Joueur (nom + badge "TOI" bleu si isMe + badge "BOT" neutre si isBot)/Division (RankBadge(elo))/Elo (mono)/Niveau (mono)/Parties/V (#2EA043 mono)/D (#F85149 mono)/Winrate (mono). Ligne isMe surlignée (rgba(59,130,246,0.08)) via prop `highlight`.
  - PAS de podium décoratif, juste la table dense scannable. Scroll-x scrollbar-thin sur mobile.
  - Note bas de page avec SectionLabel "Note" + texte gris. Fetch getLeaderboard, skeletons sobres (lignes gris), error state avec retry.
- Réécriture de `src/components/matharena/RulesScreen.tsx` :
  - Style documentation Linear/GitHub. PageTitle "Comment jouer" + intro 14px gris + Btn "Lancer un duel" (Swords icon).
  - Section helper `Section` : SectionLabel (uppercase gris) + H2 18px font-semibold + intro optionnel 14px gris.
  - 7 sections très espacées (space-y-12) :
    1. Principe — 4 StatTiles (PV 100 + Heart rouge / Énergie 0→100 + Zap bleu / Bouclier +10 + Shield gris / Ultime combo 10 + Sparkles bleu), valeurs en JetBrains Mono.
    2. Dégâts selon la vitesse — DataTable 3 colonnes (Temps/Dégâts/Type) avec 4 lignes (<2s=20 CRIT rouge / 2-4s=15 / 4-6s=10 / 6-10s=5) + 2 notes AlertTriangle ambre (mauvaise réponse, timeout).
    3. Combos — DataTable 3 colonnes (Combo/Multiplicateur/Effet) avec 4 lignes (3→×1,5 / 5→×2 / 8→×3 + sorts / 10→Ultime), multiplicateurs en bleu mono.
    4. Classes — DataTable 6 colonnes (Classe/PV/Combo ×2/Passif/Ultime/Faiblesse) pour les 5 classes, PAS de cards colorées, juste emoji + texte sobre.
    5. Sorts — DataTable 4 colonnes (Sort/Coût mono bleu/Cible badge Soi vert ou Adv. rouge/Description) pour les 7 sorts.
    6. Modes — DataTable 3 colonnes (Mode/Identifiant mono gris/Description) pour 4 modes.
    7. Divisions — DataTable 4 colonnes (Tier mono/Division avec dot couleur inline/Couleur swatch + hex mono/Elo minimum mono) pour 9 divisions.
- Vérifications :
  - `bun run lint` : 0 erreur, 0 warning.
  - `bunx tsc --noEmit` : 0 erreur sur les 3 fichiers créés. Erreurs pré-existantes dans `examples/` (socket.io) et `skills/` non concernées.
  - Erreurs TS pré-existantes (NON introduites par cette task) : `HomeScreen.tsx`, `ClassSelectScreen.tsx`, `CombatantPanel.tsx` importent `SectionTitle` et `ComboBadge` qui n'existent plus dans `ui.tsx` (supprimés par le passage au design system sobre). Ces fichiers ne sont PAS dans le scope de cette task (Profil/Leaderboard/Rules uniquement) → laissés en l'état. Conséquence : la route `/` retourne 500 en SSR car HomeScreen tente de rendre `SectionTitle` (undefined). Les écrans Profile/Leaderboard/Rules ne peuvent pas être testés end-to-end via le routeur tant que ces imports ne sont pas corrigés par un autre subagent.
- Design system strictement appliqué : palette 90% neutre (#0E1116/#161B22/#1C2128/#22272E + texte #E6EDF3/#9BA4B0/#6E7681), 10% bleu #3B82F6 (actions + barre XP + multiplicateurs), semantic success #2EA043 / danger #F85149 / warning #D29922 sparingly (wins/losses, AlertTriangle). PAS de violet, PAS de rose, PAS d'orange, PAS de glow, PAS de shadow, PAS de gradient, PAS de lift. Fonts Inter partout + JetBrains Mono pour Elo/chiffres/timers/ratings. Composants plats radius 6-8px via primitives ui.tsx. Tables denses zebra subtle + hover via DataTable. Icônes lucide w-3.5/4 h-3.5/4 monochromes text-[#9ba4b0]/text-[#6e7681]. Badges petits (11px uppercase) fond très léger teinté. Pas de navbar/footer ajoutés (gérés par page.tsx).

Stage Summary:
- 3 fichiers réécrits (écrasés) : `src/components/matharena/ProfileScreen.tsx` (~750 lignes, sidebar + Overview/Stats/Games/ComingSoon + LineChart + BarChart + 2 DataTables), `src/components/matharena/LeaderboardScreen.tsx` (~195 lignes, table dense avec filtres Tabs), `src/components/matharena/RulesScreen.tsx` (~430 lignes, 7 sections Linear/GitHub docs). Tous 'use client', TypeScript strict sans `any`, cn() partout.
- Lint : 0 erreur, 0 warning. Type-check : 0 erreur sur les 3 fichiers. Compilation Turbopack : ✓ (dev.log propre pour les 3 fichiers).
- Design Chess.com dashboard sobre appliqué intégralement : primitives ui.tsx (Btn/Panel/PageTitle/SectionLabel/StatTile/RankBadge/Tabs/DataTable), palette neutre + accent bleu unique, fonts Inter + JetBrains Mono, dark-only, dense et scannable, PAS de déco glow/gradient/lift.
- Non modifié : navbar/footer (page.tsx), store, API, game data, globals.css, ui.tsx, divisions.ts.
- Problème à signaler : `HomeScreen.tsx`, `ClassSelectScreen.tsx`, `CombatantPanel.tsx` sont cassés (imports `SectionTitle`/`ComboBadge` supprimés du nouveau ui.tsx) → route `/` retourne 500 en SSR. À corriger par un autre subagent (hors scope de cette task 6). Les 3 écrans Profile/Leaderboard/Rules sont prêts et fonctionnels dès que la navigation sera restaurée.

---
Task ID: redesign-v2 (1-7)
Agent: main (Z.ai Code)
Task: Refonte vers dashboard compétitif sobre (Chess.com/Lichess/Faceit/Linear/GitHub dark).

Work Log:
- globals.css : palette limitée neutres + 1 accent bleu #3B82F6. Supprimé tous les glow/gradient décoratifs/animations flashy. Gardé shake (input), timer-urgent, fade-in subtils.
- layout.tsx : Inter + JetBrains Mono uniquement (retiré Syne). Pas de display font.
- divisions.ts : 9 rangs, couleurs appliquées sobrement (texte + bordure fine).
- ui.tsx : primitives sobres — Btn plat radius 6px sans glow, Panel #161B22 border #2D333B sans gradient/lift, PageTitle (28px), SectionLabel (12px uppercase), StatTile, HealthBar compacte, EnergyBar, RankBadge minimal, Tabs (style Chess.com), DataTable (dense zebra+hover).
- Navbar sobre (h-12, liens Accueil/Jouer/Classement/Profil + Connexion).
- HomeScreen = DASHBOARD (PAS de hero) : zone play gauche (tabs mode + Lancer + parties récentes + classes) + sidebar droite (joueurs en ligne live + top joueurs + actualités).
- ClassSelectScreen sobre : tabs mode + liste horizontale classes monochrome + détail texte + petit panneau adversaire + CTA compact à droite.
- DuelScreen minimal : top bar (abandon|timer centre|mode), 2 panneaux L/R, question mono centre, input (flash bordure vert/rouge), sorts + log mono bas.
- CombatantPanel/SpellDock/DuelLog sobres (icônes monochromes, pas de glow, log type chess move log mono).
- ResultsScreen sobre (badge résultat + Elo + XP + stats en table).
- Subagent 6 : ProfileScreen (sidebar + StatTiles + LineChart Elo + DataTable), LeaderboardScreen (table dense full-width), RulesScreen (style doc Linear).

Stage Summary:
- Vérifié Agent Browser + VLM : home sobre dashboard (pas mobile-game, 3 couleurs max, cards plates, tables denses), duel minimal dense, results/profile/leaderboard/rules sobres. Mobile 390px validé (pas d'overflow, duel lisible). Lint 0 erreurs. DB reset. Push sur main.

---
Task ID: 8
Agent: ui-dual-universe-profile-leaderboard (general-purpose)
Task: Adapt Profile (dual elos + stats 2 univers) + Leaderboard (toggle univers) pour les deux univers.

Work Log:
- Lecture du worklog (contexte : design system sobre Chess.com/Linear déjà posé via globals.css + ui.tsx + divisions.ts ; backend dual-universe déjà en place côté schema.prisma + routes API + store + api.ts). Lecture des fichiers de référence : ui.tsx (primitives Btn/Panel/PageTitle/SectionLabel/StatTile/RankBadge/Tabs/DataTable), api.ts (Profile avec eloCompetitive/eloArena/winsArena/lossesArena/winrateArena/totalMatchesArena + MatchRecord avec universe/playerClass=null en compétitif + LeaderboardEntry avec elo de l'univers sélectionné), store.ts (universe + setUniverse + view + setView), divisions.ts (divisionFor(elo)), progression.ts (type Universe = "competitive"|"arena"), classes.ts (CLASSES record), page.tsx (router view), leaderboard/route.ts (orderBy elo vs eloArena), matches/route.ts (universe filter).
- Réécriture de `src/components/matharena/LeaderboardScreen.tsx` (~170 lignes) :
  - Toggle d'univers en haut via `Tabs` (Compétitif / Arène) synchronisé avec `useApp` (`universe` + `setUniverse`). Au changement, `useEffect([universe])` déclenche `reload(universe)` qui appelle `api.getLeaderboard(universe)`. L'univers est donc global (partagé avec les autres écrans via le store).
  - Header : PageTitle "Classement" + sous-titre dynamique selon l'univers ("Elo officiel — pur skill, sans sorts ni classes." / "Elo arène — gaming, classes, sorts et combos."). Btn "Nouveau duel" → setView('classselect').
  - Table dense full-width via `DataTable<LeaderboardRow>` : 9 colonnes Rang (# dans badge w-6 h-6 coloré or/argent/bronze)/Joueur (nom + badge "Toi" bleu si isMe + badge "Bot" neutre si isBot)/Division (RankBadge(e.elo) qui utilise l'elo de l'univers sélectionné)/Elo (font-mono)/Niveau (font-mono)/Parties (V+D)/V (#2ea043 mono)/D (#f85149 mono)/Winrate (mono %). PAS de podium décoratif. Ligne isMe surlignée (rgba(59,130,246,0.08)) via prop `highlight` (utiliser un champ `_isMe?: boolean` dans le type row + `Boolean(r._isMe)` pour rester typé sans `any`).
  - États : loading=skeleton (lignes gris anim-pulse), error=Panel + AlertCircle rouge + Btn "Réessayer" → `reload(universe)`, empty=Panel sobre "Aucun joueur dans ce classement."
  - Note bas de page dynamique selon l'univers. Scroll-x scrollbar-thin mobile via DataTable.
- Réécriture de `src/components/matharena/ProfileScreen.tsx` (~640 lignes) :
  - Layout sidebar desktop (w-[200px] sticky top-20) + barre horizontale scrollable (scrollbar-none) sur mobile. Nav 5 items : Vue d'ensemble / Statistiques / Parties (réels) + Succès / Réglages (état "Bientôt disponible" sobre via ComingSoon).
  - Overview :
    - ProfileHeader : nom éditable (Pencil → Input + Save via api.patchProfile, Echap annule, Entrée sauve, maxLength 24, toast sonner) + titre italique gris si présent + DEUX RankBadge côte à côte avec labels "Compétitif" (eloCompetitive) / "Arène" (eloArena) + ligne Elo compétitif/Arène/Niveau en font-mono + bloc XP à droite (barre custom bleu #3B82F6, pas de gradient).
    - Section StatTiles "Statistiques · Compétitif" (7 tuiles en grille xl:grid-cols-7) : Elo / Parties / V / D / Winrate / Vitesse moyenne (calculée sur matchs compétitifs) / Précision (calculée sur matchs compétitifs).
    - Section StatTiles "Statistiques · Arène" (7 tuiles) : Elo arène / Parties / V / D / Winrate / Meilleur combo (profile.bestCombo) / Classe préférée (calculée depuis les playerClass des matchs d'arène, fallback profile.class).
    - Section "Historique du rating" : LineChart Recharts sobre (ligne #3B82F6, pas de gradient fill, axes #6e7681, grid #232a33, tooltip sombre #161b22, Y domain "dataMin-20"→"dataMax+20") hauteur 220px. Toggle Compétitif/Arène via Tabs local (ratingUniverse state, défaut "competitive"). Data = matchs filtrés par l'univers sélectionné, triés date asc, X=n° match, Y=eloAfter.
    - Section "Parties récentes" : DataTable dense 9 colonnes (Date relative fr / Univers badge "Comp" bleu ou "Arène" neutre via UniverseBadge / Adversaire / Classe via ClassCell qui affiche "—" si playerClass null / Résultat WIN #2ea043 LOSE #f85149 / Elo ± via EloChange coloré / Combo via ComboCell qui affiche "—" en compétitif / Temps mono / Mode). 10 derniers matchs. Empty state si 0 match (Panel + Clock + "Aucune partie jouée" + Btn "Jouer" → setView('classselect')).
  - Stats tab : 2 BarCharts Recharts sobres (wins #2ea043 / losses #f85149 stackés, grid #232a33, axes #6e7681, Legend) hauteur 240px — un pour les modes compétitifs, un pour les modes arène. + DataTable "Statistiques par mode" (compétitif uniquement : Mode/Parties/V/D/Winrate/Temps moyen/Précision) construite via helper pur `buildModeStats(matches, universe)`. + 4 StatTiles profil global (Elo compétitif / Elo arène / Niveau / Meilleur combo).
  - Games tab : DataTable complète 11 colonnes (Date/Univers/Adversaire/Classe/Adv. classe/Résultat/Elo ±/Combo/Temps/Précision/Mode) avec scroll-x scrollbar-thin.
  - Achievements/Settings tabs : Panel sobre "Bientôt disponible" via ComingSoon.
  - Fetch parallèle getProfile + getMatches(50) au mount, skeletons sobres (panels gris anim-pulse), error state avec retry (AlertCircle rouge + Btn "Réessayer"). Boutons communs en bas (Nouveau duel → setView('classselect') + Classement → setView('leaderboard')).
  - Sous-composants typés sans `any` : `type GameRow = Record<string, React.ReactNode>`, `type LeaderboardRow = Record<string, React.ReactNode> & { _isMe?: boolean }`, helper `buildModeStats(matches, universe)` retournant `ModeStat[]`.
- Vérifications :
  - `bun run lint` : 0 erreur, 0 warning.
  - `bunx tsc --noEmit` : 0 erreur sur `ProfileScreen.tsx` et `LeaderboardScreen.tsx`. Erreurs TS pré-existantes dans `examples/websocket/*`, `skills/*`, `src/app/api/profile/route.ts` (typo seed), `src/components/matharena/ResultsScreen.tsx` + `src/hooks/useDuel.ts` (champ `universe` manquant dans saveMatch) — NON introduites par cette task, NON dans le scope UI.
  - Backend : le client Prisma était STALE (le `@prisma/client` généré ne connaissait ni `id` ni `eloArena`/`winsArena`/`lossesArena`). Résultat : `/api/profile` retournait 500 (`Unknown argument id`) et `/api/leaderboard?universe=arena` retournait 500 (`Unknown argument eloArena`). Fix appliqué : `bunx prisma generate` + suppression du cache `.next/` + redémarrage du dev server. AUCUN fichier backend modifié — juste régénération du client Prisma et invalidation du cache Turbopack.
  - Après fix : `curl /api/profile` → 200 JSON avec `eloCompetitive:1000, eloArena:1000, winsArena:0, lossesArena:0, winrateArena:0, totalMatches:0, totalMatchesArena:0, levelInfo:{...}`. `curl /api/leaderboard?universe=competitive` → 200 JSON trié par `elo` DESC (NeuroBlade #1 elo 1480). `curl /api/leaderboard?universe=arena` → 200 JSON trié par `eloArena` DESC (PyroMath #1 elo 1460). `curl /api/matches?limit=5` → 200 `[]` (aucun match joué).
  - dev.log : `✓ Compiled in 141ms` / `✓ Compiled in 174ms` / `GET /api/profile 200` / `GET /api/leaderboard?universe=competitive 200` / `GET /api/leaderboard?universe=arena 200`. Aucune erreur de compilation ou runtime liée aux 2 fichiers UI.
- Design system strictement appliqué : palette neutre (#0E1116/#161B22/#1C2128/#22272E + texte #E6EDF3/#9BA4B0/#6E7681) + 1 accent bleu #3B82F6 (tabs actifs, barre XP, ligne du chart, badge "Comp", bordure active sidebar). Semantic #2EA043 (victoires, WIN badge, ligne wins BarChart) / #F85149 (défaites, LOSE badge, ligne losses BarChart) / #D29922 (rang #1 or) sparingly. PAS de violet/rose/orange, PAS de glow/gradient/shadow/lift. Fonts Inter (UI) + JetBrains Mono (Elo/chiffres/timers/ratings via `font-mono`). Primitives ui.tsx utilisées partout (Btn/Panel/PageTitle/SectionLabel/StatTile/RankBadge/Tabs/DataTable). Icônes lucide monochromes (Pencil/Save/X/AlertCircle/Clock) en w-3.5/4 h-3.5/4. Badges petits (10-11px uppercase) fond très léger teinté. Pas de navbar/footer ajoutés (gérés par page.tsx).

Stage Summary:
- 2 fichiers réécrits (écrasés) : `src/components/matharena/LeaderboardScreen.tsx` (~170 lignes, toggle d'univers Tabs sync useApp + DataTable 9 colonnes dense, ligne isMe surlignée, PAS de podium) + `src/components/matharena/ProfileScreen.tsx` (~640 lignes, sidebar nav + Overview dual-rank/dual-elo/2 sections StatTiles 7 tuiles compétitif+arène/LineChart rating avec toggle univers/DataTable parties récentes avec badge Univers + Stats tab 2 BarCharts par univers + Games tab DataTable complète 11 colonnes avec colonne Univers). Tous 'use client', TypeScript strict sans `any`, `cn()` partout, primitives ui.tsx utilisées.
- Lint : 0 erreur, 0 warning. Type-check : 0 erreur sur les 2 fichiers UI. Compilation Turbopack : ✓ (dev.log propre pour les 2 fichiers, `✓ Compiled in 141ms`).
- Backend : client Prisma régénéré (`bunx prisma generate`) + cache `.next/` invalidé + dev server redémarré pour faire fonctionner les routes dual-universe (`/api/profile`, `/api/leaderboard?universe=competitive|arena` retournent maintenant 200 avec les champs `eloCompetitive`/`eloArena`/`winsArena`/`lossesArena`/etc.). AUCUN fichier backend modifié.
- Problèmes signalés (hors scope UI) :
  - `src/app/api/profile/route.ts` lignes 25-35 : chaque seed bot a `losses: X, ..., losses: Y` écrit DEUX fois (le second devrait être `lossesArena: Y`). Conséquence : `lossesArena` reste à 0 pour tous les bots → winrate arène = 100% pour tous les bots au leaderboard arène. À corriger par un subagent backend.
  - `src/components/matharena/ResultsScreen.tsx` + `src/hooks/useDuel.ts` : `saveMatch` est appelé sans le champ `universe` requis par `SaveMatchBody` → TS2345. À corriger par un subagent duel.
  - `examples/websocket/*` + `skills/*` : erreurs TS pré-existantes non concernées.

---
Task ID: dual-universe (1-9)
Agent: main (Z.ai Code)
Task: Deux univers dans le même site — Compétitif (pur skill, Chess.com) & Arène (gaming, classes/sorts).

Work Log:
- Prisma schema : ajout eloArena/winsArena/lossesArena sur Player ; match.universe + playerClass/opponentClass optionnels. db push + re-seed bots (11 bots avec deux elos + lossesArena corrigé).
- progression.ts : computeEloChange/computeXpGained prennent universe (compétitif = Elo toujours hors PRACTICE ; arène = RANKED/BLITZ). toProfile renvoie les deux elos + winrates.
- API : profile (dual elos), matches (POST prend universe, update le bon elo/wins/losses), leaderboard (?universe= trie par elo ou eloArena). Tous vérifiés 200.
- store.ts : ajout universe 'competitive'|'arena' + setUniverse. MatchResultPayload étendu (universe, classes nullables).
- api.ts : types étendus (Profile dual, MatchRecord universe, LeaderboardEntry dual, SaveMatchBody universe).
- competitive-engine.ts : pur skill. createCompDuel, planOpponent (thinkMs + accuracy par difficulté), playerSubmit (correct=+1, wrong=lockout, timeout=annul), opponentFire (+1 ou trompe), advanceComp (gameover à TARGET_SCORE=7). Garde-fou question undefined.
- useCompetitiveDuel.ts : timers (countdown + opponentTimer), resolvedRef/opponentDoneRef, handleTimeout/handleOpponentFire avec gardes, commit défensif. Bug "log pas de re-render" corrigé (nouveau array log dans handleTimeout).
- CompetitiveDuelScreen : score panel Chess.com (Toi | X — Y | adversaire + barres progression vers 7), question mono, input (flash vert/rouge), log mono bas. Garde !state.question.
- HomeScreen : switcher d'univers (Tabs Compétitif/Arène) + dashboard adapté (play panel, parties récentes filtrées par univers, classes pour arène / "comment ça marche" pour compétitif, sidebar top joueurs de l'univers).
- ClassSelectScreen : branching (compétitif = pas de section classe, 3 modes ; arène = classes + 4 modes).
- ResultsScreen : adapté (universe, "Score final" en compétitif / "PV restants" en arène, "Elo compétitif/arène").
- page.tsx : router duel → CompetitiveDuelScreen ou DuelScreen selon universe. ErrorBoundary.
- useDuel (arène) : onFinish payload avec universe:'arena'.
- Subagent 8 : ProfileScreen (sidebar + 2 sections StatTiles compétitif/arène + LineChart + DataTable avec colonne univers), LeaderboardScreen (toggle univers + table dense).

Stage Summary:
- Vérifié Agent Browser : switcher d'univers OK, duel compétitif (VICTOIRE 7-2, Elo 1000→1016, sauvegardé), duel arène (DÉFAITE BLITZ, Elo arène 1000→968, sauvegardé), profil dual elos, leaderboard toggle (comp: NeuroBlade#1 1480 / arène: PyroMath#1 1460). Lint 0 erreurs. DB reset. Push sur main.
