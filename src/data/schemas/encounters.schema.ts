import { z } from "zod";

export const EncounterEntrySchema = z.object({
  pokemon_id: z.number().int().positive().max(151),
  name: z.string().min(1),
  min_level: z.number().int().positive().max(100),
  max_level: z.number().int().positive().max(100),
  rate: z.number().min(0).max(100),
});

export const TradeEncounterEntrySchema = EncounterEntrySchema.extend({
  requires_pokemon_id: z.number().int().positive().max(151),
  requires_pokemon_name: z.string().min(1),
});

export const PurchaseEncounterEntrySchema = EncounterEntrySchema.extend({
  cost: z.string().min(1),
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
  trade: z.array(TradeEncounterEntrySchema).optional(),
  purchase: z.array(PurchaseEncounterEntrySchema).optional(),
});

export const RouteEncounterSchema = z.object({
  route_id: z.string().min(1),
  methods: EncounterMethodsSchema,
});

export const EncountersSchema = z.array(RouteEncounterSchema).min(1);

export type EncounterEntry = z.infer<typeof EncounterEntrySchema>;
export type RouteEncounter = z.infer<typeof RouteEncounterSchema>;
export type TradeEncounterEntry = z.infer<typeof TradeEncounterEntrySchema>;
export type PurchaseEncounterEntry = z.infer<typeof PurchaseEncounterEntrySchema>;
export type Encounters = z.infer<typeof EncountersSchema>;
