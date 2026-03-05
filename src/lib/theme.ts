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
    padding: "6px 13px",
    borderRadius: 6,
    border: "none",
    background: bg,
    color,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 15,
    transition: "opacity 0.2s",
  };
}
