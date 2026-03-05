import { useState, useEffect, useRef } from "react";

const GRID = 8;

// Returns true if cell (r,c) should be highlighted for a given mechanism + step
function isActive(r, c, type, step) {
  switch (type) {
    case "dense":
      return true;

    case "linear": {
      // Diagonal pattern - each token attends to tokens at increasing positions
      // Step animates which diagonal band is "current"
      const diagWidth = 2;
      return Math.abs(r - c) <= diagWidth && c <= r;
    }

    case "sparse": {
      // Global tokens (row 0, col 0) + local diagonal + strided
      if (r === 0 || c === 0) return true; // global token
      if (r === c) return true; // self
      if (c === r - 1 || c === r + 1) return true; // local neighbor
      if (c % 4 === 0 && r > c) return true; // strided
      return false;
    }

    case "flash": {
      const bs = 4;
      const br = Math.floor(r / bs);
      const bc = Math.floor(c / bs);
      if (step === 0) return br === 0 && bc === 0;
      if (step === 1) return br === 0 && bc === 1;
      if (step === 2) return br === 1 && bc === 0;
      if (step === 3) return br === 1 && bc === 1;
      return false;
    }

    case "paged": {
      // Scattered non-contiguous pages
      const pages = [
        [[0,0],[0,1],[1,0],[1,1]],
        [[4,4],[4,5],[5,4],[5,5]],
        [[2,6],[2,7],[3,6],[3,7]],
        [[6,2],[6,3],[7,2],[7,3]],
      ];
      const activePage = pages[step % pages.length];
      return activePage.some(([pr, pc]) => pr === r && pc === c);
    }

    case "local": {
      // Sliding window - diagonal band
      const windowSize = 2;
      return Math.abs(r - c) <= windowSize;
    }

    default:
      return false;
  }
}

