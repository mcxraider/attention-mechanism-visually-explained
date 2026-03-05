export type MechanismKey = "dense" | "linear" | "sparse" | "flash" | "paged" | "local";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface KeyTerm { term: string; def: string }
export interface Step    { label: string; desc: string }
export interface Mechanism {
  label: string; color: string; shortDesc: string;
  complexity: string; level: Level; analogy: string;
  whatIs: string; keyTerms: KeyTerm[]; tradeoff: string;
  usedIn: string; steps: Step[];
}

export const MECHANISMS: Record<MechanismKey, Mechanism> = {
  dense: {
    label: "Dense (Full) Attention",
    color: "#60a5fa",
    shortDesc: "Every token talks to every other token",
    complexity: "O(N²)",
    level: "Beginner",
    analogy: "Like a town hall meeting where everyone hears everyone else simultaneously.",
    whatIs: "In attention, each word (token) asks: 'which other words should I pay attention to?' Dense attention says: look at ALL of them. Every token computes a relevance score against every other token. Note: autoregressive models (GPT, LLaMA) apply a causal mask — the upper triangle is zeroed out so each token can only attend to earlier tokens.",
    keyTerms: [
      { term: "Token", def: "A chunk of text — usually a word or subword. 'unhappy' might split into 'un' + 'happy'." },
      { term: "Attention score", def: "A number measuring how relevant one token is to another. Higher = pay more attention." },
      { term: "N×N matrix", def: "With N tokens, you need N² scores. 1000 tokens = 1,000,000 scores stored in memory." },
    ],
    tradeoff: "Perfect information — every word can influence every other. But memory and compute scale as O(N²). A 10× longer document costs 100× more. Fine for short sequences, prohibitive for long ones.",
    usedIn: "Original Transformer, BERT, GPT-2",
    steps: [
      { label: "Query 0 scans all tokens", desc: "Row 0 (Query 0) attends to all N tokens. Each lit cell = one attention score computed between this query and a key." },
      { label: "Query 1 scans all tokens", desc: "Row 1 (Query 1) independently scores all N keys. Each query does its own full scan." },
      { label: "Query 2 scans all tokens", desc: "Row 2 continues the pattern. Every query must compare itself to every key token." },
      { label: "Full N×N matrix complete", desc: "All queries done — the complete N×N attention matrix. Every token pair has a score. This is why dense attention is O(N²): N queries × N keys." },
    ],
  },
  linear: {
    label: "Linear Attention",
    color: "#34d399",
    shortDesc: "Rewrite the math to avoid the N×N matrix entirely",
    complexity: "O(N)",
    level: "Advanced",
    analogy: "Instead of comparing every student's essay to every other essay, maintain a running class summary and compare each essay to that.",
    whatIs: "Standard attention uses softmax(QKᵀ)V which forces you to materialise the full N×N matrix. Linear attention rewrites this using a kernel trick: instead of comparing Q and K directly, it approximates the relationship so you can compute K·V first (a small d×d context matrix), then multiply by Q. Result: O(N) memory instead of O(N²). At N=16,000 tokens (a short book chapter), standard attention requires 256 million scores. Linear attention needs only ~16,000 — a 16,000× reduction in memory.",
    keyTerms: [
      { term: "Q, K, V", def: "Query, Key, Value — three learned projections of each token. Q = 'what am I looking for', K = 'what do I offer', V = 'what information I carry'." },
      { term: "Kernel trick", def: "Replace the expensive softmax(QKᵀ) with a factored approximation φ(Q)·(φ(K)ᵀV). Lets you reorder matrix multiplications." },
      { term: "O(N) memory", def: "Memory grows linearly with sequence length, not quadratically. 10× longer doc = 10× memory, not 100×." },
    ],
    tradeoff: "Much cheaper for long sequences. But the approximation loses some expressiveness — the model can't represent arbitrary attention patterns as precisely. Quality slightly below dense for tasks requiring precise long-range matching.",
    usedIn: "Performer, cosFormer, RWKV",
    steps: [
      { label: "Accumulate K→V context", desc: "Keys and Values are multiplied to form a small d×d context matrix (shown as 2 columns). Each token updates this running summary — no N×N matrix ever materialised." },
      { label: "All queries read from context", desc: "Every query vector multiplies against the same d×d context matrix. All N queries use the same 2 context columns — not pairwise scores. This is why linear attention is O(N), not O(N²)." },
    ],
  },
  sparse: {
    label: "Sparse Attention",
    color: "#f59e0b",
    shortDesc: "Only compute attention for strategically chosen token pairs",
    complexity: "O(N√N)",
    level: "Intermediate",
    analogy: "In a large company, the CEO talks to all department heads (global), and each employee talks to their immediate teammates (local). Nobody wastes time with unrelated departments.",
    whatIs: "Instead of computing all N² scores, sparse attention picks a structured subset: global tokens that attend everywhere (e.g. [CLS]), local neighbors within a window, and strided tokens at regular intervals. You get most of the information flow at a fraction of the cost.",
    keyTerms: [
      { term: "Global tokens", def: "Special tokens (like [CLS] in BERT) that attend to AND are attended by all other tokens. They aggregate global context." },
      { term: "Local window", def: "Each token attends to its k nearest neighbors. Captures short-range dependencies cheaply." },
      { term: "Strided attention", def: "Every nth token attends to a wider span, creating 'highways' for long-range information." },
    ],
    tradeoff: "O(N√N) or O(N log N) complexity — dramatically cheaper than dense for long sequences. Risk: if important relationships fall outside the chosen sparse pattern, they're missed entirely.",
    usedIn: "Sparse Transformer (OpenAI), BigBird, Longformer",
    steps: [
      { label: "Global tokens", desc: "Row 0 and col 0 = global tokens. They attend to AND are attended by every other token. This gives all-to-all information flow through a single hub." },
      { label: "+ Local neighbors", desc: "Each token also attends to its immediate neighbors (±1 position). Self-attention on the diagonal captures the current token's own context." },
      { label: "+ Strided connections", desc: "Strided columns (every 4th, col 4 onward) add long-range highways. Information can jump across the sequence bidirectionally." },
    ],
  },
  flash: {
    label: "Flash Attention",
    color: "#38bdf8",
    shortDesc: "Same math as dense, but computed in fast memory tile by tile",
    complexity: "O(N²) compute, O(N) memory",
    level: "Advanced",
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
    complexity: "O(N²) compute, O(N) memory",
    level: "Advanced",
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
    complexity: "O(N·w)",
    level: "Beginner",
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
    steps: [
      { label: "Window on tokens 0–1", desc: "Tokens 0–1 look at their neighborhood (±2 positions). Only a small band near the diagonal is computed for this window." },
      { label: "Window slides to tokens 3–4", desc: "The window moves right. Tokens 3–4 attend to their local context. Tokens outside the window are invisible." },
      { label: "Window slides to tokens 5–6", desc: "Window continues sliding. Each token only ever computes w attention scores — not N." },
      { label: "Full diagonal band", desc: "All windows together form the diagonal band. O(N·w) total — linear in N for fixed window size w, not O(N²)." },
    ],
  },
};
