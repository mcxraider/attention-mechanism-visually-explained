"use client";

import { useState } from "react";

interface Props { term: string; def: string }

export default function TermPill({ term, def }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "transparent",
        border: "1px solid #1e3a5f",
        borderRadius: 7,
        padding: "5px 13px",
        color: "#7dd3fc",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "border-color 0.2s",
      }}>
        <span style={{ color: open ? "#38bdf8" : "#475569", fontSize: 13 }}>{open ? "▼" : "▶"}</span>
        {term}
      </button>
      {open && (
        <div style={{
          marginTop: 5,
          marginLeft: 13,
          padding: "10px 15px",
          background: "#0d1f35",
          borderRadius: 7,
          borderLeft: "2px solid #1e3a5f",
          fontSize: 13,
          color: "#94a3b8",
          lineHeight: 1.75,
          maxWidth: 450,
        }}>
          {def}
        </div>
      )}
    </div>
  );
}
