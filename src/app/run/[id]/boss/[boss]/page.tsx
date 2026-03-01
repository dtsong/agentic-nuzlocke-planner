"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MatchupMatrix } from "@/components/boss-prep/matchup-matrix";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/team-panel/type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import typeChartData from "@/data/type-chart.json";
import { analyzeBossMatchup } from "@/domain/boss-matchups";
import type { TypeChart } from "@/domain/type-effectiveness";
import type { GameId } from "@/lib/game-data";
import { getGameData } from "@/lib/game-data";
import { getPokemonName, getPokemonTypes } from "@/lib/pokemon";
import { getRun, getTeamPokemon } from "@/lib/storage";

const typeChart = typeChartData as TypeChart;

export default function BossPrepPage() {
  const params = useParams<{ id: string; boss: string }>();
  const router = useRouter();

  const run = getRun(params.id);

  if (!run) {
    router.replace("/");
    return null;
  }

  const gameData = getGameData(run.game_id as GameId);
  const boss = gameData.bosses.find((b) => b.id === params.boss);

  if (!boss) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center space-y-2">
          <p className="text-text-muted">Boss not found.</p>
          <Link href={`/run/${params.id}`} className="text-accent hover:text-accent-hover text-sm">
            Back to run
          </Link>
        </div>
      </div>
    );
  }

  const pokemon = getTeamPokemon(run.id);
  const aliveTeam = pokemon
    .filter((p) => p.status === "alive")
    .map((p) => ({
      pokemon_id: p.pokemon_id,
      name: getPokemonName(p.pokemon_id),
      types: getPokemonTypes(p.pokemon_id),
    }));

  const analysis = analyzeBossMatchup(aliveTeam, boss, typeChart);

  const threatLevelColor = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "#C0392B";
      case "medium":
        return "#D4A843";
      case "low":
        return "#8A8070";
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-text-muted/20 bg-surface-raised px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/run/${params.id}`}
              className="text-text-muted hover:text-text-body transition-colors text-sm"
            >
              &larr; Run
            </Link>
            <div>
              <h1 className="font-display text-lg font-semibold text-text-primary">{boss.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {boss.specialty_type && <TypeBadge type={boss.specialty_type} />}
                {boss.badge && (
                  <span className="font-mono text-[10px] text-text-muted capitalize">
                    {boss.badge.replace(/-/g, " ")}
                  </span>
                )}
                {!boss.badge && (
                  <span className="font-mono text-[10px] text-text-muted capitalize">
                    {boss.type.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="font-mono text-xs text-text-muted">{aliveTeam.length} alive</span>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* Matchup Matrix */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Matchup Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchupMatrix analysis={analysis} />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recommended Lead */}
          {analysis.recommended_lead.name && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recommended Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-display text-lg font-semibold text-accent">
                    {analysis.recommended_lead.name}
                  </p>
                  <p className="font-mono text-xs text-text-body">
                    {analysis.recommended_lead.reason}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Threats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Key Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.threats
                  .filter((t) => t.threat_level !== "low")
                  .map((threat) => (
                    <div key={threat.boss_pokemon} className="flex items-start gap-2">
                      <span
                        className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[8px] font-bold uppercase"
                        style={{
                          backgroundColor: `${threatLevelColor(threat.threat_level)}25`,
                          color: threatLevelColor(threat.threat_level),
                        }}
                      >
                        {threat.threat_level.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary capitalize">
                          {threat.boss_pokemon}
                        </p>
                        {threat.weak_against.length > 0 && (
                          <p className="font-mono text-[10px] text-text-muted truncate">
                            Threatens: {threat.weak_against.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {analysis.threats.filter((t) => t.threat_level !== "low").length === 0 && (
                  <p className="font-mono text-xs text-state-alive">
                    No significant threats detected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coverage Gaps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Unresisted Types</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.coverage_gaps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.coverage_gaps.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-state-alive">All boss types resisted</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Boss Team Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Boss Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {boss.pokemon.map((bp) => (
                <div
                  key={bp.pokemon_id}
                  className="rounded-lg border border-text-muted/15 bg-surface px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PokemonSprite pokemonId={bp.pokemon_id} name={bp.name} size="sm" />
                      <span className="text-sm font-medium text-text-primary capitalize">
                        {bp.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-text-muted">Lv.{bp.level}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {bp.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </div>
                  {bp.moves && bp.moves.length > 0 && (
                    <p className="font-mono text-[10px] text-text-muted mt-1.5 truncate">
                      {bp.moves.map((m) => m.replace(/-/g, " ")).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
