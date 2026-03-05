"use client";

import { useState } from "react";

interface Props { term: string; def: string }

export default function TermPill({ term, def }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "transparent",
        border: "1px solid #1e3a5f",
        borderRadius: 6,
        padding: "4px 10px",
        color: "#7dd3fc",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "border-color 0.2s",
      }}>
        <span style={{ color: open ? "#38bdf8" : "#475569", fontSize: 10 }}>{open ? "▼" : "▶"}</span>
        {term}
      </button>
      {open && (
        <div style={{
          marginTop: 4,
          marginLeft: 10,
          padding: "8px 12px",
          background: "#0d1f35",
          borderRadius: 6,
          borderLeft: "2px solid #1e3a5f",
          fontSize: 12,
          color: "#94a3b8",
          lineHeight: 1.7,
          maxWidth: 360,
        }}>
          {def}
        </div>
      )}
    </div>
  );
}
