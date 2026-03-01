/**
 * Static game data schemas.
 * These types describe the curated data files in src/data/.
 */

export interface GameDefinition {
  id: string;
  name: string;
  generation: number;
  region: string;
  routes: RouteDefinition[];
  bosses: BossDefinition[];
}

export interface RouteDefinition {
  id: string;
  name: string;
  order: number;
  encounters: EncounterSlot[];
  level_cap?: number;
}

export interface EncounterSlot {
  pokemon_id: number;
  method: "walk" | "surf" | "fish" | "headbutt" | "rock_smash" | "gift" | "trade" | "static";
  rate: number;
  min_level: number;
  max_level: number;
}

export interface BossDefinition {
  id: string;
  name: string;
  route_id: string;
  type: "gym" | "rival" | "elite_four" | "champion" | "admin" | "boss";
  team: BossPokemon[];
}

export interface BossPokemon {
  pokemon_id: number;
  level: number;
  moves?: string[];
  item?: string;
  ability?: string;
}
