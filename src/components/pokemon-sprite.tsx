"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
} as const;

interface PokemonSpriteProps {
  pokemonId: number;
  name: string;
  size?: "sm" | "md" | "lg";
  fainted?: boolean;
  className?: string;
}

function getSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
}

export function PokemonSprite({
  pokemonId,
  name,
  size = "md",
  fainted = false,
  className,
}: PokemonSpriteProps) {
  const [hasError, setHasError] = useState(false);
  const px = SIZE_MAP[size];

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-surface-overlay font-mono text-text-muted",
          size === "sm" && "h-8 w-8 text-[9px]",
          size === "md" && "h-12 w-12 text-[10px]",
          size === "lg" && "h-16 w-16 text-xs",
          fainted && "opacity-50",
          className,
        )}
      >
        #{String(pokemonId).padStart(3, "0")}
      </div>
    );
  }

  return (
    <Image
      src={getSpriteUrl(pokemonId)}
      alt={name}
      width={px}
      height={px}
      className={cn(
        "[image-rendering:pixelated]",
        fainted && "saturate-0 brightness-[0.7]",
        className,
      )}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
