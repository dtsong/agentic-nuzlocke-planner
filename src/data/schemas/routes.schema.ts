import { z } from "zod";

const ROUTE_TYPES = [
  "route",
  "cave",
  "water",
  "building",
  "safari",
  "gift",
  "trade",
  "static",
] as const;

export const RouteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().positive(),
  type: z.enum(ROUTE_TYPES),
});

export const RoutesSchema = z.array(RouteSchema).min(1);

export type Route = z.infer<typeof RouteSchema>;
export type Routes = z.infer<typeof RoutesSchema>;
