"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { GameId } from "@/lib/game-data";
import { generateId, saveRun } from "@/lib/storage";
import type { NuzlockeRuleset, Run } from "@/types/domain";

export function NewRunDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState<GameId>("fire-red");
  const [ruleset, setRuleset] = useState<NuzlockeRuleset>({
    dupes_clause: true,
    species_clause: true,
    shiny_clause: false,
    level_caps: true,
    gift_clause: true,
    cave_per_floor: false,
    water_land_separate: true,
  });

  function handleCreate() {
    const run: Run = {
      id: generateId(),
      game_id: gameId,
      name: name.trim() || "My Nuzlocke Run",
      ruleset,
      status: "active",
      current_route_id: "pallet-town",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveRun(run);
    setOpen(false);
    router.push(`/run/${run.id}`);
  }

  function toggleRule(key: keyof NuzlockeRuleset) {
    setRuleset((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Begin a New Expedition</DialogTitle>
          <DialogDescription>
            Choose your game, name your run, and set your rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Game selection */}
          <div className="space-y-2">
            <span className="font-display text-sm font-medium text-text-primary">Game Version</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGameId("fire-red")}
                className={`rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-colors ${
                  gameId === "fire-red"
                    ? "border-accent bg-surface-overlay text-text-primary"
                    : "border-text-muted/20 bg-surface-raised text-text-muted hover:border-text-muted/40"
                }`}
              >
                <span className="font-display text-base">FireRed</span>
              </button>
              <button
                type="button"
                onClick={() => setGameId("leaf-green")}
                className={`rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-colors ${
                  gameId === "leaf-green"
                    ? "border-accent bg-surface-overlay text-text-primary"
                    : "border-text-muted/20 bg-surface-raised text-text-muted hover:border-text-muted/40"
                }`}
              >
                <span className="font-display text-base">LeafGreen</span>
              </button>
            </div>
          </div>

          {/* Run name */}
          <div className="space-y-2">
            <label
              htmlFor="run-name"
              className="font-display text-sm font-medium text-text-primary"
            >
              Run Name
            </label>
            <Input
              id="run-name"
              placeholder="My First Nuzlocke"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Ruleset toggles */}
          <div className="space-y-2">
            <span className="font-display text-sm font-medium text-text-primary">Rules</span>
            <div className="space-y-2">
              {(
                [
                  ["dupes_clause", "Dupes Clause", "Skip duplicate species in encounters"],
                  ["species_clause", "Species Clause", "Treat evolutions as the same species"],
                  ["shiny_clause", "Shiny Clause", "Shiny Pokemon may always be caught"],
                  ["level_caps", "Level Caps", "Enforce gym leader level caps"],
                  ["gift_clause", "Gift Clause", "Gifts don't consume location encounters"],
                  ["cave_per_floor", "Cave Per Floor", "Each cave floor is a separate encounter"],
                  ["water_land_separate", "Water/Land Separate", "Surf/fishing is separate from walking"],
                ] as const
              ).map(([key, label, desc]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleRule(key)}
                  className="flex w-full items-center justify-between rounded-md border border-text-muted/20 bg-surface-raised px-3 py-2 text-left transition-colors hover:bg-surface-overlay"
                >
                  <div>
                    <div className="text-sm font-medium text-text-body">{label}</div>
                    <div className="text-xs text-text-muted">{desc}</div>
                  </div>
                  <div
                    className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
                      ruleset[key] ? "bg-accent" : "bg-text-muted/30"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-surface transition-transform ${
                        ruleset[key] ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Start Run</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
