"use client";

import { getTypeColor } from "@/lib/type-colors";

export function TypeBadge({ type }: { type: string }) {
  const color = getTypeColor(type);
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `${color}25`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}
