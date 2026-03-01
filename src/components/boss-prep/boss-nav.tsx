"use client";

import Link from "next/link";
import type { BossEntry } from "@/lib/game-data";
import { getTypeColor } from "@/lib/type-colors";

interface BossNavProps {
  bosses: BossEntry[];
  runId: string;
}

function getBossTypeLabel(type: string): string {
  switch (type) {
    case "gym_leader":
      return "Gym";
    case "elite_four":
      return "E4";
    case "champion":
      return "Champ";
    case "rival":
      return "Rival";
    default:
      return type;
  }
}

export function BossNav({ bosses, runId }: BossNavProps) {
  const gymLeaders = bosses.filter((b) => b.type === "gym_leader");
  const eliteFour = bosses.filter((b) => b.type === "elite_four");
  const champion = bosses.filter((b) => b.type === "champion");
  const rivals = bosses.filter((b) => b.type === "rival");

  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-semibold text-text-primary">Boss Prep</h3>

      {/* Gym Leaders */}
      {gymLeaders.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">
            Gym Leaders
          </p>
          <div className="space-y-1">
            {gymLeaders
              .sort((a, b) => (a.badge_number ?? 0) - (b.badge_number ?? 0))
              .map((boss) => (
                <BossNavItem key={boss.id} boss={boss} runId={runId} />
              ))}
          </div>
        </div>
      )}

      {/* Elite Four */}
      {eliteFour.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">
            Elite Four
          </p>
          <div className="space-y-1">
            {eliteFour.map((boss) => (
              <BossNavItem key={boss.id} boss={boss} runId={runId} />
            ))}
          </div>
        </div>
      )}

      {/* Champion */}
      {champion.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">
            Champion
          </p>
          <div className="space-y-1">
            {champion.map((boss) => (
              <BossNavItem key={boss.id} boss={boss} runId={runId} />
            ))}
          </div>
        </div>
      )}

      {/* Rivals */}
      {rivals.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">
            Rival Fights
          </p>
          <div className="space-y-1">
            {rivals.map((boss) => (
              <BossNavItem key={boss.id} boss={boss} runId={runId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BossNavItem({ boss, runId }: { boss: BossEntry; runId: string }) {
  const specialtyColor = boss.specialty_type ? getTypeColor(boss.specialty_type) : undefined;

  return (
    <Link
      href={`/run/${runId}/boss/${boss.id}`}
      className="flex items-center gap-3 rounded-lg border border-text-muted/15 bg-surface-raised px-3 py-2 transition-colors hover:bg-surface-overlay hover:border-text-muted/30"
    >
      {/* Badge number or type icon */}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-overlay font-mono text-[10px] font-bold text-text-muted">
        {boss.badge_number ?? getBossTypeLabel(boss.type).charAt(0)}
      </span>

      {/* Name */}
      <span className="flex-1 text-sm text-text-body truncate">{boss.name}</span>

      {/* Specialty type indicator */}
      {specialtyColor && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: specialtyColor }}
          title={boss.specialty_type}
        />
      )}

      {/* Arrow */}
      <span className="text-text-muted text-xs">&rsaquo;</span>
    </Link>
  );
}
