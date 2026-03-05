export default function Header() {
  return (
    <div style={{ textAlign: "center", marginBottom: 36 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.25em", color: "#334155", textTransform: "uppercase", marginBottom: 12 }}>
        Interactive Reference
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        Attention Mechanisms
        <span style={{ display: "block", fontSize: 14, fontWeight: 300, color: "#64748b", marginTop: 6, letterSpacing: "0.01em" }}>
          Click any mechanism to explore how it works
        </span>
      </h1>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#334155", marginTop: 10, letterSpacing: "0.02em" }}>
        New to attention? Start with Dense → Local → Sparse → Flash
      </div>
    </div>
  );
}
