import { describe, expect, it } from "vitest";
import typeChart from "@/data/type-chart.json";
import type { BossDefinition, TeamMember } from "./index";
import { analyzeBossMatchup } from "./index";

const brock: BossDefinition = {
  id: "brock",
  name: "Brock",
  type: "gym_leader",
  location: "pewter-city-gym",
  pokemon: [
    {
      pokemon_id: 74,
      name: "geodude",
      level: 12,
      types: ["rock", "ground"],
      moves: ["tackle", "defense-curl"],
    },
    {
      pokemon_id: 95,
      name: "onix",
      level: 14,
      types: ["rock", "ground"],
      moves: ["tackle", "bind", "rock-tomb"],
    },
  ],
};

describe("analyzeBossMatchup", () => {
  it("water type vs Brock = favorable matchups", () => {
    const team: TeamMember[] = [{ pokemon_id: 7, name: "squirtle", types: ["water"] }];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    // Water vs rock/ground: water -> rock = 2, water -> ground = 2 => 4x
    // Rock/ground vs water: rock -> water = 1... actually let's check
    // Squirtle should have favorable matchups against both Geodude and Onix
    for (const matchup of analysis.matchups[0]) {
      expect(matchup.offensive_effectiveness).toBeGreaterThan(1);
      expect(matchup.verdict).toBe("favorable");
    }
  });

  it("normal type vs Brock = unfavorable (rock resists normal)", () => {
    const team: TeamMember[] = [{ pokemon_id: 19, name: "rattata", types: ["normal"] }];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    // Normal vs rock = 0.5x; rock/ground attacks normal at 1x
    for (const matchup of analysis.matchups[0]) {
      expect(matchup.offensive_effectiveness).toBeLessThan(1);
      expect(["unfavorable", "dangerous"]).toContain(matchup.verdict);
    }
  });

  it("recommended lead for Brock should be water or grass type", () => {
    const team: TeamMember[] = [
      { pokemon_id: 19, name: "rattata", types: ["normal"] },
      { pokemon_id: 7, name: "squirtle", types: ["water"] },
      { pokemon_id: 16, name: "pidgey", types: ["normal", "flying"] },
    ];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    expect(analysis.recommended_lead.name).toBe("squirtle");
  });

  it("identifies threats correctly", () => {
    const team: TeamMember[] = [
      { pokemon_id: 4, name: "charmander", types: ["fire"] },
      { pokemon_id: 16, name: "pidgey", types: ["normal", "flying"] },
    ];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    // Both Geodude and Onix have ground type which is SE against fire
    // and rock which is SE against flying
    const highThreats = analysis.threats.filter((t) => t.threat_level === "high");
    expect(highThreats.length).toBeGreaterThan(0);
  });

  it("coverage gaps identify boss types no team member resists", () => {
    const team: TeamMember[] = [{ pokemon_id: 4, name: "charmander", types: ["fire"] }];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    // Brock has rock and ground types
    // Fire resists rock? No — check chart: rock vs fire = 2. Fire does NOT resist rock.
    // Fire doesn't resist ground either (ground vs fire = 2)
    expect(analysis.coverage_gaps).toContain("rock");
    expect(analysis.coverage_gaps).toContain("ground");
  });

  it("grass type vs Brock is favorable", () => {
    const team: TeamMember[] = [{ pokemon_id: 1, name: "bulbasaur", types: ["grass", "poison"] }];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    // Grass vs rock/ground = 4x (2 * 2)
    for (const matchup of analysis.matchups[0]) {
      expect(matchup.offensive_effectiveness).toBe(4);
    }
  });

  it("returns correct matrix dimensions", () => {
    const team: TeamMember[] = [
      { pokemon_id: 7, name: "squirtle", types: ["water"] },
      { pokemon_id: 1, name: "bulbasaur", types: ["grass", "poison"] },
    ];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    expect(analysis.matchups).toHaveLength(2); // 2 team members
    expect(analysis.matchups[0]).toHaveLength(2); // 2 boss Pokemon
    expect(analysis.matchups[1]).toHaveLength(2);
  });

  it("handles empty team gracefully", () => {
    const analysis = analyzeBossMatchup([], brock, typeChart);
    expect(analysis.matchups).toHaveLength(0);
    expect(analysis.recommended_lead.pokemon_id).toBe(0);
  });

  it("fighting type vs Brock: good offense but takes rock damage", () => {
    const team: TeamMember[] = [{ pokemon_id: 56, name: "mankey", types: ["fighting"] }];

    const analysis = analyzeBossMatchup(team, brock, typeChart);

    // Fighting vs rock = 2, fighting vs ground = 1 => 2x
    // But rock vs fighting = 2x (SE). So it's neutral verdict (good offense, bad defense)
    for (const matchup of analysis.matchups[0]) {
      expect(matchup.offensive_effectiveness).toBe(2);
    }
  });
});
