"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NewRunDialog } from "@/components/run-creation/new-run-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteRun, getAllRuns, getTeamPokemon } from "@/lib/storage";
import type { Run } from "@/types/domain";

/* ============================================
   Feature card data
   ============================================ */
const FEATURES = [
  {
    title: "Route Planning",
    description:
      "Plan your encounters across every route. Know what's available before you arrive.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-8 w-8 text-accent"
        role="img"
        aria-label="Route Planning"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Type Coverage",
    description: "See your team's strengths and weaknesses at a glance. Never be caught off guard.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-8 w-8 text-accent"
        role="img"
        aria-label="Type Coverage"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
  {
    title: "Boss Prep",
    description: "Analyze gym leader matchups. Know your recommended leads and biggest threats.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-8 w-8 text-accent"
        role="img"
        aria-label="Boss Prep"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308"
        />
      </svg>
    ),
  },
] as const;

/* ============================================
   Page
   ============================================ */
export default function Home() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRuns(getAllRuns());
  }, []);

  function handleDelete(id: string) {
    deleteRun(id);
    setRuns(getAllRuns());
  }

  const hasRuns = mounted && runs.length > 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle aged-paper background gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(212,168,67,0.08) 0%, transparent 70%), linear-gradient(180deg, #1A1410 0%, #2A2118 100%)",
          }}
        />

        <div
          className={`relative mx-auto max-w-3xl px-6 text-center ${hasRuns ? "py-16 sm:py-20" : "py-24 sm:py-32"}`}
        >
          {/* Decorative divider */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-accent/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent/70">
              Field Journal
            </span>
            <span className="h-px w-12 bg-accent/40" />
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Nuzlocke Route Planner
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-lg text-text-body sm:text-xl">
            Plan your encounters. Prepare for battles. Survive.
          </p>

          {/* CTA */}
          <div className="mt-8">
            <NewRunDialog>
              <Button size="lg" className="font-display text-base">
                {hasRuns ? "Start Another Run" : "Start Your First Run"}
              </Button>
            </NewRunDialog>
          </div>
        </div>
      </section>

      {/* Features — shown when no runs, or as a condensed strip when runs exist */}
      {!hasRuns && (
        <section className="border-t border-text-muted/10 bg-surface-raised/50">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
            <div className="grid gap-8 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-accent/20 bg-surface-overlay">
                    {feature.icon}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Existing runs */}
      {hasRuns && (
        <section className="border-t border-text-muted/10">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">
                  Your Expeditions
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {runs.length} run{runs.length !== 1 ? "s" : ""} logged
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} onDelete={() => handleDelete(run.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-text-muted/10 bg-surface-raised/30">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center">
          <p className="font-mono text-xs text-text-muted">
            A fan project. Pokemon is &copy; Nintendo / Game Freak / Creatures Inc.
          </p>
          <p className="mt-2 font-mono text-xs text-text-muted">
            v0.1.0 &mdash; Field Journal Edition
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ============================================
   Run card
   ============================================ */
function RunCard({ run, onDelete }: { run: Run; onDelete: () => void }) {
  const pokemon = getTeamPokemon(run.id);
  const alive = pokemon.filter((p) => p.status === "alive").length;
  const dead = pokemon.filter((p) => p.status === "fainted").length;
  const total = pokemon.length;

  const gameLabel = run.game_id === "fire-red" ? "FireRed" : "LeafGreen";
  const statusVariant =
    run.status === "active" ? "alive" : run.status === "failed" ? "fainted" : "boxed";

  return (
    <Card className="transition-colors hover:border-accent/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{run.name}</CardTitle>
          <Badge variant={statusVariant} className="capitalize">
            {run.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-4 font-mono text-xs text-text-muted">
          <span>{gameLabel}</span>
          <span className="text-state-alive">{alive} alive</span>
          <span>{total} caught</span>
          {dead > 0 && <span className="text-state-death">{dead} dead</span>}
        </div>
        <div className="mt-1 text-xs text-text-muted">
          Started {new Date(run.created_at).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        <Link href={`/run/${run.id}`}>
          <Button size="sm" variant="default">
            Continue
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-state-death hover:text-state-death"
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
