export type PokemonStatus = "alive" | "fainted" | "boxed";

export interface Run {
  id: string;
  game_id: string;
  name: string;
  ruleset: NuzlockeRuleset;
  status: "active" | "completed" | "failed";
  current_route_id: string;
  created_at: string;
  updated_at: string;
}

export interface NuzlockeRuleset {
  dupes_clause: boolean;
  species_clause: boolean;
  shiny_clause: boolean;
  level_caps: boolean;
}

export interface RunPokemon {
  id: string;
  run_id: string;
  pokemon_id: number;
  nickname: string;
  caught_at_route_id: string;
  caught_level: number;
  current_level: number;
  status: PokemonStatus;
  death_route_id?: string;
  death_cause?: string;
  slot_order?: number;
}

export interface RunEncounter {
  id: string;
  run_id: string;
  route_id: string;
  pokemon_id?: number;
  outcome: "caught" | "fainted" | "fled" | "duplicate_skipped" | "none";
}
