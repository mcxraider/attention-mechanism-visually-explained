import type { Step } from "@/lib/mechanisms";
import { btn } from "@/lib/theme";

interface Props {
  step: number;
  steps: Step[];
  playing: boolean;
  color: string;
  onPrev: () => void;
  onNext: () => void;
  onSetStep: (i: number) => void;
  onTogglePlay: () => void;
}

export default function StepControls({ step, steps, playing, color, onPrev, onNext, onSetStep, onTogglePlay }: Props) {
  if (steps.length <= 1) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onPrev} style={btn("#0d1f35", "#94a3b8")}>←</button>
        {steps.map((_, i) => (
          <button key={i} onClick={() => onSetStep(i)} style={{
            width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
            background: i === step ? color : "#1e3a5f",
            padding: 0, transition: "background 0.2s",
          }} />
        ))}
        <button onClick={onTogglePlay} style={btn(color + "22", color)}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={onNext} style={btn("#0d1f35", "#94a3b8")}>→</button>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#334155" }}>
        ← → Space to navigate
      </div>
    </div>
  );
}
