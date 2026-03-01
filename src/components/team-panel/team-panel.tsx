"use client";

import { useState } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { PokemonDetailDialog } from "@/components/team-panel/pokemon-detail-dialog";
import { TypeBadge } from "@/components/team-panel/type-badge";
import { Badge } from "@/components/ui/badge";
import { getPokemonName, getPokemonTypes } from "@/lib/pokemon";
import type { RunPokemon } from "@/types/domain";

interface TeamPanelProps {
  pokemon: RunPokemon[];
  currentRouteId: string;
  runId: string;
  onUpdate: () => void;
  gameId?: "fire-red" | "leaf-green";
  completedRouteIds?: string[];
  currentRouteOrder?: number;
}

export function TeamPanel({
  pokemon,
  currentRouteId,
  runId,
  onUpdate,
  gameId,
  completedRouteIds,
  currentRouteOrder,
}: TeamPanelProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<RunPokemon | null>(null);
  const [showBoxed, setShowBoxed] = useState(false);

  const party = pokemon
    .filter((p) => p.status === "alive")
    .sort((a, b) => (a.slot_order ?? 99) - (b.slot_order ?? 99));
  const boxed = pokemon.filter((p) => p.status === "boxed");
  const fainted = pokemon.filter((p) => p.status === "fainted");

  const aliveCount = party.length;
  const totalCaught = pokemon.length;
  const deathCount = fainted.length;

  const emptySlots = Math.max(0, 6 - party.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Quick stats */}
      <div className="flex items-center justify-between border-b border-text-muted/20 pb-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">Party</h2>
        <div className="flex gap-3 font-mono text-xs">
          <span className="text-state-alive">{aliveCount} alive</span>
          <span className="text-text-muted">{totalCaught} caught</span>
          {deathCount > 0 && <span className="text-state-death">{deathCount} dead</span>}
        </div>
      </div>

      {/* Party slots */}
      <div className="space-y-2">
        {party.map((p) => (
          <PokemonCard key={p.id} pokemon={p} onClick={() => setSelectedPokemon(p)} />
        ))}
        {emptySlots > 0 &&
          ["slot-a", "slot-b", "slot-c", "slot-d", "slot-e", "slot-f"]
            .slice(0, emptySlots)
            .map((key) => (
              <div
                key={key}
                className="flex h-16 items-center justify-center rounded-lg border border-dashed border-text-muted/20 text-xs text-text-muted"
              >
                Empty slot
              </div>
            ))}
      </div>

      {/* Boxed section */}
      {boxed.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowBoxed(!showBoxed)}
            className="flex w-full items-center justify-between py-2 text-sm text-text-muted hover:text-text-body transition-colors"
          >
            <span className="font-display">Box ({boxed.length})</span>
            <span className="text-xs">{showBoxed ? "Hide" : "Show"}</span>
          </button>
          {showBoxed && (
            <div className="space-y-1.5">
              {boxed.map((p) => (
                <PokemonCard key={p.id} pokemon={p} compact onClick={() => setSelectedPokemon(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fainted section */}
      {fainted.length > 0 && (
        <div>
          <div className="py-2 text-sm text-state-death">
            <span className="font-display">Fallen ({fainted.length})</span>
          </div>
          <div className="space-y-1.5">
            {fainted.map((p) => (
              <PokemonCard key={p.id} pokemon={p} compact onClick={() => setSelectedPokemon(p)} />
            ))}
          </div>
        </div>
      )}

      {/* Detail dialog */}
      {selectedPokemon && (
        <PokemonDetailDialog
          pokemon={selectedPokemon}
          currentRouteId={currentRouteId}
          runId={runId}
          open={!!selectedPokemon}
          onOpenChange={(open) => {
            if (!open) setSelectedPokemon(null);
          }}
          onUpdate={onUpdate}
          allPokemon={pokemon}
          gameId={gameId}
          completedRouteIds={completedRouteIds}
          currentRouteOrder={currentRouteOrder}
        />
      )}
    </div>
  );
}

function PokemonCard({
  pokemon,
  compact,
  onClick,
}: {
  pokemon: RunPokemon;
  compact?: boolean;
  onClick: () => void;
}) {
  const name = getPokemonName(pokemon.pokemon_id);
  const types = getPokemonTypes(pokemon.pokemon_id);
  const isFainted = pokemon.status === "fainted";
  const isBoxed = pokemon.status === "boxed";

  const borderColor = isFainted
    ? "border-state-death/40"
    : isBoxed
      ? "border-state-boxed/30"
      : "border-state-alive/40";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border bg-surface-raised px-3 text-left transition-colors hover:bg-surface-overlay ${borderColor} ${compact ? "py-1.5" : "py-2.5"} ${isFainted ? "animate-death" : ""}`}
    >
      {/* Pokemon sprite */}
      <PokemonSprite
        pokemonId={pokemon.pokemon_id}
        name={name}
        size={compact ? "sm" : "md"}
        fainted={isFainted}
      />

      {/* Name and info */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium truncate ${isFainted ? "text-state-death line-through" : "text-text-primary"}`}
        >
          {pokemon.nickname !== name ? pokemon.nickname : name}
        </div>
        {!compact && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        )}
      </div>

      {/* Level */}
      <span className="font-mono text-xs text-text-muted whitespace-nowrap">
        Lv.{pokemon.current_level}
      </span>

      {/* Status badge */}
      {isFainted && (
        <Badge variant="fainted" className="text-[10px]">
          RIP
        </Badge>
      )}
      {isBoxed && (
        <Badge variant="boxed" className="text-[10px]">
          BOX
        </Badge>
      )}
    </button>
  );
}
