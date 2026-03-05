import { isActive } from "@/lib/attention-logic";
import type { MechanismKey, Mechanism } from "@/lib/mechanisms";

interface Props {
  tabs: [MechanismKey, Mechanism][];
  active: MechanismKey;
  onSelect: (key: MechanismKey) => void;
}

export default function OverviewGrid({ tabs, active, onSelect }: Props) {
  return (
    <div style={{ maxWidth: 780, margin: "28px auto 0" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14, textAlign: "center" }}>
        All mechanisms at a glance
      </div>
      <div className="overview-grid">
        {tabs.map(([key, m]) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            background: active === key ? m.color + "14" : "#080f1a",
            border: `1px solid ${active === key ? m.color : "#1e293b"}`,
            borderRadius: 10, padding: "10px 6px",
            cursor: "pointer", transition: "all 0.2s",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5 }}>
              {Array.from({ length: 25 }).map((_, i) => {
                const r = Math.floor(i / 5);
                const c = i % 5;
                const a = key === "paged"
                  ? [0,1,2,3].some(s => isActive(r, c, key, s))
                  : isActive(r, c, key, 0);
                return (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: 1,
                    background: a ? m.color : "#0f1f35",
                    opacity: a ? 0.8 : 0.2,
                  }} />
                );
              })}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: active === key ? m.color : "#475569",
              textAlign: "center", lineHeight: 1.3,
            }}>
              {m.label.split(" ")[0]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
