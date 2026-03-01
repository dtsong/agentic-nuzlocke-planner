import { z } from "zod";

const BOSS_TYPES = ["gym_leader", "rival", "elite_four", "champion", "admin", "boss"] as const;

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

export const BossPokemonSchema = z.object({
  pokemon_id: z.number().int().positive().max(151),
  name: z.string().min(1),
  level: z.number().int().positive().max(100),
  types: z.array(z.enum(POKEMON_TYPES)).min(1).max(2),
  moves: z.array(z.string().min(1)).optional(),
  ability: z.string().min(1).optional(),
});

export const BossSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(BOSS_TYPES),
  location: z.string().min(1),
  badge: z.string().min(1).optional(),
  badge_number: z.number().int().positive().max(8).optional(),
  specialty_type: z.enum(POKEMON_TYPES).optional(),
  pokemon: z.array(BossPokemonSchema).min(1),
});

export const BossesSchema = z.array(BossSchema).min(1);

export type BossPokemon = z.infer<typeof BossPokemonSchema>;
export type Boss = z.infer<typeof BossSchema>;
export type Bosses = z.infer<typeof BossesSchema>;
