"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MECHANISMS, MechanismKey } from "@/lib/mechanisms";
import { getActiveRow } from "@/lib/attention-logic";
import { DEEP_DIVE, MathStep, MemoryItem } from "@/lib/mechanism-content";
import { levelColors, GRID, btn } from "@/lib/theme";
import AttentionGrid from "@/components/AttentionGrid";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const sora: React.CSSProperties = { fontFamily: "'Sora', sans-serif" };

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      ...mono,
      fontSize: 11,
      letterSpacing: "0.22em",
      color,
      textTransform: "uppercase",
      marginBottom: 20,
      paddingBottom: 10,
      borderBottom: `1px solid ${color}33`,
    }}>
      {children}
    </div>
  );
}

function DeepSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", marginTop: 64 }}>
      <SectionLabel color={color}>{title}</SectionLabel>
      {children}
    </div>
  );
}

function AnalogyCard({ analogy }: { analogy: { title: string; body: string } }) {
  return (
    <div style={{
      background: "#0d1f35",
      borderRadius: 12,
      padding: "20px 24px",
      marginBottom: 28,
      border: "1px solid #1e3a5f",
    }}>
      <div style={{ ...mono, fontSize: 11, color: "#38bdf8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
        Analogy
      </div>
      <div style={{ ...sora, fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
        {analogy.title}
      </div>
      <p style={{ ...sora, margin: 0, fontSize: 15, lineHeight: 1.8, color: "#94a3b8" }}>
        {analogy.body}
      </p>
    </div>
  );
}

function MathStepCard({ step, index, color }: { step: MathStep; index: number; color: string }) {
  return (
    <div style={{
      background: "#080f1a",
      borderRadius: 10,
      padding: "18px 22px",
      marginBottom: 14,
      borderLeft: `3px solid ${color}`,
      border: `1px solid ${color}22`,
      borderLeftWidth: 3,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{
          ...mono,
          fontSize: 11,
          background: color + "22",
          color,
          borderRadius: 6,
          padding: "2px 9px",
          flexShrink: 0,
        }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div style={{ ...sora, fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{step.title}</div>
      </div>
      <p style={{ ...sora, margin: 0, fontSize: 14, lineHeight: 1.8, color: "#94a3b8", marginBottom: step.formula ? 14 : 0 }}>
        {step.body}
      </p>
      {step.formula && (
        <div style={{
          ...mono,
          fontSize: 13,
          background: "#030b17",
          borderRadius: 8,
          padding: "10px 16px",
          color: color,
          marginTop: 10,
          overflowX: "auto",
          whiteSpace: "pre",
        }}>
          {step.formula}
        </div>
      )}
    </div>
  );
}

function MemoryRow({ item }: { item: MemoryItem }) {
  const costColors = { cheap: "#4ade80", expensive: "#f87171", neutral: "#94a3b8" };
  const costLabels = { cheap: "cheap", expensive: "costly", neutral: "moderate" };
  return (
    <div style={{
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
      padding: "14px 0",
      borderBottom: "1px solid #0d1f35",
    }}>
      <span style={{
        ...mono,
        fontSize: 10,
        color: costColors[item.cost],
        background: costColors[item.cost] + "18",
        border: `1px solid ${costColors[item.cost]}44`,
        borderRadius: 6,
        padding: "3px 8px",
        whiteSpace: "nowrap",
        flexShrink: 0,
        marginTop: 2,
      }}>
        {costLabels[item.cost]}
      </span>
      <div>
        <div style={{ ...sora, fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 3 }}>{item.label}</div>
        <div style={{ ...sora, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{item.detail}</div>
      </div>
    </div>
  );
}

function ProConList({ items, positive }: { items: string[]; positive: boolean }) {
  const color = positive ? "#4ade80" : "#f87171";
  const symbol = positive ? "+" : "−";
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...mono, fontSize: 11, color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
        {positive ? "Advantages" : "Disadvantages"}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
          <span style={{ ...mono, fontSize: 13, color, flexShrink: 0, marginTop: 1 }}>{symbol}</span>
          <span style={{ ...sora, fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function WhenCard({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div style={{
      background: "#0d1f35",
      borderRadius: 10,
      padding: "16px 20px",
      border: `1px solid ${color}33`,
      flex: 1,
    }}>
      <div style={{ ...mono, fontSize: 11, color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      <p style={{ ...sora, margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.75 }}>{text}</p>
    </div>
  );
}

export default function MechanismDeepDive({ mechanismKey }: { mechanismKey: MechanismKey }) {
  const mech = MECHANISMS[mechanismKey];
  const content = DEEP_DIVE[mechanismKey];
  const maxStep = mech.steps.length - 1;

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const clampedStep = Math.min(step, maxStep);
  const activeRow = getActiveRow(mechanismKey, clampedStep);

  const stepRef = useRef(step);
  const cycleCountRef = useRef(0);
  stepRef.current = step;

  useEffect(() => { setStep(0); setPlaying(false); cycleCountRef.current = 0; }, [mechanismKey]);

  useEffect(() => {
    if (!playing) return;
    cycleCountRef.current = 0;
    const id = setInterval(() => {
      if (stepRef.current >= maxStep) {
        cycleCountRef.current += 1;
        if (cycleCountRef.current >= 3) {
          clearInterval(id);
          setPlaying(false);
          setStep(0);
          return;
        }
        setStep(0);
      } else {
        setStep(s => s + 1);
      }
    }, 1200);
    return () => clearInterval(id);
  }, [playing, maxStep]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setStep(s => Math.max(0, s - 1));
      if (e.key === "ArrowRight") setStep(s => Math.min(maxStep, s + 1));
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxStep]);

  return (
    <div className="page-fade-in" style={{ background: "#030b17", minHeight: "100vh", ...sora, color: "#e2e8f0", padding: "20px 30px 80px" }}>

      {/* Nav */}
      <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 32 }}>
        <Link href="/" style={{ ...mono, fontSize: 12, color: "#475569", textDecoration: "none", letterSpacing: "0.08em" }}>
          ← Back to explorer
        </Link>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 8, paddingBottom: 40, borderBottom: "1px solid #0d1f35" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{
            ...mono,
            fontSize: 12,
            background: mech.color + "18",
            border: `1px solid ${mech.color}44`,
            borderRadius: 4,
            padding: "3px 10px",
            color: mech.color,
          }}>{mech.complexity}</span>
          <span style={{
            ...mono,
            fontSize: 12,
            background: levelColors[mech.level] + "18",
            border: `1px solid ${levelColors[mech.level]}44`,
            borderRadius: 10,
            padding: "3px 10px",
            color: levelColors[mech.level],
          }}>{mech.level}</span>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 700, color: mech.color, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {mech.label}
        </h1>
        <p style={{ margin: "0 0 8px", fontSize: 18, color: "#64748b", fontStyle: "italic" }}>{mech.shortDesc}</p>
        <p style={{ margin: 0, fontSize: 16, color: "#94a3b8", maxWidth: 700 }}>{content.tagline}</p>
      </div>

      {/* Interactive attention grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", marginTop: 48 }}>
        <SectionLabel color={mech.color}>Attention Pattern</SectionLabel>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                ...mono,
                fontSize: 12,
                color: "#334155",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}>
                ↑ Queries ↑
              </div>
              <AttentionGrid type={mechanismKey} step={clampedStep} color={mech.color} size={GRID} activeRow={activeRow} cellSize={52} />
            </div>
            <div style={{ ...mono, fontSize: 12, color: "#334155", textAlign: "center", marginTop: 8 }}>
              ← tokens (Keys) →
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              background: "#0d1f35",
              borderRadius: 10,
              padding: "18px 20px",
              borderLeft: `3px solid ${mech.color}`,
              marginBottom: 16,
              minHeight: 100,
            }}>
              <div style={{ ...mono, fontSize: 12, color: mech.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                {mech.steps[clampedStep].label}
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85, color: "#94a3b8" }}>
                {mech.steps[clampedStep].desc}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={() => setStep(s => Math.max(0, s - 1))} style={btn("#0d1f35", "#94a3b8")}>←</button>
                {mech.steps.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)} style={{
                    width: 10, height: 10, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: i === clampedStep ? mech.color : "#1e3a5f",
                    padding: 0, transition: "background 0.2s",
                  }} />
                ))}
                <button onClick={() => setPlaying(p => !p)} style={btn(mech.color + "22", mech.color)}>
                  {playing ? "⏸" : "▶"}
                </button>
                <button onClick={() => setStep(s => Math.min(maxStep, s + 1))} style={btn("#0d1f35", "#94a3b8")}>→</button>
              </div>
              <div style={{ ...mono, fontSize: 11, color: "#334155" }}>← → Space to navigate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Intuition */}
      <DeepSection title="Intuitive Explanation" color={mech.color}>
        <AnalogyCard analogy={content.analogy} />
        {content.intuition.map((para, i) => (
          <p key={i} style={{ ...sora, fontSize: 15, lineHeight: 1.9, color: "#94a3b8", margin: "0 0 18px" }}>
            {para}
          </p>
        ))}
      </DeepSection>

      {/* Section 2: The Math */}
      <DeepSection title="The Math" color={mech.color}>
        {content.math.map((s, i) => (
          <MathStepCard key={i} step={s} index={i} color={mech.color} />
        ))}
      </DeepSection>

      {/* Section 3: Memory & Compute */}
      <DeepSection title="Memory & Compute" color={mech.color}>
        <p style={{ ...sora, fontSize: 15, lineHeight: 1.9, color: "#94a3b8", margin: "0 0 24px" }}>
          {content.memoryCompute.overview}
        </p>
        <div style={{ background: "#080f1a", borderRadius: 10, padding: "4px 20px" }}>
          {content.memoryCompute.items.map((item, i) => (
            <MemoryRow key={i} item={item} />
          ))}
        </div>
      </DeepSection>

      {/* Section 4: Tradeoffs */}
      <DeepSection title="Tradeoffs" color={mech.color}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
          <ProConList items={content.tradeoffs.pros} positive={true} />
          <ProConList items={content.tradeoffs.cons} positive={false} />
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <WhenCard label="When to use" text={content.tradeoffs.whenToUse} color="#4ade80" />
          <WhenCard label="When to avoid" text={content.tradeoffs.whenToAvoid} color="#f87171" />
        </div>

        <div style={{ background: "#080f1a", borderRadius: 10, padding: "16px 20px", border: `1px solid ${mech.color}22` }}>
          <div style={{ ...mono, fontSize: 11, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
            Used in
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {mech.usedIn.split(",").map((model, i) => (
              <span key={i} style={{
                ...mono,
                fontSize: 12,
                background: mech.color + "18",
                border: `1px solid ${mech.color}44`,
                borderRadius: 6,
                padding: "4px 12px",
                color: mech.color,
              }}>
                {model.trim()}
              </span>
            ))}
          </div>
        </div>
      </DeepSection>

    </div>
  );
}
