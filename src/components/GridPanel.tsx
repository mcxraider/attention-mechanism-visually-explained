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
      borderRadius: 16,
      padding: 30,
      display: "flex", flexDirection: "column", gap: 22,
    }}>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>
          Attention pattern
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3, flexWrap: "wrap" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: mech.color, letterSpacing: "-0.02em" }}>
            {mech.label}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            background: levelColors[mech.level] + "22",
            border: `1px solid ${levelColors[mech.level]}55`,
            borderRadius: 10, padding: "3px 10px",
            color: levelColors[mech.level],
            whiteSpace: "nowrap",
          }}>{mech.level}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 16, color: "#64748b", fontStyle: "italic" }}>{mech.shortDesc}</div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            background: mech.color + "18",
            border: `1px solid ${mech.color}44`,
            borderRadius: 4, padding: "2px 8px",
            color: mech.color,
            whiteSpace: "nowrap",
          }}>{mech.complexity}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        <div style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: "#334155",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}>
          ↑ Queries ↑
        </div>
        <AttentionGrid type={active} step={step} color={mech.color} size={GRID} activeRow={activeRow} cellSize={45} />
      </div>

      <div style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#334155" }}>
        ← tokens (Keys) →
      </div>

      <div style={{
        background: "#0d1f35",
        borderRadius: 10,
        padding: "18px 20px",
        borderLeft: `3px solid ${mech.color}`,
        minHeight: 100,
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: mech.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 9 }}>
          {mech.steps[step].label}
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85, color: "#94a3b8" }}>
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
