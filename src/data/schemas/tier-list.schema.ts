import { z } from "zod";

const TIER_RANKS = ["S", "A", "B", "C", "F"] as const;

export const TierListSchema = z.object({
  game_id: z.string().min(1),
  tiers: z.object({
    S: z.array(z.number().int().positive().max(151)),
    A: z.array(z.number().int().positive().max(151)),
    B: z.array(z.number().int().positive().max(151)),
    C: z.array(z.number().int().positive().max(151)),
    F: z.array(z.number().int().positive().max(151)),
  }),
});

export type TierRank = (typeof TIER_RANKS)[number];
export type TierList = z.infer<typeof TierListSchema>;
