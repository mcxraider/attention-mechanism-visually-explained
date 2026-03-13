import { isActive } from "@/lib/attention-logic";
import type { MechanismKey, Mechanism } from "@/lib/mechanisms";

interface Props {
  tabs: [MechanismKey, Mechanism][];
  active: MechanismKey;
  onSelect: (key: MechanismKey) => void;
  vertical?: boolean;
}

export default function OverviewGrid({ tabs, active, onSelect, vertical }: Props) {
  if (vertical) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tabs.map(([key, m]) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            background: active === key ? m.color + "18" : "#080f1a",
            border: `1px solid ${active === key ? m.color : "#1e293b"}`,
            borderRadius: 10,
            padding: "12px 10px",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            textAlign: "left",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, flexShrink: 0 }}>
              {Array.from({ length: 16 }).map((_, i) => {
                const r = Math.floor(i / 4);
                const c = i % 4;
                const a = key === "paged"
                  ? [0, 1, 2, 3].some(s => isActive(r, c, key, s))
                  : isActive(r, c, key, 0);
                return (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: 1,
                    background: a ? m.color : "#0f1f35",
                    opacity: a ? 0.85 : 0.2,
                  }} />
                );
              })}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: active === key ? m.color : "#475569",
              lineHeight: 1.2,
            }}>
              {m.label.split(" ")[0]}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto 40px" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20, textAlign: "center" }}>
        All mechanisms at a glance
      </div>
      <div className="overview-grid">
        {tabs.map(([key, m]) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            background: active === key ? m.color + "14" : "#080f1a",
            border: `1px solid ${active === key ? m.color : "#1e293b"}`,
            borderRadius: 14, padding: "18px 10px",
            cursor: "pointer", transition: "all 0.2s",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2.5 }}>
              {Array.from({ length: 25 }).map((_, i) => {
                const r = Math.floor(i / 5);
                const c = i % 5;
                const a = key === "paged"
                  ? [0,1,2,3].some(s => isActive(r, c, key, s))
                  : isActive(r, c, key, 0);
                return (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: a ? m.color : "#0f1f35",
                    opacity: a ? 0.8 : 0.2,
                  }} />
                );
              })}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
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
