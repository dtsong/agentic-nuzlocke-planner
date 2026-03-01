import { z } from "zod";

export const GameMetaSchema = z.object({
  game_id: z.string().min(1),
  display_name: z.string().min(1),
  generation: z.number().int().positive(),
  region: z.string().min(1),
  version_group: z.string().min(1),
});

export type GameMeta = z.infer<typeof GameMetaSchema>;
