"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { MECHANISMS } from "@/lib/mechanisms";
import type { MechanismKey } from "@/lib/mechanisms";
import {
  calcMemoryGB,
  calcGFLOPs,
  calcTimeMs,
  gpuFit,
  denseBreakingPoint,
  sliderToSeqLen,
  seqLenToSlider,
  formatGB,
  formatGFLOPs,
  formatTime,
  formatNum,
  getChartPoints,
  GPU_SPECS,
  MODEL_PRESETS,
  MECHANISM_FORMULAS,
  LOCAL_WINDOW,
} from "@/lib/complexity-math";
import type { Precision, GPUKey } from "@/lib/complexity-math";

const ComplexityCharts = dynamic(() => import("./ComplexityCharts"), { ssr: false });

const MECHANISM_KEYS: MechanismKey[] = ["dense", "flash", "local", "sparse", "linear", "paged"];

const FIT_COLORS: Record<string, string> = {
  green:  "#4ade80",
  yellow: "#fbbf24",
  red:    "#f87171",
};

const FIT_LABELS: Record<string, string> = {
  green:  "Fits",
  yellow: "Tight",
  red:    "OOM",
};

const FIT_TOOLTIPS: Record<string, string> = {
  green:  "Uses <70% of VRAM — comfortable headroom.",
  yellow: "Uses 70–100% of VRAM — might work but tight.",
  red:    "Exceeds VRAM — will crash or require offloading.",
};

type View = "bars" | "curves" | "breakpoints";
type YAxisType = "memory" | "compute";

