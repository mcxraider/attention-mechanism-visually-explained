import type { MechanismKey } from "./mechanisms";

export type Precision = "fp32" | "fp16" | "int8";
export type GPUKey = "rtx3080" | "rtx4090" | "a100_40" | "a100_80" | "h100";
export type FitStatus = "green" | "yellow" | "red";

export const LOCAL_WINDOW = 512;

export const PRECISION_BYTES: Record<Precision, number> = {
  fp32: 4,
  fp16: 2,
  int8: 1,
};

export const GPU_SPECS: Record<GPUKey, { label: string; vramGB: number; tflopsF16: number }> = {
  rtx3080: { label: "RTX 3080",  vramGB: 10,  tflopsF16: 29.8  },
  rtx4090: { label: "RTX 4090",  vramGB: 24,  tflopsF16: 82.6  },
  a100_40: { label: "A100 40GB", vramGB: 40,  tflopsF16: 77.6  },
  a100_80: { label: "A100 80GB", vramGB: 80,  tflopsF16: 77.6  },
  h100:    { label: "H100 80GB", vramGB: 80,  tflopsF16: 204.9 },
};

export const MODEL_PRESETS: Record<string, { label: string; seqLen: number; dModel: number; heads: number }> = {
  bert:   { label: "BERT-base",      seqLen: 512,     dModel: 768,  heads: 12 },
  gpt2:   { label: "GPT-2",          seqLen: 1024,    dModel: 1024, heads: 16 },
  llama3: { label: "LLaMA-3 8B",     seqLen: 8192,    dModel: 4096, heads: 32 },
  gemini: { label: "Gemini 1.5 Pro", seqLen: 1000000, dModel: 4096, heads: 32 },
};

export const MECHANISM_FORMULAS: Record<MechanismKey, string> = {
  dense:  "4 × N² × h × bytes",
  flash:  "4 × N × d × bytes",
  local:  "4 × N × w × h × bytes",
  sparse: "4 × N × √N × h × bytes",
  linear: "4 × N × d × bytes",
  paged:  "4 × N × d × bytes × 1.05",
};

export function calcMemoryGB(
  mech: MechanismKey,
  N: number,
  d: number,
  h: number,
  precision: Precision,
  batch: number
): number {
  const pb = PRECISION_BYTES[precision];
  let bytes: number;
  switch (mech) {
    case "dense":  bytes = 4 * N * N * h * pb; break;
    case "flash":  bytes = 4 * N * d * pb; break;
    case "local":  bytes = 4 * N * LOCAL_WINDOW * h * pb; break;
    case "sparse": bytes = 4 * N * Math.sqrt(N) * h * pb; break;
    case "linear": bytes = 4 * N * d * pb; break;
    case "paged":  bytes = 4 * N * d * pb * 1.05; break;
    default:       bytes = 0;
  }
  return (bytes * batch) / 1e9;
}

export function calcGFLOPs(
  mech: MechanismKey,
  N: number,
  d: number,
  h: number,
  batch: number
): number {
  let flops: number;
  switch (mech) {
    case "dense":  flops = 4 * N * N * d; break;
    case "flash":  flops = 4 * N * N * d; break;
    case "local":  flops = 4 * N * LOCAL_WINDOW * d; break;
    case "sparse": flops = 4 * N * Math.sqrt(N) * d; break;
    case "linear": flops = 4 * N * d * d; break;
    case "paged":  flops = 4 * N * N * d; break;
    default:       flops = 0;
  }
  return (flops * batch) / 1e9;
}

export function calcTimeMs(
  gflops: number,
  gpu: GPUKey,
  precision: Precision
): number {
  const spec = GPU_SPECS[gpu];
  const tflops =
    precision === "fp32"
      ? spec.tflopsF16 * 0.5
      : precision === "int8"
      ? spec.tflopsF16 * 2
      : spec.tflopsF16;
  const result = (gflops / (tflops * 1000)) * 1000;
  return result;
}

export function gpuFit(memGB: number, gpu: GPUKey): FitStatus {
  const vram = GPU_SPECS[gpu].vramGB;
  if (memGB < vram * 0.7) return "green";
  if (memGB <= vram) return "yellow";
  return "red";
}

// Dense attention breaking point for a given GPU: solve 4*N^2*h*pb = vramGB*1e9
export function denseBreakingPoint(gpu: GPUKey, h: number, precision: Precision): number {
  const pb = PRECISION_BYTES[precision];
  const vram = GPU_SPECS[gpu].vramGB * 1e9;
  return Math.sqrt(vram / (4 * h * pb));
}

// Logarithmic slider helpers (slider value: 0-100)
export function sliderToSeqLen(value: number): number {
  const min = Math.log(128);
  const max = Math.log(100000);
  return Math.round(Math.exp(min + (value / 100) * (max - min)));
}

export function seqLenToSlider(seqLen: number): number {
  const min = Math.log(128);
  const max = Math.log(100000);
  const clamped = Math.max(128, Math.min(100000, seqLen));
  return ((Math.log(clamped) - min) / (max - min)) * 100;
}

export function formatNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return n.toFixed(0);
}

export function formatGB(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + " TB";
  if (n >= 1) return n.toFixed(2) + " GB";
  if (n >= 0.001) return (n * 1000).toFixed(1) + " MB";
  return (n * 1e6).toFixed(0) + " KB";
}

export function formatGFLOPs(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "P";
  if (n >= 1000) return (n / 1000).toFixed(1) + "T";
  if (n >= 1) return n.toFixed(1) + "G";
  return (n * 1000).toFixed(1) + "M";
}

export function formatTime(ms: number): string {
  if (ms >= 60000) return (ms / 60000).toFixed(1) + " min";
  if (ms >= 1000) return (ms / 1000).toFixed(2) + " s";
  if (ms >= 1) return ms.toFixed(1) + " ms";
  return (ms * 1000).toFixed(0) + " µs";
}

// Generate log-spaced N values for charts
export function getChartPoints(maxN: number, points = 60): number[] {
  const lo = Math.log(128);
  const hi = Math.log(Math.max(maxN, 100000));
  return Array.from({ length: points }, (_, i) =>
    Math.round(Math.exp(lo + (i / (points - 1)) * (hi - lo)))
  );
}
