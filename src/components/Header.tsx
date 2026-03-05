const TOKENS = ["A","t","t","e","n","t","i","o","n","·","M","e","c","h","a","n","i","s","m","s"];

const TW = 35;    // token box width
const TH = 40;    // token box height
const TG = 5;     // gap between tokens
const ARC_AREA = 120; // vertical space above tokens for arcs
const SVG_W = TOKENS.length * (TW + TG) - TG;
const SVG_H = ARC_AREA + TH;

const cx = (i: number) => i * (TW + TG) + TW / 2;

const ARCS: { from: number; to: number; color: string; opacity: number }[] = [
  { from: 0,  to: 19, color: "#38bdf8", opacity: 0.80 }, // A → s  (full span)
  { from: 0,  to: 8,  color: "#60a5fa", opacity: 0.65 }, // A → n  (Attention)
  { from: 10, to: 19, color: "#f472b6", opacity: 0.65 }, // M → s  (Mechanisms)
  { from: 8,  to: 10, color: "#34d399", opacity: 0.90 }, // n → M  (cross-word)
  { from: 4,  to: 13, color: "#f59e0b", opacity: 0.45 }, // t → h  (medium)
  { from: 1,  to: 3,  color: "#c084fc", opacity: 0.75 }, // t → e  (local)
  { from: 12, to: 14, color: "#c084fc", opacity: 0.65 }, // c → a  (local)
];

function arcPath(from: number, to: number): string {
  const x1 = cx(from);
  const x2 = cx(to);
  const midX = (x1 + x2) / 2;
  const h = Math.min((to - from) * 6.2, ARC_AREA - 8);
  return `M ${x1},${ARC_AREA} Q ${midX},${ARC_AREA - h} ${x2},${ARC_AREA}`;
}

function arrowHead(to: number, color: string, opacity: number) {
  const x = cx(to);
  const y = ARC_AREA;
  return (
    <polygon
      points={`${x - 5},${y - 9} ${x + 5},${y - 9} ${x},${y}`}
      fill={color}
      opacity={opacity}
    />
  );
}

import Link from "next/link";

export default function Header() {
  return (
    <div style={{ textAlign: "center", marginBottom: 45 }}>
      {/* Token arc visualisation */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, overflowX: "auto" }}>
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: "block" }}
        >
          {ARCS.map((arc, i) => (
            <g key={i}>
              <path
                d={arcPath(arc.from, arc.to)}
                fill="none"
                stroke={arc.color}
                strokeWidth={2}
                opacity={arc.opacity}
                strokeLinecap="round"
              />
              {arrowHead(arc.to, arc.color, arc.opacity)}
            </g>
          ))}

          {TOKENS.map((char, i) => {
            const isSep = char === "·";
            const x = i * (TW + TG);
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={ARC_AREA}
                  width={TW}
                  height={TH}
                  rx={4}
                  fill={isSep ? "transparent" : "#080f1a"}
                  stroke={isSep ? "none" : "#1e3a5f"}
                  strokeWidth={1}
                />
                <text
                  x={x + TW / 2}
                  y={ARC_AREA + TH / 2 + 6}
                  textAnchor="middle"
                  fill={isSep ? "#334155" : "#94a3b8"}
                  fontSize={isSep ? 13 : 17}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={isSep ? 400 : 500}
                >
                  {char}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Explained subtitle */}
      <div style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: 35,
        fontWeight: 300,
        color: "#64748b",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        marginBottom: 35,
      }}>
        Explained
      </div>

      {/* Compare link */}
      <div>
        <Link
          href="/compare?a=flash&b=paged"
          style={{
            display: "inline-block",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 15,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94a3b8",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: "8px 20px",
            textDecoration: "none",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "#38bdf8";
            (e.currentTarget as HTMLAnchorElement).style.color = "#38bdf8";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1e293b";
            (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
          }}
        >
          ⇄ Compare mechanisms
        </Link>
      </div>
    </div>
  );
}
