import type { MechanismKey, Mechanism } from "@/lib/mechanisms";

interface Props {
  tabs: [MechanismKey, Mechanism][];
  active: MechanismKey;
  onSelect: (key: MechanismKey) => void;
}

export default function MechanismTabs({ tabs, active, onSelect }: Props) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center",
      marginBottom: 28, maxWidth: 760, margin: "0 auto 28px",
    }}>
      {tabs.map(([key, m]) => (
        <button key={key} onClick={() => onSelect(key)} style={{
          padding: "7px 14px",
          borderRadius: 8,
          border: `1px solid ${active === key ? m.color : "#1e293b"}`,
          background: active === key ? m.color + "18" : "transparent",
          color: active === key ? m.color : "#475569",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: active === key ? 600 : 400,
          cursor: "pointer",
          letterSpacing: "0.04em",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}>
          {m.label.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
