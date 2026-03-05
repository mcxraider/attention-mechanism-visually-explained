"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MECHANISMS, MechanismKey } from "@/lib/mechanisms";
import { getActiveRow } from "@/lib/attention-logic";
import AttentionGrid from "@/components/AttentionGrid";

const MECH_KEYS = Object.keys(MECHANISMS) as MechanismKey[];

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const sora: React.CSSProperties = { fontFamily: "'Sora', sans-serif" };

function Selector({
  value,
  exclude,
  onChange,
  color,
}: {
  value: MechanismKey;
  exclude: MechanismKey;
  onChange: (k: MechanismKey) => void;
  color: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as MechanismKey)}
      style={{
        ...mono,
        fontSize: 15,
        fontWeight: 600,
        background: "#080f1a",
        color,
        border: `1px solid ${color}55`,
        borderRadius: 8,
        padding: "8px 16px",
        cursor: "pointer",
        outline: "none",
        appearance: "none",
        paddingRight: 34,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
    >
      {MECH_KEYS.filter(k => k !== exclude).map(k => (
        <option key={k} value={k}>
          {MECHANISMS[k].label}
        </option>
      ))}
    </select>
  );
}

function StepDots({
  total,
  current,
  color,
  onSelect,
}: {
  total: number;
  current: number;
  color: string;
  onSelect: (i: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          style={{
            width: i === current ? 22 : 8,
            height: 8,
            borderRadius: 4,
            border: "none",
            background: i === current ? color : "#1e293b",
            cursor: "pointer",
            padding: 0,
            transition: "all 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}

function MechPanel({
  mechKey,
  step,
  playing,
  onPrev,
  onNext,
  onSetStep,
  onTogglePlay,
}: {
  mechKey: MechanismKey;
  step: number;
  playing: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSetStep: (i: number) => void;
  onTogglePlay: () => void;
}) {
  const mech = MECHANISMS[mechKey];
  const maxStep = mech.steps.length - 1;
  const clampedStep = Math.min(step, maxStep);
  const activeRow = getActiveRow(mechKey, clampedStep);
  const currentStep = mech.steps[clampedStep];

  return (
    <div
      style={{
        background: "#060d18",
        border: `1px solid ${mech.color}33`,
        borderRadius: 14,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Mechanism name */}
      <div>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", color: "#334155", textTransform: "uppercase", marginBottom: 4 }}>
          Attention pattern
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: mech.color, letterSpacing: "-0.02em" }}>
          {mech.label}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", marginTop: 2 }}>
          {mech.shortDesc}
        </div>
      </div>

      {/* What it solves */}
      <div
        style={{
          borderLeft: `3px solid ${mech.color}`,
          paddingLeft: 12,
          paddingTop: 7,
          paddingBottom: 7,
          background: `${mech.color}0d`,
          borderRadius: "0 6px 6px 0",
        }}
      >
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", color: mech.color, textTransform: "uppercase", marginBottom: 3 }}>
          What it solves
        </div>
        <div style={{ ...sora, fontSize: 13, color: "#cbd5e1" }}>{mech.solves}</div>
      </div>

      {/* Grid + step info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...mono, fontSize: 11, color: "#475569", letterSpacing: "0.12em" }}>
            STEP {clampedStep + 1} / {maxStep + 1}
          </span>
          <StepDots total={maxStep + 1} current={clampedStep} color={mech.color} onSelect={onSetStep} />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <AttentionGrid type={mechKey} step={clampedStep} color={mech.color} size={8} activeRow={activeRow} cellSize={24} />
        </div>

        <div
          style={{
            background: "#0d1f35",
            borderRadius: 8,
            padding: "10px 12px",
            borderLeft: `3px solid ${mech.color}`,
            minHeight: 64,
          }}
        >
          <div style={{ ...mono, fontSize: 10, color: mech.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>
            {currentStep.label}
          </div>
          <div style={{ ...sora, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
            {currentStep.desc}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={onPrev}
          disabled={clampedStep === 0}
          style={{
            ...mono,
            fontSize: 12,
            padding: "6px 14px",
            borderRadius: 6,
            border: `1px solid ${clampedStep === 0 ? "#1e293b" : mech.color + "55"}`,
            background: "transparent",
            color: clampedStep === 0 ? "#334155" : mech.color,
            cursor: clampedStep === 0 ? "default" : "pointer",
          }}
        >
          ← Prev
        </button>
        <button
          onClick={onTogglePlay}
          style={{
            ...mono,
            fontSize: 12,
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            background: playing ? mech.color : `${mech.color}22`,
            color: playing ? "#000" : mech.color,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {playing ? "■ Pause" : "▶ Play"}
        </button>
        <button
          onClick={onNext}
          disabled={clampedStep === maxStep}
          style={{
            ...mono,
            fontSize: 12,
            padding: "6px 14px",
            borderRadius: 6,
            border: `1px solid ${clampedStep === maxStep ? "#1e293b" : mech.color + "55"}`,
            background: "transparent",
            color: clampedStep === maxStep ? "#334155" : mech.color,
            cursor: clampedStep === maxStep ? "default" : "pointer",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

const TABLE_ROWS: Array<{ key: keyof typeof MECHANISMS["dense"]; label: string }> = [
  { key: "solves",        label: "SOLVES" },
  { key: "mechanismDesc", label: "MECHANISM" },
  { key: "mathOutput",    label: "MATH OUTPUT" },
  { key: "complexity",    label: "COMPLEXITY" },
  { key: "usedDuring",    label: "USED DURING" },
];

export default function CompareView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramA = (searchParams.get("a") ?? "flash") as MechanismKey;
  const paramB = (searchParams.get("b") ?? "paged") as MechanismKey;

  const [mechA, setMechA] = useState<MechanismKey>(MECH_KEYS.includes(paramA) ? paramA : "flash");
  const [mechB, setMechB] = useState<MechanismKey>(MECH_KEYS.includes(paramB) ? paramB : "paged");
  const [stepA, setStepA] = useState(0);
  const [stepB, setStepB] = useState(0);
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);
  const [syncPlaying, setSyncPlaying] = useState(false);

  const mA = MECHANISMS[mechA];
  const mB = MECHANISMS[mechB];

  // Refs so the sync interval can read current steps without stale closures
  const stepARef = useRef(stepA);
  const stepBRef = useRef(stepB);
  stepARef.current = stepA;
  stepBRef.current = stepB;

  useEffect(() => { setStepA(0); setPlayingA(false); setSyncPlaying(false); }, [mechA]);
  useEffect(() => { setStepB(0); setPlayingB(false); setSyncPlaying(false); }, [mechB]);

  // Individual play intervals (only run when syncPlaying is off)
  useEffect(() => {
    if (!playingA || syncPlaying) return;
    const maxStep = mA.steps.length - 1;
    const id = setInterval(() => setStepA(s => s >= maxStep ? 0 : s + 1), 1200);
    return () => clearInterval(id);
  }, [playingA, syncPlaying, mA.steps.length]);

  useEffect(() => {
    if (!playingB || syncPlaying) return;
    const maxStep = mB.steps.length - 1;
    const id = setInterval(() => setStepB(s => s >= maxStep ? 0 : s + 1), 1200);
    return () => clearInterval(id);
  }, [playingB, syncPlaying, mB.steps.length]);

  // Sync interval: both advance together; shorter one waits at its last step
  // until the longer one finishes, then both reset and loop
  useEffect(() => {
    if (!syncPlaying) return;
    const maxA = mA.steps.length - 1;
    const maxB = mB.steps.length - 1;
    const id = setInterval(() => {
      const a = stepARef.current;
      const b = stepBRef.current;
      if (a >= maxA && b >= maxB) {
        // Both finished — reset and start next cycle
        setStepA(0);
        setStepB(0);
      } else {
        if (a < maxA) setStepA(s => s + 1);
        if (b < maxB) setStepB(s => s + 1);
      }
    }, 1200);
    return () => clearInterval(id);
  }, [syncPlaying, mA.steps.length, mB.steps.length]);

  function updateMechA(k: MechanismKey) {
    setMechA(k);
    router.replace(`/compare?a=${k}&b=${mechB}`);
  }
  function updateMechB(k: MechanismKey) {
    setMechB(k);
    router.replace(`/compare?a=${mechA}&b=${k}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030b17", ...sora, color: "#e2e8f0", padding: "40px 24px 100px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Back link */}
        <div style={{ marginBottom: 36 }}>
          <a href="/" style={{ ...mono, fontSize: 12, color: "#475569", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← Back to explorer
          </a>
        </div>

        {/* Centered title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.25em", color: "#334155", textTransform: "uppercase", marginBottom: 12 }}>
            Side-by-side comparison
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
            How{" "}
            <span style={{ color: mA.color }}>{mA.label}</span>
            {" & "}
            <span style={{ color: mB.color }}>{mB.label}</span>
            {" "}work
          </h1>
        </div>

        {/* Centered selector row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          <Selector value={mechA} exclude={mechB} onChange={updateMechA} color={mA.color} />
          <span style={{ ...mono, fontSize: 14, color: "#475569" }}>vs</span>
          <Selector value={mechB} exclude={mechA} onChange={updateMechB} color={mB.color} />
        </div>

        {/* Dense baseline card — centered */}
        <div
          style={{
            border: "1px solid #1e293b",
            borderRadius: 14,
            padding: "20px 28px",
            marginBottom: 36,
            background: "#060d18",
          }}
        >
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.25em", color: "#475569", textTransform: "uppercase", marginBottom: 14 }}>
            The Problem — Dense Baseline
          </div>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <AttentionGrid type="dense" step={8} color={MECHANISMS.dense.color} size={8} cellSize={20} />
            <div style={{ flex: 1, minWidth: 220, maxWidth: 540 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: MECHANISMS.dense.color, marginBottom: 6 }}>
                {MECHANISMS.dense.shortDesc}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.75 }}>
                {MECHANISMS.dense.whatIs.split(".")[0]}. {MECHANISMS.dense.whatIs.split(".")[1]}.
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 12,
                  color: "#f87171",
                  marginTop: 10,
                  padding: "4px 10px",
                  background: "#f8717108",
                  border: "1px solid #f8717122",
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                {MECHANISMS.dense.complexity} — every other mechanism tries to beat this
              </div>
            </div>
          </div>
        </div>

        {/* Play Both button */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <button
            onClick={() => {
              if (syncPlaying) {
                setSyncPlaying(false);
              } else {
                setPlayingA(false);
                setPlayingB(false);
                setStepA(0);
                setStepB(0);
                setSyncPlaying(true);
              }
            }}
            style={{
              ...mono,
              fontSize: 13,
              fontWeight: 600,
              padding: "10px 28px",
              borderRadius: 8,
              border: `1px solid ${syncPlaying ? "#475569" : "#38bdf855"}`,
              background: syncPlaying ? "#1e293b" : "#38bdf812",
              color: syncPlaying ? "#94a3b8" : "#38bdf8",
              cursor: "pointer",
              letterSpacing: "0.06em",
              transition: "all 0.2s",
            }}
          >
            {syncPlaying ? "■ Pause Both" : "▶ Play Both"}
          </button>
        </div>

        {/* Side-by-side mechanism panels */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <MechPanel
            mechKey={mechA}
            step={stepA}
            playing={playingA || syncPlaying}
            onPrev={() => { setSyncPlaying(false); setPlayingA(false); setStepA(s => Math.max(0, s - 1)); }}
            onNext={() => { setSyncPlaying(false); setPlayingA(false); setStepA(s => Math.min(mA.steps.length - 1, s + 1)); }}
            onSetStep={i => { setSyncPlaying(false); setPlayingA(false); setStepA(i); }}
            onTogglePlay={() => { setSyncPlaying(false); setPlayingA(p => !p); }}
          />
          <MechPanel
            mechKey={mechB}
            step={stepB}
            playing={playingB || syncPlaying}
            onPrev={() => { setSyncPlaying(false); setPlayingB(false); setStepB(s => Math.max(0, s - 1)); }}
            onNext={() => { setSyncPlaying(false); setPlayingB(false); setStepB(s => Math.min(mB.steps.length - 1, s + 1)); }}
            onSetStep={i => { setSyncPlaying(false); setPlayingB(false); setStepB(i); }}
            onTogglePlay={() => { setSyncPlaying(false); setPlayingB(p => !p); }}
          />
        </div>

        {/* Comparison table */}
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.25em", color: "#334155", textTransform: "uppercase", marginBottom: 14 }}>
          Head-to-head comparison
        </div>
        <div style={{ border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr", background: "#060d18", borderBottom: "1px solid #1e293b" }}>
            <div style={{ padding: "12px 18px" }} />
            <div style={{ padding: "12px 18px", ...mono, fontSize: 13, fontWeight: 600, color: mA.color, borderLeft: "1px solid #1e293b" }}>
              {mA.label}
            </div>
            <div style={{ padding: "12px 18px", ...mono, fontSize: 13, fontWeight: 600, color: mB.color, borderLeft: "1px solid #1e293b" }}>
              {mB.label}
            </div>
          </div>

          {TABLE_ROWS.map((row, idx) => {
            const valA = mA[row.key as keyof typeof mA] as string;
            const valB = mB[row.key as keyof typeof mB] as string;
            return (
              <div
                key={row.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 1fr 1fr",
                  borderBottom: idx < TABLE_ROWS.length - 1 ? "1px solid #0f1f35" : "none",
                  background: idx % 2 === 0 ? "#030b17" : "#060d18",
                }}
              >
                <div style={{ padding: "14px 18px", ...mono, fontSize: 10, letterSpacing: "0.15em", color: "#334155", textTransform: "uppercase", display: "flex", alignItems: "center" }}>
                  {row.label}
                </div>
                <div style={{ padding: "14px 18px", ...sora, fontSize: 13, color: `${mA.color}cc`, borderLeft: "1px solid #0f1f35", display: "flex", alignItems: "center" }}>
                  {valA}
                </div>
                <div style={{ padding: "14px 18px", ...sora, fontSize: 13, color: `${mB.color}cc`, borderLeft: "1px solid #0f1f35", display: "flex", alignItems: "center" }}>
                  {valB}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
