/**
 * Pokemon index lookup utilities.
 */

import pokemonIndex from "@/data/pokemon-index.json";

export interface PokemonEntry {
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

const index = pokemonIndex as Record<string, PokemonEntry>;

export function getPokemonById(id: number): PokemonEntry | null {
  return index[String(id)] ?? null;
}

export function getPokemonName(id: number): string {
  const entry = getPokemonById(id);
  if (!entry) return `Unknown (#${id})`;
  return entry.name.charAt(0).toUpperCase() + entry.name.slice(1);
}

export function getPokemonTypes(id: number): string[] {
  return getPokemonById(id)?.types ?? [];
}
