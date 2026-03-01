"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BossNav } from "@/components/boss-prep/boss-nav";
import { CoverageGapSummary, CoverageGrid } from "@/components/coverage-grid/coverage-grid";
import { RouteList } from "@/components/route-view/route-list";
import { TeamPanel } from "@/components/team-panel/team-panel";
import type { GameId } from "@/lib/game-data";
import { getGameData } from "@/lib/game-data";
import { getPokemonTypes } from "@/lib/pokemon";
import { getEncounters, getRun, getTeamPokemon, saveRun } from "@/lib/storage";

export default function RunPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState(() => getRun(params.id));
  const [pokemon, setPokemon] = useState(() => (run ? getTeamPokemon(run.id) : []));
  const [encounters, setEncounters] = useState(() => (run ? getEncounters(run.id) : []));

  const refresh = useCallback(() => {
    if (!run) return;
    const updated = getRun(run.id);
    if (updated) setRun(updated);
    setPokemon(getTeamPokemon(run.id));
    setEncounters(getEncounters(run.id));
  }, [run]);

  // If run was deleted or not found
  useEffect(() => {
    if (!run) {
      router.replace("/");
    }
  }, [run, router]);

  if (!run) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-text-muted">Run not found. Redirecting...</p>
      </div>
    );
  }

  const gameData = getGameData(run.game_id as GameId);
  const currentRoute = gameData.routes.find((r) => r.id === run.current_route_id);
  const currentRouteOrder = currentRoute?.order ?? 0;
  const completedRouteIds = encounters.map((e) => e.route_id);

  function handleRouteChange(routeId: string) {
    if (!run) return;
    const updated = { ...run, current_route_id: routeId, updated_at: new Date().toISOString() };
    saveRun(updated);
    setRun(updated);
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-text-muted/20 bg-surface-raised px-4 sm:px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-text-muted hover:text-text-body transition-colors text-sm"
            >
              &larr; Runs
            </Link>
            <div>
              <h1 className="font-display text-lg font-semibold text-text-primary">{run.name}</h1>
              <p className="text-xs text-text-muted font-mono">{gameData.meta.display_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
            <span className="text-state-alive">
              {pokemon.filter((p) => p.status === "alive").length} alive
            </span>
            <span>/</span>
            <span>{pokemon.length} caught</span>
            {pokemon.filter((p) => p.status === "fainted").length > 0 && (
              <>
                <span>/</span>
                <span className="text-state-death">
                  {pokemon.filter((p) => p.status === "fainted").length} dead
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main layout — sidebar on desktop, stacked on mobile/tablet */}
      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Mobile/Tablet: Team panel strip at top */}
        <div className="lg:hidden">
          <TeamPanel
            pokemon={pokemon}
            currentRouteId={run.current_route_id}
            runId={run.id}
            onUpdate={refresh}
            gameId={run.game_id as "fire-red" | "leaf-green"}
            completedRouteIds={completedRouteIds}
            currentRouteOrder={currentRouteOrder}
          />
        </div>

        {/* Left: Route list */}
        <main className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-text-primary">Route Journal</h2>
            <span className="font-mono text-xs text-text-muted">
              {encounters.length} / {gameData.routes.length} visited
            </span>
          </div>

          <RouteList
            routes={gameData.routes}
            encounters={gameData.encounters}
            runEncounters={encounters}
            pokemon={pokemon}
            runId={run.id}
            currentRouteId={run.current_route_id}
            onEncounterComplete={refresh}
            onRouteChange={handleRouteChange}
          />

          {/* Mobile/Tablet: Coverage and Boss nav below routes */}
          <div className="lg:hidden mt-6 space-y-6">
            {/* Coverage — hidden on small mobile, shown on tablet */}
            <div className="hidden sm:block border-t border-text-muted/15 pt-4">
              <CoverageGrid
                team={pokemon
                  .filter((p) => p.status === "alive")
                  .map((p) => ({ types: getPokemonTypes(p.pokemon_id) }))}
              />
            </div>

            {/* Mobile: simple gap summary instead of full grid */}
            <div className="sm:hidden border-t border-text-muted/15 pt-4">
              <CoverageGapSummary
                team={pokemon
                  .filter((p) => p.status === "alive")
                  .map((p) => ({ types: getPokemonTypes(p.pokemon_id) }))}
              />
            </div>

            {/* Boss nav — horizontal scrollable on mobile/tablet */}
            <div className="border-t border-text-muted/15 pt-4">
              <BossNav bosses={gameData.bosses} runId={run.id} />
            </div>
          </div>
        </main>

        {/* Right: Team panel + analysis — desktop only */}
        <aside className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-6 space-y-6">
            <TeamPanel
              pokemon={pokemon}
              currentRouteId={run.current_route_id}
              runId={run.id}
              onUpdate={refresh}
              gameId={run.game_id as "fire-red" | "leaf-green"}
              completedRouteIds={completedRouteIds}
              currentRouteOrder={currentRouteOrder}
            />

            {/* Type Coverage Grid */}
            <div className="border-t border-text-muted/15 pt-4">
              <CoverageGrid
                team={pokemon
                  .filter((p) => p.status === "alive")
                  .map((p) => ({ types: getPokemonTypes(p.pokemon_id) }))}
              />
            </div>

            {/* Boss Prep Navigation */}
            <div className="border-t border-text-muted/15 pt-4">
              <BossNav bosses={gameData.bosses} runId={run.id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
