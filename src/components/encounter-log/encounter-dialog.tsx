"use client";

import { useState } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
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
import type { EncounterEntry } from "@/lib/game-data";
import { getPokemonName, getPokemonTypes } from "@/lib/pokemon";
import { generateId, saveEncounter, saveTeamPokemon } from "@/lib/storage";
import type { RunEncounter, RunPokemon } from "@/types/domain";

type Outcome = RunEncounter["outcome"];

interface EncounterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  routeName: string;
  runId: string;
  availablePokemon: EncounterEntry[];
  partySize: number;
  onComplete: () => void;
}

export function EncounterDialog({
  open,
  onOpenChange,
  routeId,
  routeName,
  runId,
  availablePokemon,
  partySize,
  onComplete,
}: EncounterDialogProps) {
  const [step, setStep] = useState<"select" | "outcome" | "caught">("select");
  const [selectedPokemon, setSelectedPokemon] = useState<EncounterEntry | null>(null);
  const [_outcome, setOutcome] = useState<Outcome>("caught");
  const [nickname, setNickname] = useState("");
  const [level, setLevel] = useState("");

  function reset() {
    setStep("select");
    setSelectedPokemon(null);
    setOutcome("caught");
    setNickname("");
    setLevel("");
  }

  function handleClose(newOpen: boolean) {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  }

  function handleSelectPokemon(entry: EncounterEntry) {
    setSelectedPokemon(entry);
    setLevel(String(entry.min_level));
    setNickname("");
    setStep("outcome");
  }

  function handleOutcome(chosen: Outcome) {
    setOutcome(chosen);
    if (chosen === "caught") {
      setStep("caught");
    } else {
      // Save encounter directly
      const encounter: RunEncounter = {
        id: generateId(),
        run_id: runId,
        route_id: routeId,
        pokemon_id: chosen === "none" ? undefined : selectedPokemon?.pokemon_id,
        outcome: chosen,
      };
      saveEncounter(encounter);
      onComplete();
      handleClose(false);
    }
  }

  function handleNoEncounter() {
    const encounter: RunEncounter = {
      id: generateId(),
      run_id: runId,
      route_id: routeId,
      pokemon_id: undefined,
      outcome: "none",
    };
    saveEncounter(encounter);
    onComplete();
    handleClose(false);
  }

  function handleCaught() {
    if (!selectedPokemon) return;
    const pokemonName = getPokemonName(selectedPokemon.pokemon_id);
    const caughtLevel = Number.parseInt(level, 10) || selectedPokemon.min_level;

    // Save encounter
    const encounter: RunEncounter = {
      id: generateId(),
      run_id: runId,
      route_id: routeId,
      pokemon_id: selectedPokemon.pokemon_id,
      outcome: "caught",
    };
    saveEncounter(encounter);

    // Save pokemon
    const pokemon: RunPokemon = {
      id: generateId(),
      run_id: runId,
      pokemon_id: selectedPokemon.pokemon_id,
      nickname: nickname.trim() || pokemonName,
      caught_at_route_id: routeId,
      caught_level: caughtLevel,
      current_level: caughtLevel,
      status: partySize < 6 ? "alive" : "boxed",
      slot_order: partySize < 6 ? partySize : undefined,
    };
    saveTeamPokemon(pokemon);

    onComplete();
    handleClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Encounter</DialogTitle>
          <DialogDescription>{routeName}</DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">Which Pokemon did you encounter?</p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {availablePokemon.map((entry) => {
                const types = getPokemonTypes(entry.pokemon_id);
                return (
                  <button
                    key={entry.pokemon_id}
                    type="button"
                    onClick={() => handleSelectPokemon(entry)}
                    className="flex w-full items-center gap-3 rounded-lg border border-text-muted/20 bg-surface-raised px-3 py-2 text-left transition-colors hover:bg-surface-overlay hover:border-accent/30"
                  >
                    <PokemonSprite
                      pokemonId={entry.pokemon_id}
                      name={getPokemonName(entry.pokemon_id)}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-text-primary flex-1">
                      {getPokemonName(entry.pokemon_id)}
                    </span>
                    <span className="flex items-center gap-1">
                      {types.map((t) => (
                        <TypeBadge key={t} type={t} />
                      ))}
                    </span>
                    <span className="font-mono text-xs text-text-muted">
                      Lv.{entry.min_level}-{entry.max_level}
                    </span>
                  </button>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={handleNoEncounter}>
                No Encounter
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "outcome" && selectedPokemon && (
          <div className="space-y-3">
            <p className="text-sm text-text-body">
              Encountered{" "}
              <span className="font-medium text-text-primary">
                {getPokemonName(selectedPokemon.pokemon_id)}
              </span>
              . What happened?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["caught", "Caught"],
                  ["fainted", "It Fainted"],
                  ["fled", "It Fled"],
                  ["duplicate_skipped", "Dupe (Skipped)"],
                ] as [Outcome, string][]
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={value === "caught" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleOutcome(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
                Back
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "caught" && selectedPokemon && (
          <div className="space-y-4">
            <p className="text-sm text-state-alive">
              You caught {getPokemonName(selectedPokemon.pokemon_id)}!{" "}
              {partySize >= 6 ? "(Will be sent to the Box)" : "(Added to party)"}
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="nickname" className="text-xs text-text-muted">
                  Nickname (optional)
                </label>
                <Input
                  id="nickname"
                  placeholder={getPokemonName(selectedPokemon.pokemon_id)}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="catch-level" className="text-xs text-text-muted">
                  Level
                </label>
                <Input
                  id="catch-level"
                  type="number"
                  min={1}
                  max={100}
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-24 font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setStep("outcome")}>
                Back
              </Button>
              <Button size="sm" onClick={handleCaught}>
                Add to Team
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