// ── Mechanism Card ─────────────────────────────────────────────────────────
function MechCard({
  mechKey,
  memGB,
  gflops,
  timeMs,
  gpu,
  maxMemGB,
  minMemGB,
  showFormula,
  onToggleFormula,
}: {
  mechKey: MechanismKey;
  memGB: number;
  gflops: number;
  timeMs: number;
  gpu: GPUKey;
  maxMemGB: number;
  minMemGB: number;
  showFormula: boolean;
  onToggleFormula: () => void;
}) {
  const mech = MECHANISMS[mechKey];
  const fit = gpuFit(memGB, gpu);
  const fitColor = FIT_COLORS[fit];

  const logMin = Math.log(Math.max(minMemGB, 1e-6));
  const logMax = Math.log(Math.max(maxMemGB, 1e-5));
  const logVal = Math.log(Math.max(memGB, 1e-6));
  const barPct = logMax > logMin
    ? Math.max(2, Math.min(100, ((logVal - logMin) / (logMax - logMin)) * 100))
    : 2;

  const [tooltip, setTooltip] = useState(false);

  return (
    <div style={{
      background: "#080f1a",
      border: "1px solid #1e293b",
      borderRadius: 14,
      borderLeft: `3px solid ${mech.color}`,
      padding: "22px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            fontWeight: 700,
            color: mech.color,
            letterSpacing: "0.04em",
          }}>
            {mech.label}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "#475569",
            marginTop: 3,
          }}>
            {mech.complexity}
          </div>
        </div>
        {/* GPU fit badge */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setTooltip(true)}
          onMouseLeave={() => setTooltip(false)}
        >
          <div style={{
            background: fitColor + "22",
            color: fitColor,
            border: `1px solid ${fitColor}44`,
            borderRadius: 20,
            padding: "2px 10px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            cursor: "default",
            letterSpacing: "0.05em",
          }}>
            {FIT_LABELS[fit]}
          </div>
          {tooltip && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              background: "#060d18",
              border: "1px solid #1e293b",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 11,
              color: "#94a3b8",
              fontFamily: "'Sora', sans-serif",
              whiteSpace: "nowrap",
              zIndex: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}>
              {FIT_TOOLTIPS[fit]}
            </div>
          )}
        </div>
      </div>

      {/* Memory bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#475569",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            MEMORY
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: "#e2e8f0",
          }}>
            {formatGB(memGB)}
          </span>
        </div>
        <div style={{ background: "#0a1628", borderRadius: 3, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${barPct}%`,
            background: `linear-gradient(90deg, ${mech.color}99, ${mech.color})`,
            borderRadius: 3,
            transition: "width 0.35s ease",
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "#0d1f35", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#475569",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 3,
          }}>Compute</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "#e2e8f0",
            fontWeight: 600,
          }}>{formatGFLOPs(gflops)}</div>
        </div>
        <div style={{ background: "#0d1f35", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#475569",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 3,
          }}>Est. Time</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "#e2e8f0",
            fontWeight: 600,
          }}>{formatTime(timeMs)}</div>
        </div>
      </div>

      {/* Formula toggle */}
      <button
        onClick={onToggleFormula}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: "#475569",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.05em",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
        onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
      >
        <span style={{
          display: "inline-block",
          transform: showFormula ? "rotate(90deg)" : "none",
          transition: "transform 0.2s",
        }}>▶</span>
        {showFormula ? "hide formula" : "show formula"}
      </button>

      {showFormula && (
        <div style={{
          background: "#080f1a",
          borderRadius: 6,
          padding: "8px 12px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: "#94a3b8",
          lineHeight: 1.6,
        }}>
          <span style={{ color: mech.color }}>{MECHANISM_FORMULAS[mechKey]}</span>
          {mechKey === "local" && (
            <span style={{ color: "#475569", display: "block", marginTop: 4 }}>
              w = window = {LOCAL_WINDOW} tokens
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ComplexityCalculator() {
  const [seqLen, setSeqLen]       = useState(4096);
  const [dModel, setDModel]       = useState(1024);
  const [heads, setHeads]         = useState(16);
  const [batchSize, setBatch]     = useState(1);
  const [precision, setPrecision] = useState<Precision>("fp16");
  const [gpu, setGpu]             = useState<GPUKey>("a100_80");
  const [view, setView]           = useState<View>("bars");
  const [yAxis, setYAxis]         = useState<YAxisType>("memory");
  const [openFormulas, setOpenFormulas] = useState<Set<MechanismKey>>(new Set());

  function toggleFormula(k: MechanismKey) {
    setOpenFormulas(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  function applyPreset(key: string) {
    const p = MODEL_PRESETS[key];
    setSeqLen(Math.min(100000, p.seqLen));
    setDModel(p.dModel);
    setHeads(p.heads);
  }

  const sliderValue = seqLenToSlider(seqLen);
  const gpuKeys = Object.keys(GPU_SPECS) as GPUKey[];

  const metrics = useMemo(() =>
    MECHANISM_KEYS.map(k => {
      const mem = calcMemoryGB(k, seqLen, dModel, heads, precision, batchSize);
      const gfp = calcGFLOPs(k, seqLen, dModel, heads, batchSize);
      const tms = calcTimeMs(gfp, gpu, precision);
      return { key: k, mem, gfp, tms };
    }), [seqLen, dModel, heads, precision, batchSize, gpu]);

  const maxMem = Math.max(...metrics.map(m => m.mem), 0.001);
  const minMem = Math.min(...metrics.map(m => m.mem), maxMem * 0.5);

  const chartData = useMemo(() => {
    if (view === "bars") return [];
    const points = getChartPoints(seqLen);
    return points.map(N => {
      const row: Record<string, number> = { N };
      for (const k of MECHANISM_KEYS) {
        row[k] = yAxis === "memory"
          ? calcMemoryGB(k, N, dModel, heads, precision, batchSize)
          : calcGFLOPs(k, N, dModel, heads, batchSize);
      }
      return row;
    });
  }, [view, seqLen, dModel, heads, precision, batchSize, yAxis]);

  const breakingPoints = useMemo(() =>
    gpuKeys.map(gk => {
      const N = denseBreakingPoint(gk, heads, precision);
      return { gpuKey: gk, label: GPU_SPECS[gk].label, N: Math.round(N), vramGB: GPU_SPECS[gk].vramGB };
    }), [gpuKeys, heads, precision]);

  // Matches InfoPanel/GridPanel section header style
  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    marginBottom: 12,
  };

  // Small field label for controls inside a panel
  const fieldLabelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 6,
  };

  const controlLabelStyle = fieldLabelStyle;

  const selectStyle: React.CSSProperties = {
    background: "#0d1f35",
    border: "1px solid #1e3a5f",
    borderRadius: 8,
    color: "#e2e8f0",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    padding: "8px 12px",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
  };

  return (
    <section style={{
      background: "#080f1a",
      padding: "48px 30px 64px",
      fontFamily: "'Sora', sans-serif",
    }} id="complexity">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Section header */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: "#38bdf8",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          Interactive Tool
        </div>
        <h2 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: "#e2e8f0",
          margin: 0,
          marginBottom: 10,
        }}>
          Complexity Calculator
        </h2>
        <p style={{
          color: "#94a3b8",
          fontSize: 15,
          margin: 0,
          marginBottom: 36,
          maxWidth: 580,
          lineHeight: 1.9,
        }}>
          Drag the slider to see real memory and compute numbers — not just O(N²). Watch Dense Attention become physically impossible while Flash and Linear stay cheap.
        </p>

        {/* ── Controls ─────────────────────────────────── */}
        <div style={{
          background: "#080f1a",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: "25px 30px",
          marginBottom: 20,
        }}>
          <div style={sectionLabelStyle}>Parameters</div>
          {/* Sequence length slider */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={fieldLabelStyle}>Sequence Length (tokens)</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 16,
                fontWeight: 700,
                color: "#38bdf8",
              }}>
                {formatNum(seqLen)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={sliderValue}
              onChange={e => setSeqLen(sliderToSeqLen(Number(e.target.value)))}
              style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
            />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "#334155",
              marginTop: 3,
            }}>
              <span>128</span><span>1k</span><span>4k</span><span>16k</span><span>64k</span><span>100k</span>
            </div>
          </div>

          {/* Secondary controls */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
          }}>
            <div>
              <div style={controlLabelStyle}>d_model</div>
              <select style={selectStyle} value={dModel} onChange={e => setDModel(Number(e.target.value))}>
                {[512, 768, 1024, 2048, 4096].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={controlLabelStyle}>Heads</div>
              <select style={selectStyle} value={heads} onChange={e => setHeads(Number(e.target.value))}>
                {[4, 8, 12, 16, 32, 64].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={controlLabelStyle}>Batch Size</div>
              <select style={selectStyle} value={batchSize} onChange={e => setBatch(Number(e.target.value))}>
                {[1, 4, 8, 16, 32].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={controlLabelStyle}>GPU</div>
              <select style={selectStyle} value={gpu} onChange={e => setGpu(e.target.value as GPUKey)}>
                {gpuKeys.map(k => (
                  <option key={k} value={k}>{GPU_SPECS[k].label}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={controlLabelStyle}>Precision</div>
              <div style={{ display: "flex", gap: 4 }}>
                {(["fp32", "fp16", "int8"] as Precision[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPrecision(p)}
                    style={{
                      flex: 1,
                      background: precision === p ? "#1e3a5f" : "#0d1f35",
                      border: `1px solid ${precision === p ? "#38bdf8" : "#1e293b"}`,
                      borderRadius: 6,
                      color: precision === p ? "#38bdf8" : "#475569",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      padding: "6px 0",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontWeight: precision === p ? 700 : 400,
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Model presets ─────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ ...sectionLabelStyle, marginBottom: 14 }}>Real model presets</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(MODEL_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                style={{
                  background: "#0d1f35",
                  border: "1px solid #1e3a5f",
                  borderRadius: 20,
                  color: "#94a3b8",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  padding: "6px 16px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#38bdf8";
                  e.currentTarget.style.color = "#38bdf8";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#1e3a5f";
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── View toggle ───────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
          {([
            ["bars",        "Mechanism Cards"],
            ["curves",      "Growth Curves"],
            ["breakpoints", "Breaking Points"],
          ] as [View, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? "#1e3a5f" : "transparent",
                border: `1px solid ${view === v ? "#38bdf8" : "#1e293b"}`,
                borderRadius: 8,
                color: view === v ? "#38bdf8" : "#475569",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.15s",
                fontWeight: view === v ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Visualization ─────────────────────────────── */}
        {view === "bars" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {metrics.map(({ key, mem, gfp, tms }) => (
              <MechCard
                key={key}
                mechKey={key}
                memGB={mem}
                gflops={gfp}
                timeMs={tms}
                gpu={gpu}
                maxMemGB={maxMem}
                minMemGB={minMem}
                showFormula={openFormulas.has(key)}
                onToggleFormula={() => toggleFormula(key)}
              />
            ))}
          </div>
        )}

        {(view === "curves" || view === "breakpoints") && (
          <ComplexityCharts
            chartData={chartData}
            view={view}
            yAxis={yAxis}
            gpu={gpu}
            breakingPoints={breakingPoints}
            onYAxisChange={setYAxis}
          />
        )}

      </div>
    </section>
  );
}
