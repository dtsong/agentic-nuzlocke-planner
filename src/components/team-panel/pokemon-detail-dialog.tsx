"use client";

import { useState } from "react";
import { RecoveryPanel } from "@/components/coverage-grid/recovery-panel";
import { TypeBadge } from "@/components/team-panel/type-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getPokemonName, getPokemonTypes } from "@/lib/pokemon";
import { saveTeamPokemon, updatePokemonStatus } from "@/lib/storage";
import type { RunPokemon } from "@/types/domain";

interface PokemonDetailDialogProps {
  pokemon: RunPokemon;
  currentRouteId: string;
  runId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  allPokemon?: RunPokemon[];
  gameId?: "fire-red" | "leaf-green";
  completedRouteIds?: string[];
  currentRouteOrder?: number;
}

export function PokemonDetailDialog({
  pokemon,
  currentRouteId,
  runId,
  open,
  onOpenChange,
  onUpdate,
  allPokemon,
  gameId,
  completedRouteIds,
  currentRouteOrder,
}: PokemonDetailDialogProps) {
  const [level, setLevel] = useState(String(pokemon.current_level));
  const [showDeathFlow, setShowDeathFlow] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [deathCause, setDeathCause] = useState("");
  const types = getPokemonTypes(pokemon.pokemon_id);
  const name = getPokemonName(pokemon.pokemon_id);

  function handleUpdateLevel() {
    const newLevel = Number.parseInt(level, 10);
    if (Number.isNaN(newLevel) || newLevel < 1) return;
    saveTeamPokemon({ ...pokemon, current_level: newLevel });
    onUpdate();
    onOpenChange(false);
  }

  function handleToggleBox() {
    const newStatus = pokemon.status === "boxed" ? "alive" : "boxed";
    updatePokemonStatus(runId, pokemon.id, newStatus);
    onUpdate();
    onOpenChange(false);
  }

  function handleFaint() {
    updatePokemonStatus(runId, pokemon.id, "fainted", {
      route_id: currentRouteId,
      cause: deathCause.trim() || "Unknown cause",
    });
    onUpdate();
    setShowDeathFlow(false);
    setDeathCause("");
    // Show recovery panel if we have the needed data
    if (allPokemon && gameId) {
      setShowRecovery(true);
    } else {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={showRecovery ? "sm:max-w-lg" : "sm:max-w-sm"}>
        <DialogHeader>
          <DialogTitle>
            {showRecovery
              ? `${pokemon.nickname !== name ? pokemon.nickname : name} has fallen`
              : pokemon.nickname !== name
                ? `${pokemon.nickname} (${name})`
                : name}
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2 pt-1">
              {types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </span>
          </DialogDescription>
        </DialogHeader>

        {showRecovery && allPokemon && gameId ? (
          <div className="space-y-4">
            <RecoveryPanel
              faintedPokemon={{ types }}
              remainingTeam={allPokemon
                .filter((p) => p.id !== pokemon.id && p.status === "alive")
                .map((p) => ({ types: getPokemonTypes(p.pokemon_id) }))}
              currentRouteOrder={currentRouteOrder ?? 0}
              gameId={gameId}
              completedRouteIds={completedRouteIds ?? []}
            />
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRecovery(false);
                  onOpenChange(false);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : showDeathFlow ? (
          <div className="space-y-3">
            <p className="text-sm text-state-death">
              Mark {pokemon.nickname} as fainted? This cannot be undone in a Nuzlocke.
            </p>
            <div className="space-y-1">
              <label htmlFor="death-cause" className="text-xs text-text-muted">
                Cause of death (optional)
              </label>
              <Input
                id="death-cause"
                placeholder="e.g. Crit from Brock's Onix"
                value={deathCause}
                onChange={(e) => setDeathCause(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowDeathFlow(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleFaint}>
                Confirm Death
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Level */}
            <div className="flex items-center gap-3">
              <label htmlFor="poke-level" className="text-sm text-text-muted whitespace-nowrap">
                Level
              </label>
              <Input
                id="poke-level"
                type="number"
                min={1}
                max={100}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-20 font-mono"
              />
              <Button size="sm" onClick={handleUpdateLevel}>
                Update
              </Button>
            </div>

            {/* Status info */}
            <div className="font-mono text-xs text-text-muted">
              Caught at Lv.{pokemon.caught_level}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {pokemon.status !== "fainted" && (
                <>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleToggleBox}>
                    {pokemon.status === "boxed" ? "Move to Party" : "Move to Box"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowDeathFlow(true)}
                  >
                    Mark as Fainted
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
