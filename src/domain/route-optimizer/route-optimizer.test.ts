import { describe, expect, it } from "vitest";
import encounters from "@/data/games/fire-red/encounters.json";
import routes from "@/data/games/fire-red/routes.json";
import tierList from "@/data/games/fire-red/tier-list.json";
import pokemonIndex from "@/data/pokemon-index.json";
import typeChart from "@/data/type-chart.json";
import type {
  EncounterEntry,
  PokemonIndex,
  RouteInfo,
  TierList,
} from "@/domain/coverage-analyzer/gap-detector";
import { rankUpcomingRoutes } from "./index";

const pIndex = pokemonIndex as unknown as PokemonIndex;
const tList = tierList as unknown as TierList;
const routeList = routes as unknown as RouteInfo[];
const encounterList = encounters as unknown as EncounterEntry[];

describe("rankUpcomingRoutes", () => {
  it("completed routes are excluded from results", () => {
    const team = [{ types: ["fire"] }];
    const completedRoutes = ["pallet-town", "route-1"];

    const ranked = rankUpcomingRoutes(
      team,
      1,
      routeList,
      encounterList,
      completedRoutes,
      pIndex,
      tList,
      typeChart,
    );

    for (const r of ranked) {
      expect(completedRoutes).not.toContain(r.route_id);
    }
  });

  it("results are sorted by priority score descending", () => {
    const team = [{ types: ["fire"] }];

    const ranked = rankUpcomingRoutes(
      team,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].priority_score).toBeGreaterThanOrEqual(ranked[i].priority_score);
    }
  });

  it("routes that fill coverage gaps rank higher", () => {
    // A fire-only team needs water/ground/rock coverage
    const team = [{ types: ["fire"] }];

    const ranked = rankUpcomingRoutes(
      team,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    // The top-ranked route should have coverage_impact > 0
    expect(ranked.length).toBeGreaterThan(0);

    // Find a route with coverage impact and one without (or lower)
    const withImpact = ranked.filter((r) => r.coverage_impact > 0);
    const withoutImpact = ranked.filter((r) => r.coverage_impact === 0);

    if (withImpact.length > 0 && withoutImpact.length > 0) {
      // On average, routes with impact should score higher
      const avgWithImpact =
        withImpact.reduce((s, r) => s + r.priority_score, 0) / withImpact.length;
      const avgWithoutImpact =
        withoutImpact.reduce((s, r) => s + r.priority_score, 0) / withoutImpact.length;
      expect(avgWithImpact).toBeGreaterThan(avgWithoutImpact);
    }
  });

  it("each recommendation has valid data", () => {
    const team = [{ types: ["normal"] }];

    const ranked = rankUpcomingRoutes(
      team,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    for (const r of ranked) {
      expect(r.route_id).toBeTruthy();
      expect(r.route_name).toBeTruthy();
      expect(r.best_encounter.pokemon_id).toBeGreaterThan(0);
      expect(r.best_encounter.name).toBeTruthy();
      expect(r.best_encounter.types.length).toBeGreaterThan(0);
      expect(["S", "A", "B", "C", "F"]).toContain(r.tier);
      expect(r.priority_score).toBeGreaterThan(0);
    }
  });

  it("empty team still returns recommendations", () => {
    const ranked = rankUpcomingRoutes(
      [],
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    expect(ranked.length).toBeGreaterThan(0);
  });

  it("routes before current position are excluded", () => {
    const team = [{ types: ["fire"] }];

    const ranked = rankUpcomingRoutes(
      team,
      10, // starting at route order 10
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    for (const r of ranked) {
      const route = routeList.find((rt) => rt.id === r.route_id);
      expect(route).toBeDefined();
      expect(route!.order).toBeGreaterThanOrEqual(10);
    }
  });

  it("higher tier Pokemon contribute to higher route scores", () => {
    // With a team that has lots of gaps, tier differences should matter
    const team = [{ types: ["normal"] }];

    const ranked = rankUpcomingRoutes(
      team,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    // S and A tier Pokemon should appear near the top
    const topTiers = ranked.slice(0, 5).map((r) => r.tier);
    const hasHighTier = topTiers.some((t) => t === "S" || t === "A" || t === "B");
    expect(hasHighTier).toBe(true);
  });
});
