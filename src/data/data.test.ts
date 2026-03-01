import { describe, expect, it } from "vitest";
import pokemonIndex from "./pokemon-index.json";
import { PokemonIndexSchema, TypeChartSchema } from "./schemas";
import typeChart from "./type-chart.json";

describe("Type Chart", () => {
  it("should have exactly 18 types", () => {
    expect(typeChart.types).toHaveLength(18);
  });

  it("should have an 18x18 matrix", () => {
    expect(typeChart.matrix).toHaveLength(18);
    for (const row of typeChart.matrix) {
      expect(row).toHaveLength(18);
    }
  });

  it("should validate against the Zod schema", () => {
    const result = TypeChartSchema.safeParse(typeChart);
    expect(result.success).toBe(true);
  });

  it("should contain all expected types in correct order", () => {
    const expectedTypes = [
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
    ];
    expect(typeChart.types).toEqual(expectedTypes);
  });

  // Helper to look up effectiveness by type names
  function getEffectiveness(attacker: string, defender: string): number {
    const attackerIdx = typeChart.types.indexOf(attacker);
    const defenderIdx = typeChart.types.indexOf(defender);
    return typeChart.matrix[attackerIdx][defenderIdx];
  }

  it("fire should be super effective against grass (2x)", () => {
    expect(getEffectiveness("fire", "grass")).toBe(2);
  });

  it("water should be super effective against fire (2x)", () => {
    expect(getEffectiveness("water", "fire")).toBe(2);
  });

  it("normal should have no effect on ghost (0x)", () => {
    expect(getEffectiveness("normal", "ghost")).toBe(0);
  });

  it("electric should have no effect on ground (0x)", () => {
    expect(getEffectiveness("electric", "ground")).toBe(0);
  });

  it("fighting should be super effective against normal (2x)", () => {
    expect(getEffectiveness("fighting", "normal")).toBe(2);
  });

  it("ghost should be super effective against ghost (2x)", () => {
    expect(getEffectiveness("ghost", "ghost")).toBe(2);
  });

  it("dragon should be super effective against dragon (2x)", () => {
    expect(getEffectiveness("dragon", "dragon")).toBe(2);
  });

  it("steel should be super effective against fairy (2x)", () => {
    expect(getEffectiveness("steel", "fairy")).toBe(2);
  });

  it("fairy should be super effective against dragon (2x)", () => {
    expect(getEffectiveness("fairy", "dragon")).toBe(2);
  });

  it("should only contain valid effectiveness values (0, 0.5, 1, 2)", () => {
    const validValues = new Set([0, 0.5, 1, 2]);
    for (const row of typeChart.matrix) {
      for (const value of row) {
        expect(validValues.has(value)).toBe(true);
      }
    }
  });
});

describe("Pokemon Index", () => {
  const entries = Object.entries(pokemonIndex);

  it("should have 151 entries", () => {
    expect(entries).toHaveLength(151);
  });

  it("should validate against the Zod schema", () => {
    const result = PokemonIndexSchema.safeParse(pokemonIndex);
    expect(result.success).toBe(true);
  });

  it("should have dex numbers 1 through 151", () => {
    for (let i = 1; i <= 151; i++) {
      expect(pokemonIndex).toHaveProperty(String(i));
    }
  });

  it("Bulbasaur (#1) should be grass/poison", () => {
    const bulbasaur = pokemonIndex["1"];
    expect(bulbasaur.name).toBe("bulbasaur");
    expect(bulbasaur.types).toEqual(["grass", "poison"]);
  });

  it("Charizard (#6) should be fire/flying", () => {
    const charizard = pokemonIndex["6"];
    expect(charizard.name).toBe("charizard");
    expect(charizard.types).toEqual(["fire", "flying"]);
  });

  it("Pikachu (#25) should be electric", () => {
    const pikachu = pokemonIndex["25"];
    expect(pikachu.name).toBe("pikachu");
    expect(pikachu.types).toEqual(["electric"]);
  });

  it("Mewtwo (#150) should be psychic", () => {
    const mewtwo = pokemonIndex["150"];
    expect(mewtwo.name).toBe("mewtwo");
    expect(mewtwo.types).toEqual(["psychic"]);
  });

  it("every entry should have complete base stats", () => {
    const statKeys = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"];
    for (const [, pokemon] of entries) {
      for (const stat of statKeys) {
        expect(pokemon.base_stats).toHaveProperty(stat);
        expect(typeof pokemon.base_stats[stat as keyof typeof pokemon.base_stats]).toBe("number");
      }
    }
  });
});
