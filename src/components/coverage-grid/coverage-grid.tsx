"use client";

import { useState } from "react";
import { TypeBadge } from "@/components/team-panel/type-badge";
import typeChartData from "@/data/type-chart.json";
import {
  analyzeTeamCoverage,
  findDefensiveGaps,
  findOffensiveGaps,
} from "@/domain/coverage-analyzer";
import type { TypeChart } from "@/domain/type-effectiveness";
import { getTypeColor } from "@/lib/type-colors";

const typeChart = typeChartData as TypeChart;

interface CoverageGridProps {
  team: Array<{ types: string[] }>;
}

function effectivenessColor(multiplier: number): string {
  if (multiplier >= 2) return "#5A8A5A"; // super effective — green
  if (multiplier >= 1) return "#8A8070"; // neutral — muted
  if (multiplier > 0) return "#D4A843"; // not very effective — amber
  return "#C0392B"; // immune/no coverage — crimson
}

function effectivenessLabel(multiplier: number): string {
  if (multiplier === 0) return "0";
  if (multiplier === 0.25) return "\u00BC";
  if (multiplier === 0.5) return "\u00BD";
  if (multiplier === 1) return "1";
  if (multiplier === 2) return "2";
  if (multiplier === 4) return "4";
  return String(multiplier);
}

function severityLabel(severity: "critical" | "moderate" | "minor"): string {
  if (severity === "critical") return "CRIT";
  if (severity === "moderate") return "MOD";
  return "LOW";
}

