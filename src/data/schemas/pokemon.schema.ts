import { z } from "zod";

const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export const BaseStatsSchema = z.object({
  hp: z.number().int().nonnegative(),
  attack: z.number().int().nonnegative(),
  defense: z.number().int().nonnegative(),
  sp_attack: z.number().int().nonnegative(),
  sp_defense: z.number().int().nonnegative(),
  speed: z.number().int().nonnegative(),
});

export const PokemonEntrySchema = z.object({
  name: z.string().min(1),
  types: z.array(z.enum(POKEMON_TYPES)).min(1).max(2),
  base_stats: BaseStatsSchema,
});

export const PokemonIndexSchema = z.record(z.string(), PokemonEntrySchema);

export type BaseStats = z.infer<typeof BaseStatsSchema>;
export type PokemonEntry = z.infer<typeof PokemonEntrySchema>;
export type PokemonIndex = z.infer<typeof PokemonIndexSchema>;
