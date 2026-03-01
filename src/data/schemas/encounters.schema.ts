import { z } from "zod";

export const EncounterEntrySchema = z.object({
  pokemon_id: z.number().int().positive().max(151),
  name: z.string().min(1),
  min_level: z.number().int().positive().max(100),
  max_level: z.number().int().positive().max(100),
  rate: z.number().min(0).max(100),
});

const encounterList = z.array(EncounterEntrySchema);

export const EncounterMethodsSchema = z.object({
  walking: encounterList.optional(),
  surfing: encounterList.optional(),
  fishing_old: encounterList.optional(),
  fishing_good: encounterList.optional(),
  fishing_super: encounterList.optional(),
  gift: encounterList.optional(),
  static: encounterList.optional(),
});

export const RouteEncounterSchema = z.object({
  route_id: z.string().min(1),
  methods: EncounterMethodsSchema,
});

export const EncountersSchema = z.array(RouteEncounterSchema).min(1);

export type EncounterEntry = z.infer<typeof EncounterEntrySchema>;
export type RouteEncounter = z.infer<typeof RouteEncounterSchema>;
export type Encounters = z.infer<typeof EncountersSchema>;
