/**
 * localStorage persistence layer for Nuzlocke runs.
 *
 * Schema mirrors future Supabase schema exactly.
 * Keys:
 *   nuzlocke_runs              — JSON array of Run objects
 *   nuzlocke_pokemon_{run_id}  — JSON array of RunPokemon
 *   nuzlocke_encounters_{run_id} — JSON array of RunEncounter
 */

import type { PokemonStatus, Run, RunEncounter, RunPokemon } from "@/types/domain";

const RUNS_KEY = "nuzlocke_runs";

function pokemonKey(runId: string): string {
  return `nuzlocke_pokemon_${runId}`;
}

function encountersKey(runId: string): string {
  return `nuzlocke_encounters_${runId}`;
}

// ---------- ID generation ----------

export function generateId(): string {
  return crypto.randomUUID();
}

// ---------- Runs ----------

export function saveRun(run: Run): void {
  const runs = getAllRuns();
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx >= 0) {
    runs[idx] = run;
  } else {
    runs.push(run);
  }
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

export function getRun(id: string): Run | null {
  const runs = getAllRuns();
  return runs.find((r) => r.id === id) ?? null;
}

export function getAllRuns(): Run[] {
  const raw = localStorage.getItem(RUNS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Run[];
  } catch {
    return [];
  }
}

export function deleteRun(id: string): void {
  const runs = getAllRuns().filter((r) => r.id !== id);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  localStorage.removeItem(pokemonKey(id));
  localStorage.removeItem(encountersKey(id));
}

// ---------- Team Pokemon ----------

export function saveTeamPokemon(pokemon: RunPokemon): void {
  const list = getTeamPokemon(pokemon.run_id);
  const idx = list.findIndex((p) => p.id === pokemon.id);
  if (idx >= 0) {
    list[idx] = pokemon;
  } else {
    list.push(pokemon);
  }
  localStorage.setItem(pokemonKey(pokemon.run_id), JSON.stringify(list));
}

export function getTeamPokemon(runId: string): RunPokemon[] {
  const raw = localStorage.getItem(pokemonKey(runId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RunPokemon[];
  } catch {
    return [];
  }
}

export function updatePokemonStatus(
  runId: string,
  pokemonId: string,
  status: PokemonStatus,
  deathInfo?: { route_id: string; cause: string },
): void {
  const list = getTeamPokemon(runId);
  const pokemon = list.find((p) => p.id === pokemonId);
  if (!pokemon) return;

  pokemon.status = status;
  if (status === "fainted" && deathInfo) {
    pokemon.death_route_id = deathInfo.route_id;
    pokemon.death_cause = deathInfo.cause;
  }

  localStorage.setItem(pokemonKey(runId), JSON.stringify(list));
}

// ---------- Encounters ----------

export function saveEncounter(encounter: RunEncounter): void {
  const list = getEncounters(encounter.run_id);
  const idx = list.findIndex((e) => e.id === encounter.id);
  if (idx >= 0) {
    list[idx] = encounter;
  } else {
    list.push(encounter);
  }
  localStorage.setItem(encountersKey(encounter.run_id), JSON.stringify(list));
}

export function getEncounters(runId: string): RunEncounter[] {
  const raw = localStorage.getItem(encountersKey(runId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RunEncounter[];
  } catch {
    return [];
  }
}
