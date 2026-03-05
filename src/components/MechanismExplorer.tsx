"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => { setStep(0); setPlaying(false); }, [active]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep(s => s >= maxStep ? 0 : s + 1);
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
      padding: "50px 30px 100px",
    }}>
      <Header />
      <OverviewGrid tabs={tabs} active={active} onSelect={handleSelect} />

      <div className="main-grid" style={{ maxWidth: 1200, margin: "30px auto 0" }}>
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
  );
}
