"use client";

import { useState } from "react";
import { EncounterDialog } from "@/components/encounter-log/encounter-dialog";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EncounterEntry, RouteData, RouteEncounterData } from "@/lib/game-data";
import { getAreaEncounters, getEncounterAreaId, getRouteEncounters } from "@/lib/game-data";
import { getPokemonName } from "@/lib/pokemon";
import type { NuzlockeRuleset, RunEncounter, RunPokemon } from "@/types/domain";

interface RouteListProps {
  routes: RouteData[];
  encounters: RouteEncounterData[];
  runEncounters: RunEncounter[];
  pokemon: RunPokemon[];
  runId: string;
  currentRouteId: string;
  ruleset: NuzlockeRuleset;
  onEncounterComplete: () => void;
  onRouteChange: (routeId: string) => void;
}

interface RouteGroup {
  areaId: string;
  displayName: string;
  routes: RouteData[];
  isGrouped: boolean;
}

function buildRouteGroups(routes: RouteData[], cavePerFloor: boolean): RouteGroup[] {
  const sorted = [...routes].sort((a, b) => a.order - b.order);
  const groups: RouteGroup[] = [];
  const seen = new Set<string>();

  for (const route of sorted) {
    const areaId = cavePerFloor ? route.id : getEncounterAreaId(route);
    if (seen.has(areaId)) continue;
    seen.add(areaId);

    if (!cavePerFloor && route.parent_location) {
      const areaRoutes = sorted.filter((r) => getEncounterAreaId(r) === areaId);
      const parentName = route.parent_location
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      groups.push({ areaId, displayName: parentName, routes: areaRoutes, isGrouped: true });
    } else {
      groups.push({ areaId, displayName: route.name, routes: [route], isGrouped: false });
    }
  }

  return groups;
}

export function RouteList({
  routes,
  encounters,
  runEncounters,
  pokemon,
  runId,
  currentRouteId,
  ruleset,
  onEncounterComplete,
  onRouteChange,
}: RouteListProps) {
  const [encounterDialogRoute, setEncounterDialogRoute] = useState<RouteData | null>(null);
  const [encounterDialogAreaId, setEncounterDialogAreaId] = useState<string | null>(null);
  const [encounterDialogPokemon, setEncounterDialogPokemon] = useState<EncounterEntry[]>([]);

  const groups = buildRouteGroups(routes, ruleset.cave_per_floor);
  const encounterMap = new Map(runEncounters.map((e) => [e.route_id, e]));
  const partySize = pokemon.filter((p) => p.status === "alive").length;

  function getAreaStatus(areaId: string) {
    const enc = encounterMap.get(areaId);
    if (!enc) return "unvisited";
    return enc.outcome;
  }

  function handleLogEncounter(group: RouteGroup) {
    const firstRoute = group.routes[0];
    const available = group.isGrouped
      ? getAreaEncounters(encounters, routes, group.areaId)
      : getRouteEncounters(encounters, firstRoute.id);
    setEncounterDialogPokemon(available);
    setEncounterDialogRoute(firstRoute);
    setEncounterDialogAreaId(group.areaId);
    onRouteChange(firstRoute.id);
  }

  function getCaughtPokemonName(areaId: string): string | null {
    const enc = encounterMap.get(areaId);
    if (!enc || enc.outcome !== "caught" || !enc.pokemon_id) return null;
    const poke = pokemon.find(
      (p) => p.pokemon_id === enc.pokemon_id && p.caught_at_route_id === enc.route_id,
    );
    if (poke) return poke.nickname;
    return getPokemonName(enc.pokemon_id);
  }

  function getCaughtPokemonId(areaId: string): number | null {
    const enc = encounterMap.get(areaId);
    if (!enc || enc.outcome !== "caught" || !enc.pokemon_id) return null;
    return enc.pokemon_id;
  }

  function getFaintedOnRoute(routeId: string): RunPokemon | null {
    return pokemon.find((p) => p.death_route_id === routeId && p.status === "fainted") ?? null;
  }

  function getEncounterMethodsForRoute(routeId: string): Record<string, EncounterEntry[]> {
    const routeData = encounters.find((e) => e.route_id === routeId);
    return routeData?.methods ?? {};
  }

  return (
    <>
      <div className="space-y-1.5">
        {groups.map((group) => {
          const status = getAreaStatus(group.areaId);
          const firstRoute = group.routes[0];
          const isCurrent = group.routes.some((r) => r.id === currentRouteId);
          const caughtName = getCaughtPokemonName(group.areaId);
          const caughtId = getCaughtPokemonId(group.areaId);
          const faintedPoke = group.routes
            .map((r) => getFaintedOnRoute(r.id))
            .find((p) => p !== null) ?? null;

          const available = group.isGrouped
            ? getAreaEncounters(encounters, routes, group.areaId)
            : getRouteEncounters(encounters, firstRoute.id);
          const hasEncounters = available.length > 0;

          const methods = getEncounterMethodsForRoute(firstRoute.id);
          const hasTrades = "trade" in methods;
          const hasPurchases = "purchase" in methods;

          return (
            <div
              key={group.areaId}
              className={`animate-route-enter rounded-lg border px-4 py-3 transition-colors ${
                isCurrent
                  ? "border-accent/50 bg-surface-overlay"
                  : status !== "unvisited"
                    ? "border-text-muted/10 bg-surface-raised/50"
                    : "border-text-muted/20 bg-surface-raised"
              }`}
              style={{
                animationDelay: `${Math.min(firstRoute.order * 30, 300)}ms`,
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
                      {group.displayName}
                    </span>
                    {group.isGrouped && (
                      <span className="text-[10px] text-text-muted">
                        ({group.routes.length} floors)
                      </span>
                    )}
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
                    {hasTrades && (
                      <Badge variant="outline" className="text-[10px]">
                        Trade
                      </Badge>
                    )}
                    {hasPurchases && (
                      <Badge variant="outline" className="text-[10px]">
                        Purchase
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
                    onClick={() => handleLogEncounter(group)}
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
      {encounterDialogRoute && encounterDialogAreaId && (
        <EncounterDialog
          open={!!encounterDialogRoute}
          onOpenChange={(open) => {
            if (!open) {
              setEncounterDialogRoute(null);
              setEncounterDialogAreaId(null);
            }
          }}
          routeId={encounterDialogAreaId}
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
