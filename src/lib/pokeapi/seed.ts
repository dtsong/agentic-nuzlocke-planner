/**
 * PokeAPI Seed Script
 *
 * Fetches Pokemon data from PokeAPI and outputs static JSON to src/data/pokemon-index.json.
 * Idempotent: safe to run multiple times, always produces the same output for the same input.
 *
 * Usage: npx tsx src/lib/pokeapi/seed.ts [--gen 1] [--start 1] [--end 151]
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface PokeAPIPokemon {
  id: number;
  name: string;
  types: Array<{
    slot: number;
    type: { name: string };
  }>;
  stats: Array<{
    base_stat: number;
    stat: { name: string };
  }>;
}

interface PokemonEntry {
  name: string;
  types: string[];
  base_stats: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
}

const STAT_MAP: Record<string, string> = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "sp_attack",
  "special-defense": "sp_defense",
  speed: "speed",
};

const RATE_LIMIT_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPokemon(id: number): Promise<PokemonEntry> {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon ${id}: ${response.status} ${response.statusText}`);
  }

  const data: PokeAPIPokemon = await response.json();

  const types = data.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);

  const baseStats: Record<string, number> = {};
  for (const stat of data.stats) {
    const key = STAT_MAP[stat.stat.name];
    if (key) {
      baseStats[key] = stat.base_stat;
    }
  }

  return {
    name: data.name,
    types,
    base_stats: {
      hp: baseStats.hp ?? 0,
      attack: baseStats.attack ?? 0,
      defense: baseStats.defense ?? 0,
      sp_attack: baseStats.sp_attack ?? 0,
      sp_defense: baseStats.sp_defense ?? 0,
      speed: baseStats.speed ?? 0,
    },
  };
}

function parseArgs(args: string[]): { start: number; end: number } {
  let start = 1;
  let end = 151;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--start" && args[i + 1]) {
      start = Number.parseInt(args[i + 1], 10);
    }
    if (args[i] === "--end" && args[i + 1]) {
      end = Number.parseInt(args[i + 1], 10);
    }
    if (args[i] === "--gen" && args[i + 1]) {
      const gen = Number.parseInt(args[i + 1], 10);
      const genRanges: Record<number, [number, number]> = {
        1: [1, 151],
        2: [1, 251],
        3: [1, 386],
        4: [1, 493],
        5: [1, 649],
      };
      const range = genRanges[gen];
      if (range) {
        [start, end] = range;
      } else {
        console.error(`Unknown generation: ${gen}. Supported: 1-5`);
        process.exit(1);
      }
    }
  }

  return { start, end };
}

async function main() {
  const { start, end } = parseArgs(process.argv.slice(2));
  const total = end - start + 1;

  console.log(`Fetching Pokemon ${start}-${end} (${total} total)...`);

  const index: Record<string, PokemonEntry> = {};

  for (let id = start; id <= end; id++) {
    const progress = id - start + 1;
    process.stdout.write(`\r  [${progress}/${total}] Fetching #${id}...`);

    try {
      index[String(id)] = await fetchPokemon(id);
    } catch (error) {
      console.error(`\nError fetching Pokemon ${id}:`, error);
      process.exit(1);
    }

    if (id < end) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  process.stdout.write("\n");

  const outputPath = resolve(__dirname, "../../data/pokemon-index.json");
  const json = `${JSON.stringify(index, null, 2)}\n`;
  writeFileSync(outputPath, json, "utf-8");

  console.log(`Wrote ${total} Pokemon to ${outputPath}`);
}

main();