export function CoverageGrid({ team }: CoverageGridProps) {
  const [activeRow, setActiveRow] = useState<"offense" | "defense" | null>(null);
  const coverage = analyzeTeamCoverage(team, typeChart);
  const offensiveGaps = findOffensiveGaps(coverage);
  const defensiveGaps = findDefensiveGaps(coverage);

  const criticalGaps = [...offensiveGaps, ...defensiveGaps].filter(
    (g) => g.severity === "critical",
  );
  const hasGaps = offensiveGaps.length > 0 || defensiveGaps.length > 0;

  return (
    <div className="space-y-4">
      {/* Grid header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-text-primary">Type Coverage</h3>
        {criticalGaps.length > 0 && (
          <span className="font-mono text-xs text-state-death">
            {criticalGaps.length} critical gap{criticalGaps.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Coverage matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Type column headers */}
          <div className="flex gap-px mb-px">
            <div className="w-16 shrink-0" />
            {typeChart.types.map((type) => (
              <div key={type} className="flex-1 flex items-center justify-center py-1" title={type}>
                <span
                  className="font-mono text-[9px] font-bold uppercase tracking-tight"
                  style={{ color: getTypeColor(type) }}
                >
                  {type.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>

          {/* Offense row */}
          <button
            type="button"
            className={`flex w-full gap-px cursor-pointer transition-opacity ${
              activeRow === "defense" ? "opacity-40" : ""
            }`}
            onClick={() => setActiveRow(activeRow === "offense" ? null : "offense")}
          >
            <div className="w-16 shrink-0 flex items-center">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                ATK
              </span>
            </div>
            {typeChart.types.map((type) => {
              const mult = coverage.offensive[type];
              const color = effectivenessColor(mult);
              return (
                <div
                  key={type}
                  className="flex-1 flex items-center justify-center py-2 rounded-sm"
                  style={{ backgroundColor: `${color}30` }}
                  title={`Offense vs ${type}: ${mult}x`}
                >
                  <span className="font-mono text-[10px] font-bold" style={{ color }}>
                    {effectivenessLabel(mult)}
                  </span>
                </div>
              );
            })}
          </button>

          {/* Defense row */}
          <button
            type="button"
            className={`flex w-full gap-px cursor-pointer mt-px transition-opacity ${
              activeRow === "offense" ? "opacity-40" : ""
            }`}
            onClick={() => setActiveRow(activeRow === "defense" ? null : "defense")}
          >
            <div className="w-16 shrink-0 flex items-center">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                DEF
              </span>
            </div>
            {typeChart.types.map((type) => {
              const mult = coverage.defensive[type];
              // For defense, lower is better (resistance), so invert the color logic
              const color = defensiveColor(mult);
              return (
                <div
                  key={type}
                  className="flex-1 flex items-center justify-center py-2 rounded-sm"
                  style={{ backgroundColor: `${color}30` }}
                  title={`Defense vs ${type}: ${mult}x (best resistance)`}
                >
                  <span className="font-mono text-[10px] font-bold" style={{ color }}>
                    {effectivenessLabel(mult)}
                  </span>
                </div>
              );
            })}
          </button>
        </div>
      </div>

      {/* Coverage gaps */}
      {hasGaps && (
        <div className="space-y-3 pt-2 border-t border-text-muted/15">
          {offensiveGaps.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                Offensive Gaps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {offensiveGaps
                  .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
                  .map((gap) => (
                    <div key={`off-${gap.type}`} className="flex items-center gap-1">
                      <TypeBadge type={gap.type} />
                      <span
                        className="font-mono text-[9px] font-bold uppercase"
                        style={{
                          color:
                            gap.severity === "critical"
                              ? "#C0392B"
                              : gap.severity === "moderate"
                                ? "#D4A843"
                                : "#8A8070",
                        }}
                      >
                        {severityLabel(gap.severity)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {defensiveGaps.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                Defensive Gaps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {defensiveGaps
                  .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
                  .map((gap) => (
                    <div key={`def-${gap.type}`} className="flex items-center gap-1">
                      <TypeBadge type={gap.type} />
                      <span
                        className="font-mono text-[9px] font-bold uppercase"
                        style={{
                          color:
                            gap.severity === "critical"
                              ? "#C0392B"
                              : gap.severity === "moderate"
                                ? "#D4A843"
                                : "#8A8070",
                        }}
                      >
                        {severityLabel(gap.severity)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All clear message */}
      {!hasGaps && team.length > 0 && (
        <p className="font-mono text-xs text-state-alive text-center py-2">
          Full type coverage achieved
        </p>
      )}

      {/* Empty state */}
      {team.length === 0 && (
        <p className="font-mono text-xs text-text-muted text-center py-2">
          Catch Pokemon to see type coverage
        </p>
      )}
    </div>
  );
}

/** Compact gap summary for mobile — shows just the count of critical/moderate gaps */
export function CoverageGapSummary({ team }: CoverageGridProps) {
  if (team.length === 0) {
    return (
      <p className="font-mono text-xs text-text-muted text-center py-2">
        Catch Pokemon to see type coverage
      </p>
    );
  }

  const coverage = analyzeTeamCoverage(team, typeChart);
  const offensiveGaps = findOffensiveGaps(coverage);
  const defensiveGaps = findDefensiveGaps(coverage);
  const criticalCount = [...offensiveGaps, ...defensiveGaps].filter(
    (g) => g.severity === "critical",
  ).length;
  const moderateCount = [...offensiveGaps, ...defensiveGaps].filter(
    (g) => g.severity === "moderate",
  ).length;
  const totalGaps = offensiveGaps.length + defensiveGaps.length;

  if (totalGaps === 0) {
    return (
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-text-primary">Type Coverage</h3>
        <span className="font-mono text-xs text-state-alive">Full coverage</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <h3 className="font-display text-base font-semibold text-text-primary">Type Coverage</h3>
      <div className="flex gap-2 font-mono text-xs">
        {criticalCount > 0 && <span className="text-state-death">{criticalCount} critical</span>}
        {moderateCount > 0 && <span className="text-accent">{moderateCount} moderate</span>}
        <span className="text-text-muted">{totalGaps} gaps</span>
      </div>
    </div>
  );
}

/** For defense row: lower multiplier = better resistance = green */
function defensiveColor(multiplier: number): string {
  if (multiplier === 0) return "#5A8A5A"; // immune — best
  if (multiplier < 1) return "#5A8A5A"; // resists — green
  if (multiplier === 1) return "#8A8070"; // neutral — muted
  if (multiplier <= 2) return "#D4A843"; // weak — amber
  return "#C0392B"; // very weak — crimson
}

function severityOrder(severity: "critical" | "moderate" | "minor"): number {
  if (severity === "critical") return 0;
  if (severity === "moderate") return 1;
  return 2;
}
