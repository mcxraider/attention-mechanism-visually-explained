import { MECHANISMS } from "@/lib/mechanisms";

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const mech of Object.values(MECHANISMS)) {
    for (const { term } of mech.keyTerms) {
      slugs.add(term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }
  return Array.from(slugs).map(id => ({ id }));
}

export default async function TermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div style={{
      minHeight: "100vh",
      background: "#030b17",
      fontFamily: "'Sora', sans-serif",
      color: "#e2e8f0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 32,
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.25em", color: "#334155", textTransform: "uppercase" }}>
        Term
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#60a5fa", letterSpacing: "-0.02em" }}>
        {id.replace(/-/g, " ")}
      </h1>
      <p style={{ fontSize: 14, color: "#475569", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
        Coming soon — term definitions pages are under construction.
      </p>
      <a href="/" style={{
        marginTop: 8,
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid #1e293b",
        background: "transparent",
        color: "#60a5fa",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        textDecoration: "none",
        cursor: "pointer",
      }}>
        ← Back to explorer
      </a>
    </div>
  );
}
