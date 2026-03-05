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
      <div style={{ marginTop: 16 }}>
        <a
          href="/compare?a=flash&b=paged"
          style={{
            display: "inline-block",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94a3b8",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: "5px 14px",
            textDecoration: "none",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#38bdf8"; (e.currentTarget as HTMLAnchorElement).style.color = "#38bdf8"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1e293b"; (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8"; }}
        >
          ⇄ Compare mechanisms
        </a>
      </div>
    </div>
  );
}
