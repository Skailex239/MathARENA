"use client";

import { useApp } from "@/lib/store";
import { Navbar } from "@/components/matharena/Navbar";
import { Footer } from "@/components/matharena/Footer";
import { HomeScreen } from "@/components/matharena/HomeScreen";
import { ClassSelectScreen } from "@/components/matharena/ClassSelectScreen";
import { DuelScreen } from "@/components/matharena/DuelScreen";
import { CompetitiveDuelScreen } from "@/components/matharena/CompetitiveDuelScreen";
import { ResultsScreen } from "@/components/matharena/ResultsScreen";
import ProfileScreen from "@/components/matharena/ProfileScreen";
import LeaderboardScreen from "@/components/matharena/LeaderboardScreen";
import RulesScreen from "@/components/matharena/RulesScreen";
import { ErrorBoundary } from "@/components/matharena/ErrorBoundary";

export default function Home() {
  const view = useApp((s) => s.view);
  const universe = useApp((s) => s.universe);

  // Le duel est plein écran (immersif, sans nav/footer).
  if (view === "duel") {
    return (
      <ErrorBoundary>
        {universe === "arena" ? <DuelScreen /> : <CompetitiveDuelScreen />}
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          {view === "home" && <HomeScreen />}
          {view === "classselect" && <ClassSelectScreen />}
          {view === "results" && <ResultsScreen />}
          {view === "profile" && <ProfileScreen />}
          {view === "leaderboard" && <LeaderboardScreen />}
          {view === "rules" && <RulesScreen />}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
