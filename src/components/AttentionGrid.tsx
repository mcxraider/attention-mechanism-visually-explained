import { isActive } from "@/lib/attention-logic";
import type { MechanismKey } from "@/lib/mechanisms";

interface Props {
  type: MechanismKey;
  step: number;
  color: string;
  size?: number;
  activeRow?: number | null;
}

export default function AttentionGrid({ type, step, color, size = 8, activeRow = null }: Props) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${size}, 1fr)`,
      gap: 2,
      padding: 8,
      background: "#080f1a",
      borderRadius: 8,
      border: `1px solid ${color}33`,
    }}>
      {Array.from({ length: size * size }).map((_, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const active = isActive(r, c, type, step);
        const isHighlightedRow = activeRow !== null && r === activeRow;
        return (
          <div key={i} style={{
            width: 20, height: 20,
            borderRadius: 2,
            background: active ? color : (isHighlightedRow ? "#1a3a5c" : "#0f1f35"),
            opacity: active ? (isHighlightedRow ? 1.0 : 0.9) : (isHighlightedRow ? 0.5 : 0.25),
            transition: "all 0.35s ease",
            boxShadow: active
              ? `0 0 4px ${color}66`
              : (isHighlightedRow ? `inset 0 1px 0 ${color}88` : "none"),
          }} />
        );
      })}
    </div>
  );
}
