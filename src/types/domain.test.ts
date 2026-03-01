import { describe, expect, it } from "vitest";
import type { NuzlockeRuleset, PokemonStatus, Run, RunEncounter, RunPokemon } from "./domain";

describe("Domain Types", () => {
  it("should allow valid PokemonStatus values", () => {
    const statuses: PokemonStatus[] = ["alive", "fainted", "boxed"];
    expect(statuses).toHaveLength(3);
  });

  it("should allow constructing a valid Run", () => {
    const ruleset: NuzlockeRuleset = {
      dupes_clause: true,
      species_clause: true,
      shiny_clause: false,
      level_caps: true,
    };

    const run: Run = {
      id: "run-1",
      game_id: "firered",
      name: "My First Nuzlocke",
      ruleset,
      status: "active",
      current_route_id: "route-1",
      created_at: "2026-02-28T00:00:00Z",
      updated_at: "2026-02-28T00:00:00Z",
    };

    expect(run.id).toBe("run-1");
    expect(run.status).toBe("active");
    expect(run.ruleset.dupes_clause).toBe(true);
  });

  it("should allow constructing a valid RunPokemon", () => {
    const pokemon: RunPokemon = {
      id: "pkmn-1",
      run_id: "run-1",
      pokemon_id: 4,
      nickname: "Blaze",
      caught_at_route_id: "pallet-town",
      caught_level: 5,
      current_level: 12,
      status: "alive",
    };

    expect(pokemon.nickname).toBe("Blaze");
    expect(pokemon.death_route_id).toBeUndefined();
  });

  it("should allow constructing a valid RunEncounter", () => {
    const encounter: RunEncounter = {
      id: "enc-1",
      run_id: "run-1",
      route_id: "route-1",
      pokemon_id: 16,
      outcome: "caught",
    };

    expect(encounter.outcome).toBe("caught");
  });
});
