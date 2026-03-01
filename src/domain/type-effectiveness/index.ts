/**
 * Type Effectiveness Calculator
 *
 * Pure functions for computing Pokemon type matchups.
 * No framework imports — operates entirely on static data passed as arguments.
 */

export interface TypeChart {
  types: string[];
  matrix: number[][];
}

/**
 * Get effectiveness multiplier for one attacking type vs one defending type.
 */
export function getTypeEffectiveness(
  attackingType: string,
  defendingType: string,
  typeChart: TypeChart,
): number {
  const atkIdx = typeChart.types.indexOf(attackingType);
  const defIdx = typeChart.types.indexOf(defendingType);
  if (atkIdx === -1 || defIdx === -1) return 1;
  return typeChart.matrix[atkIdx][defIdx];
}

/**
 * Get effectiveness multiplier for one attacking type vs a dual-type defender.
 * Multiplies the individual matchups together.
 */
export function getTypeEffectivenessAgainstPokemon(
  attackingType: string,
  defenderTypes: string[],
  typeChart: TypeChart,
): number {
  return defenderTypes.reduce(
    (multiplier, defType) => multiplier * getTypeEffectiveness(attackingType, defType, typeChart),
    1,
  );
}

/**
 * Get all offensive matchups for a Pokemon's types.
 * For each defending type, returns the best STAB effectiveness from any of the attacker's types.
 */
export function getOffensiveMatchups(
  attackerTypes: string[],
  typeChart: TypeChart,
): Record<string, number> {
  const matchups: Record<string, number> = {};
  for (const defType of typeChart.types) {
    let best = 0;
    for (const atkType of attackerTypes) {
      const eff = getTypeEffectiveness(atkType, defType, typeChart);
      if (eff > best) best = eff;
    }
    matchups[defType] = best;
  }
  return matchups;
}

/**
 * Get all defensive matchups for a Pokemon's types.
 * For each attacking type, returns the combined multiplier against this Pokemon.
 */
export function getDefensiveMatchups(
  defenderTypes: string[],
  typeChart: TypeChart,
): Record<string, number> {
  const matchups: Record<string, number> = {};
  for (const atkType of typeChart.types) {
    matchups[atkType] = getTypeEffectivenessAgainstPokemon(atkType, defenderTypes, typeChart);
  }
  return matchups;
}
