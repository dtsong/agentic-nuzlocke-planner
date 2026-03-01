import { describe, expect, it } from "vitest";
import typeChart from "@/data/type-chart.json";
import {
  getDefensiveMatchups,
  getOffensiveMatchups,
  getTypeEffectiveness,
  getTypeEffectivenessAgainstPokemon,
} from "./index";

describe("getTypeEffectiveness", () => {
  it("fire vs grass = 2x", () => {
    expect(getTypeEffectiveness("fire", "grass", typeChart)).toBe(2);
  });

  it("water vs fire = 2x", () => {
    expect(getTypeEffectiveness("water", "fire", typeChart)).toBe(2);
  });

  it("normal vs ghost = 0x", () => {
    expect(getTypeEffectiveness("normal", "ghost", typeChart)).toBe(0);
  });

  it("electric vs ground = 0x", () => {
    expect(getTypeEffectiveness("electric", "ground", typeChart)).toBe(0);
  });

  it("fighting vs normal = 2x", () => {
    expect(getTypeEffectiveness("fighting", "normal", typeChart)).toBe(2);
  });

  it("grass vs water = 2x", () => {
    expect(getTypeEffectiveness("grass", "water", typeChart)).toBe(2);
  });

  it("fire vs water = 0.5x (not very effective)", () => {
    expect(getTypeEffectiveness("fire", "water", typeChart)).toBe(0.5);
  });

  it("normal vs normal = 1x (neutral)", () => {
    expect(getTypeEffectiveness("normal", "normal", typeChart)).toBe(1);
  });

  it("unknown type returns 1x", () => {
    expect(getTypeEffectiveness("cosmic", "fire", typeChart)).toBe(1);
  });

  it("ghost vs ghost = 2x", () => {
    expect(getTypeEffectiveness("ghost", "ghost", typeChart)).toBe(2);
  });

  it("steel vs fairy = 2x", () => {
    expect(getTypeEffectiveness("steel", "fairy", typeChart)).toBe(2);
  });
});

describe("getTypeEffectivenessAgainstPokemon", () => {
  it("ice vs dragon/flying (Dragonite) = 4x", () => {
    expect(getTypeEffectivenessAgainstPokemon("ice", ["dragon", "flying"], typeChart)).toBe(4);
  });

  it("fire vs water/ground = 0.5x (water resists, ground neutral)", () => {
    // fire vs water = 0.5, fire vs ground = 1 => 0.5 * 1 = 0.5
    expect(getTypeEffectivenessAgainstPokemon("fire", ["water", "ground"], typeChart)).toBe(0.5);
  });

  it("ground vs rock/ground (Geodude) = 2x", () => {
    // ground vs rock = 0.5 (wait no), let me check: ground -> rock = 0.5?
    // From chart row 8 (ground, 0-indexed): [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1]
    // rock is index 12: ground vs rock = 2
    // ground vs ground (index 8): ground vs ground = 1
    // So ground vs rock/ground = 2 * 1 = 2
    expect(getTypeEffectivenessAgainstPokemon("ground", ["rock", "ground"], typeChart)).toBe(2);
  });

  it("electric vs water/flying = 4x", () => {
    expect(getTypeEffectivenessAgainstPokemon("electric", ["water", "flying"], typeChart)).toBe(4);
  });

  it("grass vs rock/ground = 4x", () => {
    expect(getTypeEffectivenessAgainstPokemon("grass", ["rock", "ground"], typeChart)).toBe(4);
  });

  it("single type works the same as basic effectiveness", () => {
    expect(getTypeEffectivenessAgainstPokemon("fire", ["grass"], typeChart)).toBe(2);
  });

  it("normal vs normal/ghost = 0x (ghost immunity dominates)", () => {
    // This tests an interesting case: normal/ghost doesn't exist in games,
    // but mathematically normal vs ghost = 0, so 1 * 0 = 0
    expect(getTypeEffectivenessAgainstPokemon("normal", ["normal", "ghost"], typeChart)).toBe(0);
  });
});

describe("getOffensiveMatchups", () => {
  it("fire type should have 2x vs grass, bug, ice, steel", () => {
    const matchups = getOffensiveMatchups(["fire"], typeChart);
    expect(matchups.grass).toBe(2);
    expect(matchups.bug).toBe(2);
    expect(matchups.ice).toBe(2);
    expect(matchups.steel).toBe(2);
  });

  it("fire type should have 0.5x vs water, rock, fire, dragon", () => {
    const matchups = getOffensiveMatchups(["fire"], typeChart);
    expect(matchups.water).toBe(0.5);
    expect(matchups.rock).toBe(0.5);
    expect(matchups.fire).toBe(0.5);
    expect(matchups.dragon).toBe(0.5);
  });

  it("dual type takes best multiplier from either type", () => {
    // water/ice: water hits fire 2x, ice hits fire 0.5x => best is 2
    const matchups = getOffensiveMatchups(["water", "ice"], typeChart);
    expect(matchups.fire).toBe(2);
    // ice hits dragon 2x, water hits dragon 0.5x => best is 2
    expect(matchups.dragon).toBe(2);
    // ice hits grass 2x, water hits grass 0.5x => best is 2
    expect(matchups.grass).toBe(2);
  });

  it("returns all 18 types", () => {
    const matchups = getOffensiveMatchups(["normal"], typeChart);
    expect(Object.keys(matchups)).toHaveLength(18);
  });

  it("normal type has 0x vs ghost", () => {
    const matchups = getOffensiveMatchups(["normal"], typeChart);
    expect(matchups.ghost).toBe(0);
  });
});

describe("getDefensiveMatchups", () => {
  it("fire type takes 2x from water, ground, rock", () => {
    const matchups = getDefensiveMatchups(["fire"], typeChart);
    expect(matchups.water).toBe(2);
    expect(matchups.ground).toBe(2);
    expect(matchups.rock).toBe(2);
  });

  it("fire type takes 0.5x from fire, grass, ice, bug, steel, fairy", () => {
    const matchups = getDefensiveMatchups(["fire"], typeChart);
    expect(matchups.fire).toBe(0.5);
    expect(matchups.grass).toBe(0.5);
    expect(matchups.ice).toBe(0.5);
    expect(matchups.bug).toBe(0.5);
    expect(matchups.steel).toBe(0.5);
    expect(matchups.fairy).toBe(0.5);
  });

  it("ghost type is immune to normal and fighting", () => {
    const matchups = getDefensiveMatchups(["ghost"], typeChart);
    expect(matchups.normal).toBe(0);
    expect(matchups.fighting).toBe(0);
  });

  it("dual type multiplies resistances (rock/ground vs fire)", () => {
    // rock resists fire (0.5), ground neutral to fire (1) => 0.5
    const matchups = getDefensiveMatchups(["rock", "ground"], typeChart);
    expect(matchups.fire).toBe(0.5);
  });

  it("dual type multiplies weaknesses (rock/ground vs water)", () => {
    // rock weak to water (2), ground weak to water (2) => 4
    const matchups = getDefensiveMatchups(["rock", "ground"], typeChart);
    expect(matchups.water).toBe(4);
  });

  it("returns all 18 types", () => {
    const matchups = getDefensiveMatchups(["water"], typeChart);
    expect(Object.keys(matchups)).toHaveLength(18);
  });
});