const MECHANISMS = {
  dense: {
    label: "Dense (Full) Attention",
    color: "#60a5fa",
    shortDesc: "Every token talks to every other token",
    analogy: "Like a town hall meeting where everyone hears everyone else simultaneously.",
    whatIs: "In attention, each word (token) asks: 'which other words should I pay attention to?' Dense attention says: look at ALL of them. Every token computes a relevance score against every other token.",
    keyTerms: [
      { term: "Token", def: "A chunk of text — usually a word or subword. 'unhappy' might split into 'un' + 'happy'." },
      { term: "Attention score", def: "A number measuring how relevant one token is to another. Higher = pay more attention." },
      { term: "N×N matrix", def: "With N tokens, you need N² scores. 1000 tokens = 1,000,000 scores stored in memory." },
    ],
    tradeoff: "Perfect information — every word can influence every other. But memory and compute scale as O(N²). A 10× longer document costs 100× more. Fine for short sequences, prohibitive for long ones.",
    usedIn: "Original Transformer, BERT, GPT-2",
    steps: [{ label: "Full matrix", desc: "All N×N attention scores computed and stored. Every cell lit = every token pair has a score." }],
  },
  linear: {
    label: "Linear Attention",
    color: "#34d399",
    shortDesc: "Rewrite the math to avoid the N×N matrix entirely",
    analogy: "Instead of comparing every student's essay to every other essay, maintain a running class summary and compare each essay to that.",
    whatIs: "Standard attention uses softmax(QKᵀ)V which forces you to materialise the full N×N matrix. Linear attention rewrites this using a kernel trick: instead of comparing Q and K directly, it approximates the relationship so you can compute K·V first (a small d×d matrix), then multiply by Q. Result: O(N) memory instead of O(N²).",
    keyTerms: [
      { term: "Q, K, V", def: "Query, Key, Value — three learned projections of each token. Q = 'what am I looking for', K = 'what do I offer', V = 'what information I carry'." },
      { term: "Kernel trick", def: "Replace the expensive softmax(QKᵀ) with a factored approximation φ(Q)·(φ(K)ᵀV). Lets you reorder matrix multiplications." },
      { term: "O(N) memory", def: "Memory grows linearly with sequence length, not quadratically. 10× longer doc = 10× memory, not 100×." },
    ],
    tradeoff: "Much cheaper for long sequences. But the approximation loses some expressiveness — the model can't represent arbitrary attention patterns as precisely. Quality slightly below dense for tasks requiring precise long-range matching.",
    usedIn: "Performer, cosFormer, RWKV",
    steps: [{ label: "Diagonal factored pattern", desc: "The triangular/diagonal pattern shows tokens attending via a running context vector — not pairwise scores. Past tokens accumulate into a summary that future tokens query." }],
  },
  sparse: {
    label: "Sparse Attention",
    color: "#f59e0b",
    shortDesc: "Only compute attention for strategically chosen token pairs",
    analogy: "In a large company, the CEO talks to all department heads (global), and each employee talks to their immediate teammates (local). Nobody wastes time with unrelated departments.",
    whatIs: "Instead of computing all N² scores, sparse attention picks a structured subset: global tokens that attend everywhere (e.g. [CLS]), local neighbors within a window, and strided tokens at regular intervals. You get most of the information flow at a fraction of the cost.",
    keyTerms: [
      { term: "Global tokens", def: "Special tokens (like [CLS] in BERT) that attend to AND are attended by all other tokens. They aggregate global context." },
      { term: "Local window", def: "Each token attends to its k nearest neighbors. Captures short-range dependencies cheaply." },
      { term: "Strided attention", def: "Every nth token attends to a wider span, creating 'highways' for long-range information." },
    ],
    tradeoff: "O(N√N) or O(N log N) complexity — dramatically cheaper than dense for long sequences. Risk: if important relationships fall outside the chosen sparse pattern, they're missed entirely.",
    usedIn: "Sparse Transformer (OpenAI), BigBird, Longformer",
    steps: [{ label: "Global + local + strided", desc: "Column 0 & row 0 = global tokens (attend everywhere). Diagonal = local neighbors. Vertical stripes = strided long-range connections." }],
  },
  flash: {
    label: "Flash Attention",
    color: "#38bdf8",
    shortDesc: "Same math as dense, but computed in fast memory tile by tile",
    analogy: "Grading 1000 essays: instead of spreading all essays on a huge slow table, you grade 25 at a time on your small fast desk, keeping running notes. Same grades, much faster.",
    whatIs: "Dense attention is slow because the GPU constantly reads/writes the N×N matrix to HBM (slow VRAM). Flash Attention tiles the computation: load a small block of Q and K into SRAM (fast on-chip cache), compute that block's contribution to the output, update running softmax statistics, move to the next block. Never materialise the full matrix in HBM.",
    keyTerms: [
      { term: "HBM (High Bandwidth Memory)", def: "The main GPU VRAM — large (40-80GB) but relatively slow to access. This is the bottleneck in standard attention." },
      { term: "SRAM", def: "Tiny (20MB) but extremely fast on-chip cache. Flash Attention keeps computation here to avoid slow HBM round-trips." },
      { term: "Tiling", def: "Breaking the N×N computation into small blocks that fit in SRAM. Process each block independently, accumulate results." },
      { term: "Online softmax", def: "Softmax needs the full row to normalise. Flash Attention maintains running (max, sum) statistics across tiles to compute exact softmax without seeing all values at once." },
    ],
    tradeoff: "Mathematically identical output to dense attention — zero quality loss. 2-4× faster training, O(N) memory instead of O(N²). The only downside is complex GPU kernel implementation.",
    usedIn: "GPT-4, LLaMA 2/3, Mistral, most modern LLMs",
    steps: [
      { label: "Tile (0,0) → SRAM", desc: "Rows 0–3, cols 0–3 loaded into fast SRAM. Attention scores computed entirely on-chip. Running softmax stats (max value, normalisation sum) initialised." },
      { label: "Tile (0,1) → SRAM", desc: "Rows 0–3, cols 4–7. Previous softmax stats carried forward and updated. Output for these rows partially accumulated. Still no full matrix in HBM." },
      { label: "Tile (1,0) → SRAM", desc: "Rows 4–7, cols 0–3. New softmax stats started for this row range. Each tile is independent — GPU kernel loops over tiles sequentially." },
      { label: "Tile (1,1) → rescale", desc: "Final tile. Accumulated outputs rescaled using total softmax statistics from all tiles. Exact same result as computing the full matrix — just never stored it." },
    ],
  },
  paged: {
    label: "Paged Attention",
    color: "#f472b6",
    shortDesc: "Store the KV cache in non-contiguous memory pages like an OS",
    analogy: "Your computer doesn't need one giant free block of RAM for each program — it splits memory into pages and maps them via a page table. Paged Attention does the same for the attention KV cache.",
    whatIs: "During inference, transformers cache the Key and Value tensors for all past tokens (KV cache) to avoid recomputing them. Naively, each request pre-allocates a contiguous chunk for its maximum possible length — wasting most of it. Paged Attention stores KV cache in fixed-size non-contiguous physical blocks, managed by a page table mapping logical positions to physical locations.",
    keyTerms: [
      { term: "KV cache", def: "Stored Key and Value tensors from previous tokens. Avoids recomputing them on every new token. Can consume 30-50% of GPU memory during inference." },
      { term: "Memory fragmentation", def: "When you pre-allocate large contiguous blocks, gaps appear as requests finish. Like a half-empty parking lot where cars are spread out with no room for buses." },
      { term: "Page table", def: "A lookup table: logical token position → physical memory block address. Borrowed directly from OS virtual memory management." },
      { term: "Physical block", def: "A fixed-size chunk of GPU memory (e.g. 16 tokens × d_model). Allocated on-demand as sequences grow." },
    ],
    tradeoff: "Near-zero memory waste (less than 4% fragmentation vs 60-80% with naive allocation). Enables much larger batch sizes and higher GPU utilisation during serving. No quality change — same computation, different memory layout.",
    usedIn: "vLLM (the primary inference serving engine), TensorRT-LLM",
    steps: [
      { label: "Page 0: tokens 0–1", desc: "First physical block allocated for this request's KV cache. Block holds Keys and Values for tokens 0–1. Page table entry: logical[0] → physical block A." },
      { label: "Page 1: tokens 4–5", desc: "Block B assigned for tokens 4–5 of a different request. Non-contiguous in memory — no wasted pre-allocated space between them." },
      { label: "Page 2: tokens 2–3 (new request)", desc: "A new request gets block C for its first tokens. The page table handles the indirection — attention kernel just follows the table to find the right physical blocks." },
      { label: "Page 3: tokens 6–7", desc: "As sequence grows, a new free block is assigned. Memory only allocated when actually needed — no worst-case pre-allocation." },
    ],
  },
  local: {
    label: "Local (Sliding Window) Attention",
    color: "#c084fc",
    shortDesc: "Each token only attends to its nearby neighbors",
    analogy: "Reading a book by only looking at the current sentence plus the two before and after it — you catch local context without re-reading the whole book.",
    whatIs: "Each token attends only to tokens within a fixed window of size w around it (w/2 left, w/2 right). The attention matrix becomes a diagonal band instead of a full square. For a window of size w, each token has exactly w attention scores instead of N.",
    keyTerms: [
      { term: "Window size (w)", def: "How many neighboring tokens each token can see. Window of 512 means ±256 tokens. Larger window = more context, more compute." },
      { term: "Diagonal band", def: "The resulting attention pattern — only cells near the main diagonal are computed. Everything else is zero (masked out)." },
      { term: "Receptive field", def: "After multiple transformer layers, local attention can still capture long-range dependencies — information propagates layer by layer like a telephone chain." },
      { term: "Global tokens (hybrid)", def: "Often a few special tokens (like [CLS]) are given global attention on top of local, to maintain some long-range capacity." },
    ],
    tradeoff: "O(N·w) complexity — linear in sequence length for fixed window size. Great for very long documents. Limitation: direct long-range dependencies require many layers to propagate. A word at position 1 can only reach position 1000 in ⌈1000/w⌉ layers.",
    usedIn: "Longformer, BigBird, Mistral (grouped-query variant), Gemma",
    steps: [{ label: "Sliding window band", desc: "Each token (row) attends only to tokens within ±2 positions (diagonal band). The white cells are never computed — zero attention scores, masked before softmax." }],
  },
};

