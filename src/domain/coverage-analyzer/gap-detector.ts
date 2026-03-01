/**
 * Coverage Gap Detector
 *
 * Analyzes what coverage is lost when a Pokemon faints and suggests replacements
 * from upcoming routes. Pure functions — no framework imports.
 */

import type { TypeChart } from "@/domain/type-effectiveness";
import { getDefensiveMatchups, getOffensiveMatchups } from "@/domain/type-effectiveness";

export interface PokemonIndexEntry {
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

export type PokemonIndex = Record<string, PokemonIndexEntry>;

export interface TierList {
  game_id: string;
  tiers: Record<string, number[]>;
}

export interface RouteInfo {
  id: string;
  name: string;
  order: number;
}

export interface EncounterEntry {
  route_id: string;
  methods: Record<
    string,
    Array<{
      pokemon_id: number;
      name: string;
      min_level: number;
      max_level: number;
      rate: number;
    }>
  >;
}

export interface ReplacementSuggestion {
  pokemon_id: number;
  name: string;
  types: string[];
  route_id: string;
  route_name: string;
  tier: string;
  gaps_filled: string[];
  score: number;
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
 * Analyze what offensive and defensive coverage was lost when a Pokemon faints.
 *
 * Lost offensive: types the fainted Pokemon hit super-effectively that NO remaining
 * team member can also hit super-effectively.
 *
 * Lost defensive: types the fainted Pokemon resisted that NO remaining team member
 * also resists.
 */
export function analyzeCoverageLoss(
  faintedPokemon: { types: string[] },
  remainingTeam: Array<{ types: string[] }>,
  typeChart: TypeChart,
): { lost_offensive: string[]; lost_defensive: string[] } {
  const faintedOff = getOffensiveMatchups(faintedPokemon.types, typeChart);
  const faintedDef = getDefensiveMatchups(faintedPokemon.types, typeChart);

  const lost_offensive: string[] = [];
  const lost_defensive: string[] = [];

  for (const type of typeChart.types) {
    // Check offensive: fainted Pokemon had super-effective (>= 2) against this type
    if (faintedOff[type] >= 2) {
      const coveredByOthers = remainingTeam.some((member) => {
        const off = getOffensiveMatchups(member.types, typeChart);
        return off[type] >= 2;
      });
      if (!coveredByOthers) {
        lost_offensive.push(type);
      }
    }

    // Check defensive: fainted Pokemon resisted (< 1) this type
    if (faintedDef[type] < 1) {
      const resistedByOthers = remainingTeam.some((member) => {
        const def = getDefensiveMatchups(member.types, typeChart);
        return def[type] < 1;
      });
      if (!resistedByOthers) {
        lost_defensive.push(type);
      }
    }
  }

  return { lost_offensive, lost_defensive };
}

/**
 * Suggest replacement Pokemon from available (unvisited) routes that fill
 * the coverage gaps left by a fainted Pokemon.
 *
 * Scoring: tier_weight * 2 + gaps_filled_count * 3 + proximity_bonus
 * Proximity bonus: routes closer to currentRouteOrder score higher.
 */
export function suggestReplacements(
  lostCoverage: { lost_offensive: string[]; lost_defensive: string[] },
  currentRouteOrder: number,
  routes: RouteInfo[],
  encounters: EncounterEntry[],
  completedRouteIds: string[],
  pokemonIndex: PokemonIndex,
  tierList: TierList,
  typeChart: TypeChart,
): ReplacementSuggestion[] {
  const suggestions: ReplacementSuggestion[] = [];
  const seenPokemon = new Set<number>();

  // Only consider routes not yet completed and at or after current position
  const availableRoutes = routes.filter(
    (r) => !completedRouteIds.includes(r.id) && r.order >= currentRouteOrder,
  );

  const maxOrder = Math.max(...routes.map((r) => r.order), 1);

  for (const route of availableRoutes) {
    const encounterData = encounters.find((e) => e.route_id === route.id);
    if (!encounterData) continue;

    for (const method of Object.values(encounterData.methods)) {
      for (const encounter of method) {
        if (seenPokemon.has(encounter.pokemon_id)) continue;
        seenPokemon.add(encounter.pokemon_id);

        const pokemon = pokemonIndex[String(encounter.pokemon_id)];
        if (!pokemon) continue;

        const off = getOffensiveMatchups(pokemon.types, typeChart);
        const def = getDefensiveMatchups(pokemon.types, typeChart);

        const gapsFilled: string[] = [];

        for (const type of lostCoverage.lost_offensive) {
          if (off[type] >= 2) gapsFilled.push(type);
        }
        for (const type of lostCoverage.lost_defensive) {
          if (def[type] < 1) gapsFilled.push(type);
        }

        if (gapsFilled.length === 0) continue;

        const tier = getTier(encounter.pokemon_id, tierList);
        const tierWeight = TIER_WEIGHTS[tier] ?? 1;
        const proximityBonus = Math.max(
          0,
          (maxOrder - (route.order - currentRouteOrder)) / maxOrder,
        );

        const score = tierWeight * 2 + gapsFilled.length * 3 + proximityBonus;

        suggestions.push({
          pokemon_id: encounter.pokemon_id,
          name: pokemon.name,
          types: pokemon.types,
          route_id: route.id,
          route_name: route.name,
          tier,
          gaps_filled: gapsFilled,
          score,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.score - a.score);
}
