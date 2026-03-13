"use client";

import Link from "next/link";

export default function Footer() {
  const monoStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#334155",
  };

  const linkStyle: React.CSSProperties = {
    ...monoStyle,
    textDecoration: "none",
    transition: "color 0.15s",
    color: "#334155",
  };

  return (
    <footer style={{
      background: "#030b17",
      borderTop: "1px solid #0d1f35",
      padding: "28px 30px",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top row: site name + nav links */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ ...monoStyle, fontSize: 12, color: "#475569", letterSpacing: "0.08em" }}>
            Attention Mechanisms · Visually Explained
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            {([
              ["Home", "/"],
              ["Compare", "/compare?a=flash&b=paged"],
              ["Complexity", "/#complexity"],
            ] as [string, string][]).map(([label, href]) => (
              <Link
                key={label}
                href={href}
                style={linkStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#64748b"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#334155"; }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom row: copyright + tech credits */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={monoStyle}>© 2025 Attention Mechanisms Explained</span>
          <span style={{ ...monoStyle, color: "#1e293b" }}>
            Built with Next.js &amp; recharts
          </span>
        </div>
      </div>
    </footer>
  );
}
