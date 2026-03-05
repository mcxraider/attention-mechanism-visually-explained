import type { Level } from "./mechanisms";
import type { CSSProperties } from "react";

export const GRID = 8;

export const levelColors: Record<Level, string> = {
  Beginner: "#4ade80",
  Intermediate: "#fbbf24",
  Advanced: "#f87171",
};

export function btn(bg: string, color: string): CSSProperties {
  return {
    padding: "5px 10px",
    borderRadius: 6,
    border: "none",
    background: bg,
    color,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    transition: "opacity 0.2s",
  };
}
