"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MECHANISMS } from "@/lib/mechanisms";
import type { MechanismKey } from "@/lib/mechanisms";
import { getActiveRow } from "@/lib/attention-logic";
import Header from "./Header";
import GridPanel from "./GridPanel";
import InfoPanel from "./InfoPanel";
import OverviewGrid from "./OverviewGrid";

export default function MechanismExplorer() {
  const [active, setActive] = useState<MechanismKey>("dense");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const mech = MECHANISMS[active];
  const maxStep = mech.steps.length - 1;
  const clampedStep = Math.min(step, maxStep);
  const activeRow = getActiveRow(active, clampedStep);
  const tabs = Object.entries(MECHANISMS) as [MechanismKey, typeof mech][];

  const stepRef = useRef(step);
  const cycleCountRef = useRef(0);
  stepRef.current = step;

  useEffect(() => { setStep(0); setPlaying(false); cycleCountRef.current = 0; }, [active]);

  useEffect(() => {
    if (!playing) return;
    cycleCountRef.current = 0;
    const id = setInterval(() => {
      if (stepRef.current >= maxStep) {
        cycleCountRef.current += 1;
        if (cycleCountRef.current >= 7) {
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
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { setPlaying(false); setStep(s => Math.min(maxStep, s + 1)); }
      if (e.key === "ArrowLeft")  { setPlaying(false); setStep(s => Math.max(0, s - 1)); }
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [maxStep]);

  const handleSelect = (key: MechanismKey) => setActive(key);
  const handlePrev = () => { setPlaying(false); setStep(s => Math.max(0, s - 1)); };
  const handleNext = () => { setPlaying(false); setStep(s => Math.min(maxStep, s + 1)); };
  const handleSetStep = (i: number) => { setPlaying(false); setStep(i); };
  const handleTogglePlay = () => setPlaying(p => !p);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#030b17",
      fontFamily: "'Sora', sans-serif",
      color: "#e2e8f0",
      padding: "20px 24px 40px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Sidebar: mechanism selector + compare button */}
        <div style={{ width: 150, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "#334155",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 4,
          }}>
            Mechanisms
          </div>
          <OverviewGrid tabs={tabs} active={active} onSelect={handleSelect} vertical />
          <Link
            href="/compare?a=flash&b=paged"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 4,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "#94a3b8",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "9px 10px",
              textDecoration: "none",
              transition: "border-color 0.2s, color 0.2s",
              textAlign: "center",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#38bdf8";
              (e.currentTarget as HTMLAnchorElement).style.color = "#38bdf8";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1e293b";
              (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
            }}
          >
            ⇄ Compare
          </Link>
        </div>

        {/* Main content: Header + GridPanel + InfoPanel */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <Header />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <GridPanel
            mech={mech}
            active={active}
            step={clampedStep}
            playing={playing}
            activeRow={activeRow}
            onPrev={handlePrev}
            onNext={handleNext}
            onSetStep={handleSetStep}
            onTogglePlay={handleTogglePlay}
          />
          <InfoPanel mech={mech} />
          </div>
        </div>
      </div>
    </div>
  );
}
