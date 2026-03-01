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

export type PokemonType = (typeof POKEMON_TYPES)[number];

const effectivenessValue = z.union([z.literal(0), z.literal(0.5), z.literal(1), z.literal(2)]);

export const TypeChartSchema = z.object({
  types: z.array(z.enum(POKEMON_TYPES)).length(18),
  matrix: z.array(z.array(effectivenessValue).length(18)).length(18),
});

export type TypeChart = z.infer<typeof TypeChartSchema>;
