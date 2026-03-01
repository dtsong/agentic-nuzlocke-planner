"use client";

import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/team-panel/type-badge";
import type { BossAnalysis, PokemonMatchup } from "@/domain/boss-matchups";

interface MatchupMatrixProps {
  analysis: BossAnalysis;
}

function verdictColor(verdict: PokemonMatchup["verdict"]): string {
  switch (verdict) {
    case "favorable":
      return "#5A8A5A";
    case "neutral":
      return "#8A8070";
    case "unfavorable":
      return "#D4A843";
    case "dangerous":
      return "#C0392B";
  }
}

function verdictBg(verdict: PokemonMatchup["verdict"]): string {
  switch (verdict) {
    case "favorable":
      return "rgba(90, 138, 90, 0.15)";
    case "neutral":
      return "rgba(138, 128, 112, 0.1)";
    case "unfavorable":
      return "rgba(212, 168, 67, 0.15)";
    case "dangerous":
      return "rgba(192, 57, 43, 0.2)";
  }
}

function formatMultiplier(value: number): string {
  if (value === 0) return "0";
  if (value === 0.25) return "\u00BCx";
  if (value === 0.5) return "\u00BDx";
  if (value === 1) return "1x";
  if (value === 2) return "2x";
  if (value === 4) return "4x";
  return `${value}x`;
}

export function MatchupMatrix({ analysis }: MatchupMatrixProps) {
  const { boss, matchups } = analysis;

  if (matchups.length === 0) {
    return (
      <div className="rounded-lg border border-text-muted/15 bg-surface-raised px-4 py-6 text-center">
        <p className="font-mono text-xs text-text-muted">No alive team members to analyze</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {/* Empty top-left cell */}
            <th className="p-2 text-left" />
            {/* Boss pokemon columns */}
            {boss.pokemon.map((bp) => (
              <th key={bp.pokemon_id} className="p-2 text-center min-w-[100px]">
                <div className="flex flex-col items-center space-y-1">
                  <PokemonSprite pokemonId={bp.pokemon_id} name={bp.name} size="sm" />
                  <p className="font-display text-xs font-medium text-text-primary capitalize">
                    {bp.name}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted">Lv.{bp.level}</p>
                  <div className="flex justify-center gap-1">
                    {bp.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matchups.map((row) => {
            const teamMon = row[0]?.team_pokemon;
            if (!teamMon) return null;
            return (
              <tr key={teamMon.pokemon_id}>
                {/* Team pokemon row header */}
                <td className="p-2 border-t border-text-muted/10">
                  <div className="flex items-center gap-2">
                    <PokemonSprite pokemonId={teamMon.pokemon_id} name={teamMon.name} size="sm" />
                    <div className="space-y-1">
                      <p className="font-display text-xs font-medium text-text-primary capitalize truncate max-w-[100px]">
                        {teamMon.name}
                      </p>
                      <div className="flex gap-1">
                        {teamMon.types.map((t) => (
                          <TypeBadge key={t} type={t} />
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                {/* Matchup cells */}
                {row.map((matchup) => {
                  const color = verdictColor(matchup.verdict);
                  const bg = verdictBg(matchup.verdict);
                  return (
                    <td
                      key={`${matchup.team_pokemon.pokemon_id}-${matchup.boss_pokemon.pokemon_id}`}
                      className="p-2 border-t border-text-muted/10 text-center"
                      style={{ backgroundColor: bg }}
                    >
                      <div className="space-y-0.5">
                        {/* Offensive */}
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px]" title="Your attack">
                            &#x2694;
                          </span>
                          <span className="font-mono text-[10px] font-bold" style={{ color }}>
                            {formatMultiplier(matchup.offensive_effectiveness)}
                          </span>
                        </div>
                        {/* Defensive */}
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px]" title="Enemy attack">
                            &#x1F6E1;
                          </span>
                          <span className="font-mono text-[10px] font-bold" style={{ color }}>
                            {formatMultiplier(matchup.defensive_effectiveness)}
                          </span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
