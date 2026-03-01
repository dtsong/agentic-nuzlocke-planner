/**
 * Game data loading utilities.
 *
 * Merges base (FireRed) encounters with version-specific overrides for LeafGreen.
 */

import fireRedBosses from "@/data/games/fire-red/bosses.json";
import fireRedEncounters from "@/data/games/fire-red/encounters.json";
import fireRedMeta from "@/data/games/fire-red/meta.json";
import fireRedRoutes from "@/data/games/fire-red/routes.json";
import fireRedTierList from "@/data/games/fire-red/tier-list.json";
import leafGreenEncounters from "@/data/games/leaf-green/encounters.json";
import leafGreenMeta from "@/data/games/leaf-green/meta.json";

export type GameId = "fire-red" | "leaf-green";

export interface EncounterEntry {
  pokemon_id: number;
  name: string;
  min_level: number;
  max_level: number;
  rate: number;
}

export interface RouteEncounterData {
  route_id: string;
  methods: Record<string, EncounterEntry[]>;
}

export interface RouteData {
  id: string;
  name: string;
  order: number;
  type: string;
  parent_location?: string;
}

export interface TradeEncounterEntry extends EncounterEntry {
  requires_pokemon_id: number;
  requires_pokemon_name: string;
}

export interface PurchaseEncounterEntry extends EncounterEntry {
  cost: string;
}

export interface BossEntry {
  id: string;
  name: string;
  type: string;
  location: string;
  pokemon: Array<{
    pokemon_id: number;
    name: string;
    level: number;
    types: string[];
    moves: string[];
    ability: string;
  }>;
  badge?: string;
  badge_number?: number;
  specialty_type?: string;
}

export interface GameMeta {
  game_id: string;
  display_name: string;
  generation: number;
  region: string;
  version_group: string;
}

export interface TierList {
  game_id: string;
  tiers: Record<string, number[]>;
}

export interface GameData {
  meta: GameMeta;
  routes: RouteData[];
  encounters: RouteEncounterData[];
  bosses: BossEntry[];
  tierList: TierList;
}

/**
 * Load and merge game data for the given game ID.
 *
 * For LeafGreen, encounters are merged: LG overrides replace FR encounter
 * data on a per-route basis, while non-overridden routes keep FR data.
 */
export function getGameData(gameId: GameId): GameData {
  const routes = fireRedRoutes as RouteData[];
  const bosses = fireRedBosses as unknown as BossEntry[];
  const tierList = fireRedTierList as TierList;

  if (gameId === "leaf-green") {
    const baseEncounters = fireRedEncounters as unknown as RouteEncounterData[];
    const overrides = leafGreenEncounters as unknown as RouteEncounterData[];
    const overrideMap = new Map(overrides.map((o) => [o.route_id, o]));

    const mergedEncounters = baseEncounters.map((base) => {
      const override = overrideMap.get(base.route_id);
      if (!override) return base;

      // Merge methods: override replaces matching methods, keeps others
      const mergedMethods = { ...base.methods };
      for (const [method, entries] of Object.entries(override.methods)) {
        mergedMethods[method] = entries;
      }
      return { ...base, methods: mergedMethods };
    });

    return {
      meta: leafGreenMeta as GameMeta,
      routes,
      encounters: mergedEncounters,
      bosses,
      tierList,
    };
  }

  return {
    meta: fireRedMeta as GameMeta,
    routes,
    encounters: fireRedEncounters as unknown as RouteEncounterData[],
    bosses,
    tierList,
  };
}

/**
 * Get all encounter entries for a specific route, flattened across methods.
 */
export function getRouteEncounters(
  encounters: RouteEncounterData[],
  routeId: string,
): EncounterEntry[] {
  const routeData = encounters.find((e) => e.route_id === routeId);
  if (!routeData) return [];

  const seen = new Set<number>();
  const result: EncounterEntry[] = [];

  for (const entries of Object.values(routeData.methods)) {
    for (const entry of entries) {
      if (!seen.has(entry.pokemon_id)) {
        seen.add(entry.pokemon_id);
        result.push(entry);
      }
    }
  }

  return result;
}

/**
 * Get the encounter area key for a route (respects parent_location grouping).
 */
export function getEncounterAreaId(route: RouteData): string {
  return route.parent_location ?? route.id;
}

/**
 * Get all routes that share an encounter area.
 */
export function getRoutesInArea(routes: RouteData[], areaId: string): RouteData[] {
  return routes.filter((r) => getEncounterAreaId(r) === areaId);
}

/**
 * Get combined encounters for an area (merges all floors), deduplicated by pokemon_id.
 */
export function getAreaEncounters(
  encounters: RouteEncounterData[],
  routes: RouteData[],
  areaId: string,
): EncounterEntry[] {
  const areaRoutes = getRoutesInArea(routes, areaId);
  const seen = new Set<number>();
  const result: EncounterEntry[] = [];

  for (const route of areaRoutes) {
    const routeEncounters = encounters.find((e) => e.route_id === route.id);
    if (!routeEncounters) continue;

    for (const entries of Object.values(routeEncounters.methods)) {
      for (const entry of entries) {
        if (!seen.has(entry.pokemon_id)) {
          seen.add(entry.pokemon_id);
          result.push(entry);
        }
      }
    }
  }

  return result;
}
