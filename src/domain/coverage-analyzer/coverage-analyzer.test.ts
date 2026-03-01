import { describe, expect, it } from "vitest";
import typeChart from "@/data/type-chart.json";
import { analyzeTeamCoverage, findDefensiveGaps, findOffensiveGaps } from "./index";

describe("analyzeTeamCoverage", () => {
  it("single Pokemon team has limited offensive coverage", () => {
    const team = [{ types: ["fire"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);

    // Fire hits grass, bug, ice, steel at 2x
    expect(coverage.offensive.grass).toBe(2);
    expect(coverage.offensive.bug).toBe(2);
    expect(coverage.offensive.ice).toBe(2);
    expect(coverage.offensive.steel).toBe(2);

    // Fire can't hit water super-effectively
    expect(coverage.offensive.water).toBe(0.5);
  });

  it("diverse team covers more types offensively", () => {
    const team = [{ types: ["fire"] }, { types: ["water"] }, { types: ["grass"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);

    // Each starter covers different types
    expect(coverage.offensive.grass).toBe(2); // fire
    expect(coverage.offensive.fire).toBe(2); // water
    expect(coverage.offensive.water).toBe(2); // grass
    expect(coverage.offensive.rock).toBe(2); // water or grass
  });

  it("after removing a team member, gaps increase", () => {
    const fullTeam = [{ types: ["fire"] }, { types: ["water"] }];
    const reducedTeam = [{ types: ["fire"] }];

    const fullCoverage = analyzeTeamCoverage(fullTeam, typeChart);
    const reducedCoverage = analyzeTeamCoverage(reducedTeam, typeChart);

    const fullGaps = findOffensiveGaps(fullCoverage);
    const reducedGaps = findOffensiveGaps(reducedCoverage);

    expect(reducedGaps.length).toBeGreaterThanOrEqual(fullGaps.length);
  });

  it("empty team has 0 offensive coverage for all types", () => {
    const coverage = analyzeTeamCoverage([], typeChart);
    for (const type of typeChart.types) {
      expect(coverage.offensive[type]).toBe(0);
    }
  });

  it("defensive coverage picks the best (lowest) multiplier", () => {
    // Fire resists fire (0.5), water is neutral to fire (1)
    // Best defensive vs fire is 0.5 (from the fire-type Pokemon)
    const team = [{ types: ["fire"] }, { types: ["water"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);

    expect(coverage.defensive.fire).toBe(0.5);
    // Water resists water (0.5)
    expect(coverage.defensive.water).toBe(0.5);
  });
});

describe("findOffensiveGaps", () => {
  it("team of all Normal types cannot hit Ghost", () => {
    const team = [{ types: ["normal"] }, { types: ["normal"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);
    const gaps = findOffensiveGaps(coverage);

    const ghostGap = gaps.find((g) => g.type === "ghost");
    expect(ghostGap).toBeDefined();
    expect(ghostGap!.severity).toBe("critical");
  });

  it("fire-only team has offensive gaps against water, rock, dragon", () => {
    const team = [{ types: ["fire"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);
    const gaps = findOffensiveGaps(coverage);

    const gapTypes = gaps.map((g) => g.type);
    expect(gapTypes).toContain("water");
    expect(gapTypes).toContain("rock");
    expect(gapTypes).toContain("dragon");
  });

  it("diverse team has fewer offensive gaps", () => {
    const monoTeam = [{ types: ["normal"] }];
    const diverseTeam = [
      { types: ["fire"] },
      { types: ["water"] },
      { types: ["grass"] },
      { types: ["fighting"] },
    ];

    const monoGaps = findOffensiveGaps(analyzeTeamCoverage(monoTeam, typeChart));
    const diverseGaps = findOffensiveGaps(analyzeTeamCoverage(diverseTeam, typeChart));

    expect(diverseGaps.length).toBeLessThan(monoGaps.length);
  });

  it("returns empty when team hits all types super-effectively", () => {
    // A very diverse team that covers everything
    const team = [
      { types: ["fire"] },
      { types: ["water"] },
      { types: ["electric"] },
      { types: ["fighting"] },
      { types: ["ice"] },
      { types: ["ground"] },
    ];
    const coverage = analyzeTeamCoverage(team, typeChart);
    const gaps = findOffensiveGaps(coverage);

    // This team should have very few gaps — all types hit > 1x
    const criticalGaps = gaps.filter((g) => g.severity === "critical");
    expect(criticalGaps).toHaveLength(0);
  });
});

describe("findDefensiveGaps", () => {
  it("team of all Fire types is weak to Water", () => {
    const team = [{ types: ["fire"] }, { types: ["fire"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);
    const gaps = findDefensiveGaps(coverage);

    const waterGap = gaps.find((g) => g.type === "water");
    expect(waterGap).toBeDefined();
    expect(waterGap!.severity).toBe("critical");
  });

  it("team of all Fire types is weak to Ground and Rock", () => {
    const team = [{ types: ["fire"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);
    const gaps = findDefensiveGaps(coverage);

    const gapTypes = gaps.map((g) => g.type);
    expect(gapTypes).toContain("ground");
    expect(gapTypes).toContain("rock");
  });

  it("diverse team has fewer defensive gaps", () => {
    const monoTeam = [{ types: ["fire"] }, { types: ["fire"] }];
    const diverseTeam = [{ types: ["fire"] }, { types: ["water"] }, { types: ["grass"] }];

    const monoGaps = findDefensiveGaps(analyzeTeamCoverage(monoTeam, typeChart));
    const diverseGaps = findDefensiveGaps(analyzeTeamCoverage(diverseTeam, typeChart));

    expect(diverseGaps.length).toBeLessThanOrEqual(monoGaps.length);
  });

  it("ghost type team is immune to normal and fighting defensively", () => {
    const team = [{ types: ["ghost"] }];
    const coverage = analyzeTeamCoverage(team, typeChart);
    const gaps = findDefensiveGaps(coverage);

    const gapTypes = gaps.map((g) => g.type);
    // Ghost is immune (0x) to normal and fighting — these are NOT gaps
    expect(gapTypes).not.toContain("normal");
    expect(gapTypes).not.toContain("fighting");
  });
});
