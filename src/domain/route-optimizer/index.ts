/**
 * Route Optimizer
 *
 * Ranks upcoming routes by catch priority based on team coverage gaps,
 * Pokemon tiers, and route proximity. Pure functions — no framework imports.
 */

import { analyzeTeamCoverage, findOffensiveGaps } from "@/domain/coverage-analyzer";
import type {
  EncounterEntry,
  PokemonIndex,
  RouteInfo,
  TierList,
} from "@/domain/coverage-analyzer/gap-detector";
import type { TypeChart } from "@/domain/type-effectiveness";
import { getOffensiveMatchups } from "@/domain/type-effectiveness";

export interface RouteRecommendation {
  route_id: string;
  route_name: string;
  best_encounter: { pokemon_id: number; name: string; types: string[] };
  tier: string;
  coverage_impact: number;
  priority_score: number;
}

const TIER_WEIGHTS: Record<string, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  F: 1,
};

function getTier(pokemonId: number, tierList: TierList): string {
  for (const [tier, ids] of Object.entries(tierList.tiers)) {
    if (ids.includes(pokemonId)) return tier;
  }
  return "F";
}

/**
 * Rank upcoming routes by catch priority for the current team.
 *
 * For each available route, evaluates every encounter and picks the best one.
 * Score = tier_weight * 2 + coverage_impact * 3 + proximity_bonus
 */
export function rankUpcomingRoutes(
  team: Array<{ types: string[] }>,
  currentRouteOrder: number,
  routes: RouteInfo[],
  encounters: EncounterEntry[],
  completedRouteIds: string[],
  pokemonIndex: PokemonIndex,
  tierList: TierList,
  typeChart: TypeChart,
): RouteRecommendation[] {
  const coverage = analyzeTeamCoverage(team, typeChart);
  const offensiveGaps = findOffensiveGaps(coverage);
  const gapTypes = new Set(offensiveGaps.map((g) => g.type));

  const availableRoutes = routes.filter(
    (r) => !completedRouteIds.includes(r.id) && r.order >= currentRouteOrder,
  );

  const maxOrder = Math.max(...routes.map((r) => r.order), 1);
  const recommendations: RouteRecommendation[] = [];

  for (const route of availableRoutes) {
    const encounterData = encounters.find((e) => e.route_id === route.id);
    if (!encounterData) continue;

    let bestEncounter: RouteRecommendation | null = null;

    for (const method of Object.values(encounterData.methods)) {
      for (const encounter of method) {
        const pokemon = pokemonIndex[String(encounter.pokemon_id)];
        if (!pokemon) continue;

        const off = getOffensiveMatchups(pokemon.types, typeChart);

        // Count how many team gaps this Pokemon fills
        let coverageImpact = 0;
        for (const gapType of gapTypes) {
          if (off[gapType] >= 2) coverageImpact++;
        }

        const tier = getTier(encounter.pokemon_id, tierList);
        const tierWeight = TIER_WEIGHTS[tier] ?? 1;
        const proximityBonus = Math.max(
          0,
          (maxOrder - (route.order - currentRouteOrder)) / maxOrder,
        );

        const priorityScore = tierWeight * 2 + coverageImpact * 3 + proximityBonus;

        if (!bestEncounter || priorityScore > bestEncounter.priority_score) {
          bestEncounter = {
            route_id: route.id,
            route_name: route.name,
            best_encounter: {
              pokemon_id: encounter.pokemon_id,
              name: pokemon.name,
              types: pokemon.types,
            },
            tier,
            coverage_impact: coverageImpact,
            priority_score: priorityScore,
          };
        }
      }
    }

    if (bestEncounter) {
      recommendations.push(bestEncounter);
    }
  }

  return recommendations.sort((a, b) => b.priority_score - a.priority_score);
}
