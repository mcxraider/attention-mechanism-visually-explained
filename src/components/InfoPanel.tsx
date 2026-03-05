import type { Mechanism } from "@/lib/mechanisms";
import TermPill from "./TermPill";

interface Props { mech: Mechanism }

export default function InfoPanel({ mech }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
          Intuition
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "#cbd5e1", fontStyle: "italic" }}>
          &ldquo;{mech.analogy}&rdquo;
        </p>
      </div>

      <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
          How it works
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "#94a3b8" }}>
          {mech.whatIs}
        </p>
      </div>

      <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
          Key terms — click to expand
        </div>
        {mech.keyTerms.map(({ term, def }) => <TermPill key={term} term={term} def={def} />)}
      </div>

      <div style={{ background: "#080f1a", border: `1px solid ${mech.color}33`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: mech.color, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
          Trade-offs
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "#94a3b8" }}>
          {mech.tradeoff}
        </p>
        <div style={{ marginTop: 10, fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
          Used in: <span style={{ color: mech.color }}>{mech.usedIn}</span>
        </div>
      </div>
    </div>
  );
}
