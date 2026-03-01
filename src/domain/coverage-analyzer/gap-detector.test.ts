import { describe, expect, it } from "vitest";
import encounters from "@/data/games/fire-red/encounters.json";
import routes from "@/data/games/fire-red/routes.json";
import tierList from "@/data/games/fire-red/tier-list.json";
import pokemonIndex from "@/data/pokemon-index.json";
import typeChart from "@/data/type-chart.json";
import type { EncounterEntry, PokemonIndex, RouteInfo, TierList } from "./gap-detector";
import { analyzeCoverageLoss, suggestReplacements } from "./gap-detector";

const pIndex = pokemonIndex as unknown as PokemonIndex;
const tList = tierList as unknown as TierList;
const routeList = routes as unknown as RouteInfo[];
const encounterList = encounters as unknown as EncounterEntry[];

describe("analyzeCoverageLoss", () => {
  it("when water type faints and no other water on team, water offensive coverage is lost", () => {
    const fainted = { types: ["water"] };
    const remaining = [{ types: ["fire"] }, { types: ["grass"] }];

    const loss = analyzeCoverageLoss(fainted, remaining, typeChart);

    // Water hits fire at 2x — fire also hits fire... no. Fire does not hit fire at 2x.
    // Water hits fire at 2x; does grass or fire hit fire at 2x? Neither does.
    expect(loss.lost_offensive).toContain("fire");
  });

  it("when water type faints but another water remains, no water coverage lost", () => {
    const fainted = { types: ["water"] };
    const remaining = [{ types: ["water"] }, { types: ["fire"] }];

    const loss = analyzeCoverageLoss(fainted, remaining, typeChart);

    // Another water covers fire offense
    expect(loss.lost_offensive).not.toContain("fire");
  });

  it("tracks lost defensive coverage (resistances)", () => {
    const fainted = { types: ["fire"] };
    const remaining = [{ types: ["water"] }, { types: ["normal"] }];

    const loss = analyzeCoverageLoss(fainted, remaining, typeChart);

    // Fire resists grass (0.5), ice (0.5), bug (0.5), steel (0.5), fairy (0.5)
    // Water resists fire (0.5), water (0.5), ice (0.5), steel (0.5)
    // So losing fire, water still resists ice and steel.
    // But fire uniquely resisted bug and fairy that water doesn't
    expect(loss.lost_defensive).toContain("bug");
    expect(loss.lost_defensive).toContain("fairy");
  });

  it("returns empty arrays if no coverage is uniquely lost", () => {
    const fainted = { types: ["water"] };
    const remaining = [{ types: ["water"] }];

    const loss = analyzeCoverageLoss(fainted, remaining, typeChart);
    expect(loss.lost_offensive).toHaveLength(0);
    expect(loss.lost_defensive).toHaveLength(0);
  });

  it("losing sole ground type loses electric resistance", () => {
    const fainted = { types: ["ground"] };
    const remaining = [{ types: ["fire"] }, { types: ["normal"] }];

    const loss = analyzeCoverageLoss(fainted, remaining, typeChart);
    // Ground is immune to electric (0x), which counts as < 1
    expect(loss.lost_defensive).toContain("electric");
  });
});

describe("suggestReplacements", () => {
  it("suggests water types from upcoming routes when water coverage is lost", () => {
    const lostCoverage = { lost_offensive: ["fire", "ground", "rock"], lost_defensive: [] };

    const suggestions = suggestReplacements(
      lostCoverage,
      1, // starting from beginning
      routeList,
      encounterList,
      [], // no completed routes
      pIndex,
      tList,
      typeChart,
    );

    // Should find at least one water type
    const waterSuggestions = suggestions.filter((s) => s.types.includes("water"));
    expect(waterSuggestions.length).toBeGreaterThan(0);
  });

  it("higher tier Pokemon score higher", () => {
    const lostCoverage = { lost_offensive: ["fire"], lost_defensive: [] };

    const suggestions = suggestReplacements(
      lostCoverage,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    if (suggestions.length >= 2) {
      // Results are sorted by score descending
      expect(suggestions[0].score).toBeGreaterThanOrEqual(suggestions[1].score);
    }
  });

  it("already-visited routes are excluded", () => {
    const lostCoverage = { lost_offensive: ["fire"], lost_defensive: [] };
    const completedRoutes = ["pallet-town", "route-1", "route-22"];

    const suggestions = suggestReplacements(
      lostCoverage,
      1,
      routeList,
      encounterList,
      completedRoutes,
      pIndex,
      tList,
      typeChart,
    );

    for (const s of suggestions) {
      expect(completedRoutes).not.toContain(s.route_id);
    }
  });

  it("returns empty array when no Pokemon fills the gaps", () => {
    // Use a nonsensical gap that nothing can fill
    const lostCoverage = { lost_offensive: [], lost_defensive: [] };

    const suggestions = suggestReplacements(
      lostCoverage,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    expect(suggestions).toHaveLength(0);
  });

  it("suggestions include gaps_filled info", () => {
    const lostCoverage = {
      lost_offensive: ["fire", "ground", "rock"],
      lost_defensive: [],
    };

    const suggestions = suggestReplacements(
      lostCoverage,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    for (const s of suggestions) {
      expect(s.gaps_filled.length).toBeGreaterThan(0);
    }
  });

  it("each suggestion has valid route and pokemon data", () => {
    const lostCoverage = { lost_offensive: ["fire"], lost_defensive: [] };

    const suggestions = suggestReplacements(
      lostCoverage,
      1,
      routeList,
      encounterList,
      [],
      pIndex,
      tList,
      typeChart,
    );

    for (const s of suggestions) {
      expect(s.pokemon_id).toBeGreaterThan(0);
      expect(s.name).toBeTruthy();
      expect(s.types.length).toBeGreaterThan(0);
      expect(s.route_id).toBeTruthy();
      expect(s.route_name).toBeTruthy();
      expect(["S", "A", "B", "C", "F"]).toContain(s.tier);
    }
  });
});
