"use client";

import { useMemo } from "react";
import { TypeBadge } from "@/components/team-panel/type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import pokemonIndex from "@/data/pokemon-index.json";
import typeChartData from "@/data/type-chart.json";
import { analyzeCoverageLoss, suggestReplacements } from "@/domain/coverage-analyzer/gap-detector";
import type { TypeChart } from "@/domain/type-effectiveness";
import { getGameData } from "@/lib/game-data";

const typeChart = typeChartData as TypeChart;

interface RecoveryPanelProps {
  faintedPokemon: { types: string[] };
  remainingTeam: Array<{ types: string[] }>;
  currentRouteOrder: number;
  gameId: "fire-red" | "leaf-green";
  completedRouteIds: string[];
}

const TIER_COLORS: Record<string, string> = {
  S: "#D4A843",
  A: "#5A8A5A",
  B: "#6890F0",
  C: "#8A8070",
  F: "#705848",
};

export function RecoveryPanel({
  faintedPokemon,
  remainingTeam,
  currentRouteOrder,
  gameId,
  completedRouteIds,
}: RecoveryPanelProps) {
  const analysis = useMemo(() => {
    const lostCoverage = analyzeCoverageLoss(faintedPokemon, remainingTeam, typeChart);

    const gameData = getGameData(gameId);
    const routes = gameData.routes.map((r) => ({
      id: r.id,
      name: r.name,
      order: r.order,
    }));

    const suggestions = suggestReplacements(
      lostCoverage,
      currentRouteOrder,
      routes,
      gameData.encounters,
      completedRouteIds,
      pokemonIndex as Record<
        string,
        {
          name: string;
          types: string[];
          base_stats: {
            hp: number;
            attack: number;
            defense: number;
            sp_attack: number;
            sp_defense: number;
            speed: number;
          };
        }
      >,
      gameData.tierList,
      typeChart,
    );

    return { lostCoverage, suggestions: suggestions.slice(0, 8) };
  }, [faintedPokemon, remainingTeam, currentRouteOrder, gameId, completedRouteIds]);

  const { lostCoverage, suggestions } = analysis;
  const hasLoss = lostCoverage.lost_offensive.length > 0 || lostCoverage.lost_defensive.length > 0;

  if (!hasLoss) {
    return (
      <div className="rounded-lg border border-state-alive/30 bg-state-alive/5 px-4 py-3">
        <p className="font-mono text-xs text-state-alive">
          No unique type coverage was lost. Remaining team covers the same matchups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Coverage Lost */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm">Coverage Lost</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {lostCoverage.lost_offensive.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                Offensive
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lostCoverage.lost_offensive.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>
            </div>
          )}
          {lostCoverage.lost_defensive.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                Defensive
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lostCoverage.lost_defensive.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replacement Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm">Recommended Replacements</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div
                  key={`${suggestion.pokemon_id}-${suggestion.route_id}`}
                  className="flex items-start gap-3 rounded-lg border border-text-muted/15 bg-surface px-3 py-2"
                >
                  {/* Tier badge */}
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold"
                    style={{
                      backgroundColor: `${TIER_COLORS[suggestion.tier] ?? "#705848"}25`,
                      color: TIER_COLORS[suggestion.tier] ?? "#705848",
                    }}
                  >
                    {suggestion.tier}
                  </span>

                  {/* Pokemon info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary capitalize truncate">
                        {suggestion.name}
                      </span>
                      <div className="flex gap-1">
                        {suggestion.types.map((t) => (
                          <TypeBadge key={t} type={t} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-text-muted truncate">
                        {suggestion.route_name}
                      </span>
                    </div>
                    {/* Gaps filled */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {suggestion.gaps_filled.map((gap) => (
                        <span
                          key={gap}
                          className="font-mono text-[9px] text-state-alive bg-state-alive/10 rounded px-1 py-0.5"
                        >
                          +{gap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Score */}
                  <span className="font-mono text-[10px] text-text-muted whitespace-nowrap mt-0.5">
                    {suggestion.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 && (
        <div className="rounded-lg border border-text-muted/15 bg-surface px-4 py-3">
          <p className="font-mono text-xs text-text-muted">
            No replacement candidates found on upcoming routes.
          </p>
        </div>
      )}
    </div>
  );
}
