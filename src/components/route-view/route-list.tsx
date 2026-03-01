"use client";

import { useState } from "react";
import { EncounterDialog } from "@/components/encounter-log/encounter-dialog";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EncounterEntry, RouteData, RouteEncounterData } from "@/lib/game-data";
import { getRouteEncounters } from "@/lib/game-data";
import { getPokemonName } from "@/lib/pokemon";
import type { RunEncounter, RunPokemon } from "@/types/domain";

interface RouteListProps {
  routes: RouteData[];
  encounters: RouteEncounterData[];
  runEncounters: RunEncounter[];
  pokemon: RunPokemon[];
  runId: string;
  currentRouteId: string;
  onEncounterComplete: () => void;
  onRouteChange: (routeId: string) => void;
}

export function RouteList({
  routes,
  encounters,
  runEncounters,
  pokemon,
  runId,
  currentRouteId,
  onEncounterComplete,
  onRouteChange,
}: RouteListProps) {
  const [encounterDialogRoute, setEncounterDialogRoute] = useState<RouteData | null>(null);
  const [encounterDialogPokemon, setEncounterDialogPokemon] = useState<EncounterEntry[]>([]);

  const sortedRoutes = [...routes].sort((a, b) => a.order - b.order);
  const encounterMap = new Map(runEncounters.map((e) => [e.route_id, e]));
  const partySize = pokemon.filter((p) => p.status === "alive").length;

  function getRouteStatus(route: RouteData) {
    const enc = encounterMap.get(route.id);
    if (!enc) return "unvisited";
    return enc.outcome;
  }

  function handleLogEncounter(route: RouteData) {
    const available = getRouteEncounters(encounters, route.id);
    setEncounterDialogPokemon(available);
    setEncounterDialogRoute(route);
    onRouteChange(route.id);
  }

  function getCaughtPokemonName(routeId: string): string | null {
    const enc = encounterMap.get(routeId);
    if (!enc || enc.outcome !== "caught" || !enc.pokemon_id) return null;
    const poke = pokemon.find(
      (p) => p.pokemon_id === enc.pokemon_id && p.caught_at_route_id === routeId,
    );
    if (poke) return poke.nickname;
    return getPokemonName(enc.pokemon_id);
  }

  function getCaughtPokemonId(routeId: string): number | null {
    const enc = encounterMap.get(routeId);
    if (!enc || enc.outcome !== "caught" || !enc.pokemon_id) return null;
    return enc.pokemon_id;
  }

  function getFaintedOnRoute(routeId: string): RunPokemon | null {
    return pokemon.find((p) => p.death_route_id === routeId && p.status === "fainted") ?? null;
  }

  return (
    <>
      <div className="space-y-1.5">
        {sortedRoutes.map((route) => {
          const status = getRouteStatus(route);
          const isCurrent = route.id === currentRouteId;
          const caughtName = getCaughtPokemonName(route.id);
          const caughtId = getCaughtPokemonId(route.id);
          const faintedPoke = getFaintedOnRoute(route.id);
          const available = getRouteEncounters(encounters, route.id);
          const hasEncounters = available.length > 0;

          return (
            <div
              key={route.id}
              className={`animate-route-enter rounded-lg border px-4 py-3 transition-colors ${
                isCurrent
                  ? "border-accent/50 bg-surface-overlay"
                  : status !== "unvisited"
                    ? "border-text-muted/10 bg-surface-raised/50"
                    : "border-text-muted/20 bg-surface-raised"
              }`}
              style={{
                animationDelay: `${Math.min(route.order * 30, 300)}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Route info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-display text-sm font-semibold ${
                        isCurrent
                          ? "text-accent"
                          : status !== "unvisited"
                            ? "text-text-muted"
                            : "text-text-primary"
                      }`}
                    >
                      {route.name}
                    </span>
                    {isCurrent && (
                      <Badge variant="default" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                    {faintedPoke && (
                      <Badge variant="fainted" className="text-[10px]">
                        RIP {faintedPoke.nickname}
                      </Badge>
                    )}
                  </div>

                  {/* Encounter status */}
                  <div className="mt-1 text-xs">
                    {status === "unvisited" && <span className="text-text-muted">Not visited</span>}
                    {status === "caught" && caughtName && (
                      <span className="inline-flex items-center gap-1 text-state-alive">
                        {caughtId && (
                          <PokemonSprite pokemonId={caughtId} name={caughtName} size="sm" />
                        )}
                        Caught: {caughtName}
                      </span>
                    )}
                    {status === "fainted" && (
                      <span className="text-state-death">Encounter fainted</span>
                    )}
                    {status === "fled" && <span className="text-text-muted">Encounter fled</span>}
                    {status === "duplicate_skipped" && (
                      <span className="text-text-muted">Skipped (duplicate)</span>
                    )}
                    {status === "none" && <span className="text-text-muted">No encounter</span>}
                  </div>

                  {/* Available pokemon (shown for unvisited routes) */}
                  {status === "unvisited" && hasEncounters && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {available.slice(0, 6).map((entry) => (
                        <span
                          key={entry.pokemon_id}
                          className="inline-flex items-center gap-1 rounded bg-surface-overlay/50 px-1.5 py-0.5 text-[10px] text-text-muted"
                        >
                          {getPokemonName(entry.pokemon_id)}
                        </span>
                      ))}
                      {available.length > 6 && (
                        <span className="text-[10px] text-text-muted">
                          +{available.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action */}
                {status === "unvisited" && hasEncounters && (
                  <Button
                    size="sm"
                    variant={isCurrent ? "default" : "outline"}
                    onClick={() => handleLogEncounter(route)}
                    className="shrink-0"
                  >
                    Log
                  </Button>
                )}
                {status === "unvisited" && !hasEncounters && (
                  <span className="text-[10px] text-text-muted">No wild</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Encounter dialog */}
      {encounterDialogRoute && (
        <EncounterDialog
          open={!!encounterDialogRoute}
          onOpenChange={(open) => {
            if (!open) setEncounterDialogRoute(null);
          }}
          routeId={encounterDialogRoute.id}
          routeName={encounterDialogRoute.name}
          runId={runId}
          availablePokemon={encounterDialogPokemon}
          partySize={partySize}
          onComplete={onEncounterComplete}
        />
      )}
    </>
  );
}
