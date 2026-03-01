/**
 * Coverage Analyzer
 *
 * Analyzes team coverage vectors and identifies offensive/defensive gaps.
 * Pure functions — no framework imports.
 */

import type { TypeChart } from "@/domain/type-effectiveness";
import { getDefensiveMatchups, getOffensiveMatchups } from "@/domain/type-effectiveness";

export interface CoverageVector {
  /** For each of the 18 types, the best offensive multiplier from any team member */
  offensive: Record<string, number>;
  /** For each of the 18 types, the worst (highest) multiplier any team member takes */
  defensive: Record<string, number>;
}

export interface CoverageGap {
  type: string;
  severity: "critical" | "moderate" | "minor";
}

/**
 * Compute a team's offensive and defensive coverage vectors.
 *
 * Offensive: for each type, the best super-effective multiplier any team member can deal.
 * Defensive: for each type, the worst (highest) damage multiplier any team member receives.
 */
export function analyzeTeamCoverage(
  team: Array<{ types: string[] }>,
  typeChart: TypeChart,
): CoverageVector {
  const offensive: Record<string, number> = {};
  const defensive: Record<string, number> = {};

  // Initialize
  for (const t of typeChart.types) {
    offensive[t] = 0;
    defensive[t] = Number.POSITIVE_INFINITY;
  }

  for (const member of team) {
    const off = getOffensiveMatchups(member.types, typeChart);
    const def = getDefensiveMatchups(member.types, typeChart);

    for (const t of typeChart.types) {
      // Best offensive coverage across team
      if (off[t] > offensive[t]) offensive[t] = off[t];
      // Best (lowest) defensive matchup across team — someone who resists this type
      if (def[t] < defensive[t]) defensive[t] = def[t];
    }
  }

  // If team is empty, set defensive to 1 (neutral) for all types
  if (team.length === 0) {
    for (const t of typeChart.types) {
      defensive[t] = 1;
    }
  }

  return { offensive, defensive };
}

/**
 * Find types the team cannot hit super-effectively (offensive gaps).
 *
 * Severity:
 * - critical: best multiplier is 0 (immune)
 * - moderate: best multiplier is <= 0.5 (resisted)
 * - minor: best multiplier is 1 (neutral — no super-effective coverage)
 */
export function findOffensiveGaps(coverage: CoverageVector): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  for (const [type, multiplier] of Object.entries(coverage.offensive)) {
    if (multiplier === 0) {
      gaps.push({ type, severity: "critical" });
    } else if (multiplier <= 0.5) {
      gaps.push({ type, severity: "moderate" });
    } else if (multiplier <= 1) {
      gaps.push({ type, severity: "minor" });
    }
  }
  return gaps;
}

/**
 * Find types the team is weak to (defensive gaps).
 *
 * Severity:
 * - critical: best resistance is >= 2 (everyone is weak)
 * - moderate: best resistance is 1 (nobody resists)
 * - minor: best resistance is > 0.5 but < 1
 */
export function findDefensiveGaps(coverage: CoverageVector): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  for (const [type, multiplier] of Object.entries(coverage.defensive)) {
    if (multiplier >= 2) {
      gaps.push({ type, severity: "critical" });
    } else if (multiplier >= 1) {
      gaps.push({ type, severity: "moderate" });
    } else if (multiplier > 0.5) {
      gaps.push({ type, severity: "minor" });
    }
  }
  return gaps;
}