function AttentionGrid({ type, step, color, size = 8 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${size}, 1fr)`,
      gap: 2,
      padding: 8,
      background: "#080f1a",
      borderRadius: 8,
      border: `1px solid ${color}33`,
    }}>
      {Array.from({ length: size * size }).map((_, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const active = isActive(r, c, type, step);
        return (
          <div key={i} style={{
            width: 20, height: 20,
            borderRadius: 2,
            background: active ? color : "#0f1f35",
            opacity: active ? 0.9 : 0.25,
            transition: "all 0.35s ease",
            boxShadow: active ? `0 0 4px ${color}66` : "none",
          }} />
        );
      })}
    </div>
  );
}

function TermPill({ term, def }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "transparent",
        border: "1px solid #1e3a5f",
        borderRadius: 6,
        padding: "4px 10px",
        color: "#7dd3fc",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "border-color 0.2s",
      }}>
        <span style={{ color: open ? "#38bdf8" : "#475569", fontSize: 10 }}>{open ? "▼" : "▶"}</span>
        {term}
      </button>
      {open && (
        <div style={{
          marginTop: 4,
          marginLeft: 10,
          padding: "8px 12px",
          background: "#0d1f35",
          borderRadius: 6,
          borderLeft: "2px solid #1e3a5f",
          fontSize: 12,
          color: "#94a3b8",
          lineHeight: 1.7,
          maxWidth: 360,
        }}>
          {def}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("dense");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mech = MECHANISMS[active];
  const maxStep = mech.steps.length - 1;

  useEffect(() => { setStep(0); setPlaying(false); }, [active]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep(s => {
        if (s >= maxStep) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [playing, maxStep]);

  const tabs = Object.entries(MECHANISMS);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#030b17",
      fontFamily: "'Sora', sans-serif",
      color: "#e2e8f0",
      padding: "32px 16px 60px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.25em", color: "#334155", textTransform: "uppercase", marginBottom: 12 }}>
          Interactive Reference
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          Attention Mechanisms
          <span style={{ display: "block", fontSize: 14, fontWeight: 300, color: "#64748b", marginTop: 6, letterSpacing: "0.01em" }}>
            Click any mechanism to explore how it works
          </span>
        </h1>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center",
        marginBottom: 28, maxWidth: 760, margin: "0 auto 28px",
      }}>
        {tabs.map(([key, m]) => (
          <button key={key} onClick={() => setActive(key)} style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: `1px solid ${active === key ? m.color : "#1e293b"}`,
            background: active === key ? m.color + "18" : "transparent",
            color: active === key ? m.color : "#475569",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: active === key ? 600 : 400,
            cursor: "pointer",
            letterSpacing: "0.04em",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}>
            {m.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: 780, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>

        {/* Left: Grid + steps */}
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
            <div style={{ fontSize: 18, fontWeight: 700, color: mech.color, marginBottom: 2, letterSpacing: "-0.02em" }}>
              {mech.label}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>{mech.shortDesc}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <AttentionGrid type={active} step={step} color={mech.color} size={GRID} />
          </div>

          {/* Axis labels */}
          <div style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155" }}>
            ← tokens (Keys) →
          </div>

          {/* Step display */}
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

          {/* Controls */}
          {maxStep > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
              <button onClick={() => { setPlaying(false); setStep(s => Math.max(0, s - 1)); }} style={btn("#0d1f35", "#94a3b8")}>←</button>
              {mech.steps.map((_, i) => (
                <button key={i} onClick={() => { setPlaying(false); setStep(i); }} style={{
                  width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: i === step ? mech.color : "#1e3a5f",
                  padding: 0, transition: "background 0.2s",
                }} />
              ))}
              <button onClick={() => setPlaying(p => !p)} style={btn(mech.color + "22", mech.color)}>
                {playing ? "⏸" : "▶"}
              </button>
              <button onClick={() => { setPlaying(false); setStep(s => Math.min(maxStep, s + 1)); }} style={btn("#0d1f35", "#94a3b8")}>→</button>
            </div>
          )}
        </div>

        {/* Right: Explanation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Analogy */}
          <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              💡 Intuition
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "#cbd5e1", fontStyle: "italic" }}>
              "{mech.analogy}"
            </p>
          </div>

          {/* How it works */}
          <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              How it works
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "#94a3b8" }}>
              {mech.whatIs}
            </p>
          </div>

          {/* Key Terms */}
          <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
              Key terms — click to expand
            </div>
            {mech.keyTerms.map(({ term, def }) => <TermPill key={term} term={term} def={def} />)}
          </div>

          {/* Tradeoffs */}
          <div style={{ background: "#080f1a", border: `1px solid ${mech.color}33`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: mech.color, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              Trade-offs
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "#94a3b8" }}>
              {mech.tradeoff}
            </p>
            <div style={{ marginTop: 10, fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
              Used in: <span style={{ color: mech.color }}>{mech.usedIn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini overview grid at bottom */}
      <div style={{ maxWidth: 780, margin: "28px auto 0" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14, textAlign: "center" }}>
          All mechanisms at a glance
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {tabs.map(([key, m]) => (
            <button key={key} onClick={() => setActive(key)} style={{
              background: active === key ? m.color + "14" : "#080f1a",
              border: `1px solid ${active === key ? m.color : "#1e293b"}`,
              borderRadius: 10, padding: "10px 6px",
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5,
              }}>
                {Array.from({ length: 25 }).map((_, i) => {
                  const r = Math.floor(i / 5);
                  const c = i % 5;
                  const a = isActive(r, c, key, 0);
                  return (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: 1,
                      background: a ? m.color : "#0f1f35",
                      opacity: a ? 0.8 : 0.2,
                    }} />
                  );
                })}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: active === key ? m.color : "#475569",
                textAlign: "center", lineHeight: 1.3
              }}>
                {m.label.split(" ")[0]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function btn(bg, color) {
  return {
    padding: "5px 10px", borderRadius: 6, border: "none",
    background: bg, color, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    transition: "opacity 0.2s",
  };
}
