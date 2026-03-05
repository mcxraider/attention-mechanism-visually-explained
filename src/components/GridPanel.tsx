import type { Mechanism, MechanismKey } from "@/lib/mechanisms";
import { levelColors, GRID } from "@/lib/theme";
import AttentionGrid from "./AttentionGrid";
import StepControls from "./StepControls";

interface Props {
  mech: Mechanism;
  active: MechanismKey;
  step: number;
  playing: boolean;
  activeRow: number | null;
  onPrev: () => void;
  onNext: () => void;
  onSetStep: (i: number) => void;
  onTogglePlay: () => void;
}

export default function GridPanel({ mech, active, step, playing, activeRow, onPrev, onNext, onSetStep, onTogglePlay }: Props) {
  return (
    <div style={{
      background: "#080f1a",
      border: `1px solid ${mech.color}33`,
      borderRadius: 14,
      padding: 20,
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>
          Attention pattern
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: mech.color, letterSpacing: "-0.02em" }}>
            {mech.label}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            background: levelColors[mech.level] + "22",
            border: `1px solid ${levelColors[mech.level]}55`,
            borderRadius: 10, padding: "2px 8px",
            color: levelColors[mech.level],
            whiteSpace: "nowrap",
          }}>{mech.level}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>{mech.shortDesc}</div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            background: mech.color + "18",
            border: `1px solid ${mech.color}44`,
            borderRadius: 4, padding: "2px 6px",
            color: mech.color,
            whiteSpace: "nowrap",
          }}>{mech.complexity}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <div style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "#334155",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}>
          ↑ Queries ↑
        </div>
        <AttentionGrid type={active} step={step} color={mech.color} size={GRID} activeRow={activeRow} />
      </div>

      <div style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155" }}>
        ← tokens (Keys) →
      </div>

      <div style={{
        background: "#0d1f35",
        borderRadius: 8,
        padding: "12px 14px",
        borderLeft: `3px solid ${mech.color}`,
        minHeight: 70,
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: mech.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          {mech.steps[step].label}
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#94a3b8" }}>
          {mech.steps[step].desc}
        </p>
      </div>

      <StepControls
        step={step}
        steps={mech.steps}
        playing={playing}
        color={mech.color}
        onPrev={onPrev}
        onNext={onNext}
        onSetStep={onSetStep}
        onTogglePlay={onTogglePlay}
      />
    </div>
  );
}
