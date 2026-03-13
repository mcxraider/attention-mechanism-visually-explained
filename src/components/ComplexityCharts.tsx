"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MECHANISMS } from "@/lib/mechanisms";
import type { MechanismKey } from "@/lib/mechanisms";
import { GPU_SPECS, formatNum, formatGB, formatGFLOPs } from "@/lib/complexity-math";
import type { GPUKey } from "@/lib/complexity-math";

const MECHANISM_KEYS: MechanismKey[] = ["dense", "flash", "local", "sparse", "linear", "paged"];

type YAxisType = "memory" | "compute";

function fmt(n: number, isMemory: boolean) {
  return isMemory ? formatGB(n) : formatGFLOPs(n);
}

function ChartTooltip({ active, payload, label, isMemory }: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: number;
  isMemory: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#060d18",
      border: "1px solid #1e293b",
      borderRadius: 8,
      padding: "10px 14px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 8, fontSize: 11 }}>
        N = {formatNum(label ?? 0)} tokens
      </div>
      {[...payload].sort((a, b) => b.value - a.value).map(p => (
        <div key={p.name} style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 3,
          color: p.color,
        }}>
          <span>{MECHANISMS[p.name as MechanismKey]?.label ?? p.name}</span>
          <span style={{ color: "#e2e8f0" }}>{fmt(p.value, isMemory)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ComplexityCharts({
  chartData,
  view,
  yAxis,
  gpu,
  breakingPoints,
  onYAxisChange,
}: {
  chartData: Record<string, number>[];
  view: "curves" | "breakpoints";
  yAxis: YAxisType;
  gpu: GPUKey;
  breakingPoints: { gpuKey: GPUKey; label: string; N: number; vramGB: number }[];
  onYAxisChange: (y: YAxisType) => void;
}) {
  const gpuKeys = Object.keys(GPU_SPECS) as GPUKey[];
  const isMemory = yAxis === "memory";

  // Explicit decade ticks so log scale is visually clear
  const LOG_TICKS_MEMORY  = [0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000];
  const LOG_TICKS_COMPUTE = [0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];
  const yTicks = isMemory ? LOG_TICKS_MEMORY : LOG_TICKS_COMPUTE;
  // X-axis: linear scale so proportional distances are shown (10k→100k is 10× wider than 100→1k)
  const X_TICKS = [0, 20000, 40000, 60000, 80000, 100000];

  const controlLabelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  };

  return (
    <div style={{
      background: "#0a1628",
      border: "1px solid #1e293b",
      borderRadius: 12,
      padding: "24px 16px 16px",
    }}>
      {/* Chart header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingRight: 8 }}>
        <div>
          <div style={{ ...controlLabelStyle, margin: 0 }}>
            {view === "curves" ? "Memory / Compute vs Sequence Length" : "GPU breaking points"}
          </div>
          {view === "breakpoints" && (
            <div style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 12,
              color: "#94a3b8",
              marginTop: 4,
            }}>
              Dashed lines show VRAM limits. Where Dense hits the ceiling — other mechanisms stay below.
            </div>
          )}
        </div>
        {view === "curves" && (
          <div style={{ display: "flex", gap: 4 }}>
            {(["memory", "compute"] as YAxisType[]).map(y => (
              <button
                key={y}
                onClick={() => onYAxisChange(y)}
                style={{
                  background: yAxis === y ? "#1e3a5f" : "transparent",
                  border: `1px solid ${yAxis === y ? "#38bdf8" : "#1e293b"}`,
                  borderRadius: 6,
                  color: yAxis === y ? "#38bdf8" : "#475569",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  padding: "5px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {y === "memory" ? "Memory" : "Compute"}
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 20, left: 10 }}
        >
          <CartesianGrid stroke="#0d1f35" strokeDasharray="3 3" />
          <XAxis
            dataKey="N"
            domain={[0, 100000]}
            ticks={X_TICKS}
            type="number"
            tickFormatter={v => formatNum(v)}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#475569" }}
            label={{
              value: "Sequence Length (tokens)",
              position: "insideBottom",
              offset: -10,
              fill: "#475569",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
            }}
          />
          <YAxis
            scale="log"
            domain={[0.0001, isMemory ? 10000 : 1000000]}
            type="number"
            ticks={yTicks}
            tickFormatter={v => fmt(v, isMemory)}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#475569" }}
            width={75}
            label={{
              value: "log scale",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "#334155",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
            }}
          />
          <Tooltip content={<ChartTooltip isMemory={isMemory} />} />
          <Legend
            formatter={(value) => MECHANISMS[value as MechanismKey]?.label ?? value}
            wrapperStyle={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              paddingTop: 12,
              color: "#94a3b8",
            }}
          />
          {MECHANISM_KEYS.map(k => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              name={k}
              stroke={MECHANISMS[k].color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
          {view === "breakpoints" && isMemory &&
            gpuKeys.map(gk => {
              const spec = GPU_SPECS[gk];
              const isSelected = gk === gpu;
              return (
                <ReferenceLine
                  key={gk}
                  y={spec.vramGB}
                  stroke={isSelected ? "#f87171" : "#475569"}
                  strokeDasharray={isSelected ? "6 3" : "4 4"}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={isSelected ? 1 : 0.4}
                  label={{
                    value: spec.label,
                    position: "insideTopRight",
                    fill: isSelected ? "#f87171" : "#475569",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    opacity: isSelected ? 1 : 0.6,
                  }}
                />
              );
            })
          }
        </LineChart>
      </ResponsiveContainer>

      {/* Breaking point annotations */}
      {view === "breakpoints" && isMemory && (
        <div style={{
          marginTop: 20,
          padding: "16px 20px",
          background: "#060d18",
          borderRadius: 8,
          border: "1px solid #1e293b",
        }}>
          <div style={{ ...controlLabelStyle, marginBottom: 12 }}>Dense Attention breaking points</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 8,
          }}>
            {breakingPoints.map(({ gpuKey: gk, label, N }) => {
              const isSelected = gk === gpu;
              return (
                <div key={gk} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: isSelected ? "#f87171" : "#334155",
                    fontWeight: isSelected ? 700 : 400,
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: isSelected ? "#f87171" : "#475569",
                    fontWeight: isSelected ? 700 : 400,
                  }}>
                    {N > 100000 ? ">100k" : formatNum(N)} tokens
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: 12,
            fontFamily: "'Sora', sans-serif",
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.6,
          }}>
            At these sequence lengths, Dense Attention exceeds the full VRAM of each GPU tier.
            Flash Attention, Local, and Linear don&apos;t have an N² memory term — they stay below the line.
          </div>
        </div>
      )}
    </div>
  );
}
