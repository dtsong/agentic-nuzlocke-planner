/**
 * Boss Matchup Engine
 *
 * Analyzes team vs boss matchups, recommends leads, and identifies threats.
 * Pure functions — no framework imports.
 */

import type { TypeChart } from "@/domain/type-effectiveness";
import {
  getDefensiveMatchups,
  getTypeEffectivenessAgainstPokemon,
} from "@/domain/type-effectiveness";

export interface BossPokemon {
  pokemon_id: number;
  name: string;
  level: number;
  types: string[];
  moves?: string[];
  ability?: string;
}

export interface BossDefinition {
  id: string;
  name: string;
  type: string;
  location: string;
  pokemon: BossPokemon[];
}

export interface TeamMember {
  pokemon_id: number;
  name: string;
  types: string[];
}

export interface PokemonMatchup {
  team_pokemon: { pokemon_id: number; name: string; types: string[] };
  boss_pokemon: {
    pokemon_id: number;
    name: string;
    types: string[];
    level: number;
  };
  offensive_effectiveness: number;
  defensive_effectiveness: number;
  verdict: "favorable" | "neutral" | "unfavorable" | "dangerous";
}

export interface BossAnalysis {
  boss: BossDefinition;
  matchups: PokemonMatchup[][];
  recommended_lead: {
    pokemon_id: number;
    name: string;
    reason: string;
  };
  threats: Array<{
    boss_pokemon: string;
    threat_level: "high" | "medium" | "low";
    weak_against: string[];
  }>;
  coverage_gaps: string[];
}

/**
 * Determine the verdict for a single matchup.
 *
 * - favorable: team member hits super-effectively AND resists boss's STAB
 * - dangerous: boss hits super-effectively AND team member doesn't resist
 * - unfavorable: boss resists team member's attacks OR boss hits super-effectively
 * - neutral: everything else
 */
function determineVerdict(
  offensiveEff: number,
  defensiveEff: number,
): "favorable" | "neutral" | "unfavorable" | "dangerous" {
  if (offensiveEff >= 2 && defensiveEff < 1) return "favorable";
  if (defensiveEff >= 2 && offensiveEff <= 1) return "dangerous";
  if (defensiveEff >= 2 || offensiveEff < 1) return "unfavorable";
  if (offensiveEff >= 2) return "favorable";
  return "neutral";
}

/**
 * Compute the best offensive effectiveness a team member's types have
 * against a boss Pokemon's types.
 */
function bestOffensiveEffectiveness(
  attackerTypes: string[],
  defenderTypes: string[],
  typeChart: TypeChart,
): number {
  let best = 0;
  for (const atkType of attackerTypes) {
    const eff = getTypeEffectivenessAgainstPokemon(atkType, defenderTypes, typeChart);
    if (eff > best) best = eff;
  }
  return best;
}

/**
 * Compute the worst defensive effectiveness (highest damage) a boss Pokemon's
 * types deal to a team member.
 */
function worstDefensiveEffectiveness(
  defenderTypes: string[],
  attackerTypes: string[],
  typeChart: TypeChart,
): number {
  let worst = 0;
  for (const atkType of attackerTypes) {
    const eff = getTypeEffectivenessAgainstPokemon(atkType, defenderTypes, typeChart);
    if (eff > worst) worst = eff;
  }
  return worst;
}

/**
 * Analyze the full team vs a specific boss fight.
 */
export function analyzeBossMatchup(
  team: TeamMember[],
  boss: BossDefinition,
  typeChart: TypeChart,
): BossAnalysis {
  // Build matchup matrix: team[i] vs boss.pokemon[j]
  const matchups: PokemonMatchup[][] = team.map((member) =>
    boss.pokemon.map((bossMon) => {
      const offensiveEff = bestOffensiveEffectiveness(member.types, bossMon.types, typeChart);
      const defensiveEff = worstDefensiveEffectiveness(member.types, bossMon.types, typeChart);
      return {
        team_pokemon: {
          pokemon_id: member.pokemon_id,
          name: member.name,
          types: member.types,
        },
        boss_pokemon: {
          pokemon_id: bossMon.pokemon_id,
          name: bossMon.name,
          types: bossMon.types,
          level: bossMon.level,
        },
        offensive_effectiveness: offensiveEff,
        defensive_effectiveness: defensiveEff,
        verdict: determineVerdict(offensiveEff, defensiveEff),
      };
    }),
  );

  // Determine recommended lead: team member with best average offensive effectiveness
  // weighted by favorable verdicts
  let bestLeadIdx = 0;
  let bestLeadScore = -Infinity;
  const leadReasons: string[] = [];

  for (let i = 0; i < team.length; i++) {
    let score = 0;
    const favorableAgainst: string[] = [];
    for (const matchup of matchups[i]) {
      if (matchup.verdict === "favorable") {
        score += 3;
        favorableAgainst.push(matchup.boss_pokemon.name);
      } else if (matchup.verdict === "neutral") {
        score += 1;
      } else if (matchup.verdict === "unfavorable") {
        score -= 1;
      } else if (matchup.verdict === "dangerous") {
        score -= 3;
      }
    }
    leadReasons[i] =
      favorableAgainst.length > 0
        ? `Super-effective against ${favorableAgainst.join(", ")}`
        : "Best neutral matchup across boss team";
    if (score > bestLeadScore) {
      bestLeadScore = score;
      bestLeadIdx = i;
    }
  }

  const recommendedLead =
    team.length > 0
      ? {
          pokemon_id: team[bestLeadIdx].pokemon_id,
          name: team[bestLeadIdx].name,
          reason: leadReasons[bestLeadIdx],
        }
      : { pokemon_id: 0, name: "", reason: "No team members" };

  // Identify threats: boss Pokemon that are dangerous to many team members
  const threats = boss.pokemon.map((bossMon) => {
    const weakAgainst: string[] = [];
    let dangerousCount = 0;

    for (let i = 0; i < team.length; i++) {
      const matchup = matchups[i][boss.pokemon.indexOf(bossMon)];
      if (matchup.verdict === "dangerous" || matchup.verdict === "unfavorable") {
        dangerousCount++;
        weakAgainst.push(team[i].name);
      }
    }

    const threatLevel: "high" | "medium" | "low" =
      dangerousCount >= team.length * 0.5 ? "high" : dangerousCount >= 1 ? "medium" : "low";

    return {
      boss_pokemon: bossMon.name,
      threat_level: threatLevel,
      weak_against: weakAgainst,
    };
  });

  // Coverage gaps: boss types that no team member resists
  const coverageGaps: string[] = [];
  const allBossTypes = new Set(boss.pokemon.flatMap((p) => p.types));

  for (const bossType of allBossTypes) {
    const anyResists = team.some((member) => {
      const def = getDefensiveMatchups(member.types, typeChart);
      return def[bossType] < 1;
    });
    if (!anyResists) {
      coverageGaps.push(bossType);
    }
  }

  return {
    boss,
    matchups,
    recommended_lead: recommendedLead,
    threats,
    coverage_gaps: coverageGaps,
  };
}
