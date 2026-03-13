import type { MechanismKey } from "./mechanisms";

export interface MathStep {
  title: string;
  body: string;
  formula?: string;
}

export interface MemoryItem {
  label: string;
  detail: string;
  cost: "cheap" | "expensive" | "neutral";
}

export interface DeepDiveContent {
  tagline: string;
  intuition: string[];
  analogy: { title: string; body: string };
  math: MathStep[];
  memoryCompute: {
    overview: string;
    items: MemoryItem[];
  };
  tradeoffs: {
    pros: string[];
    cons: string[];
    whenToUse: string;
    whenToAvoid: string;
  };
}

export const DEEP_DIVE: Record<MechanismKey, DeepDiveContent> = {
  dense: {
    tagline: "Every token attends to every other token — perfect information, quadratic cost.",
    intuition: [
      "In attention, each token asks: 'which other tokens should I pay attention to right now?' Dense attention answers that question exhaustively — every token scores every other token. If your sequence has N tokens, you compute N × N scores.",
      "The mechanism works by projecting each token into three vectors: a Query (Q, 'what am I looking for?'), a Key (K, 'what do I offer?'), and a Value (V, 'what information do I carry?'). Each query is then compared to every key to produce a relevance score, which is normalised with softmax to form attention weights. The output is a weighted sum of the values.",
      "Autoregressive models like GPT apply a causal mask — the upper triangle of the score matrix is set to −∞ before softmax. This means each token can only attend to tokens that appeared before it, preventing it from 'cheating' by looking at future tokens during training.",
      "The full N×N score matrix must be computed and stored in GPU memory. At N = 1000 tokens that is 1 million scores. At N = 16 000 tokens (a short book chapter) that is 256 million scores. This quadratic memory footprint is the fundamental limitation of dense attention and the reason every other mechanism on this page exists.",
    ],
    analogy: {
      title: "A town hall where everyone hears everyone else",
      body: "Imagine a town hall meeting where every person simultaneously whispers to every other person in the room. Every pair of people exchanges a message. Nobody is left out. You get perfect information flow, but the number of whispered conversations scales as N² — double the crowd, quadruple the noise.",
    },
    math: [
      {
        title: "Project tokens into Q, K, V",
        body: "Each input token embedding x is linearly projected into three vectors using learned weight matrices W_Q, W_K, W_V. These projections are what the model learns to optimise.",
        formula: "Q = X·W_Q,   K = X·W_K,   V = X·W_V",
      },
      {
        title: "Compute raw attention scores",
        body: "Take the dot product of every query with every key. This produces an N×N score matrix. Dividing by √d_k stabilises gradients — without it, dot products grow large in magnitude as d_k increases, pushing softmax into regions with near-zero gradients.",
        formula: "Scores = Q · Kᵀ / √d_k",
      },
      {
        title: "Apply softmax to get attention weights",
        body: "Softmax is applied row-wise, converting raw scores into a probability distribution. Each row sums to 1. The causal mask (for autoregressive models) zeroes out entries where a query attends to a future key by replacing them with −∞ before softmax.",
        formula: "A = softmax(Scores)   [shape: N × N]",
      },
      {
        title: "Compute weighted output",
        body: "Multiply the attention weight matrix by V. Each output token is a weighted sum of all value vectors, where the weights reflect relevance. Tokens that received high attention scores contribute more to the output.",
        formula: "Output = A · V   [shape: N × d_v]",
      },
      {
        title: "Why O(N²)?",
        body: "The bottleneck is the N×N score matrix — it requires O(N²) memory to store, and O(N²·d_k) compute to produce. Every row requires N dot products. There is no shortcut: every query must compare itself against every key.",
        formula: "Memory: O(N²)   Compute: O(N² · d_k)",
      },
    ],
    memoryCompute: {
      overview: "The dominant cost is the N×N attention score matrix. At N = 4096 tokens (a long prompt) with float16, the score matrix alone occupies 32 MB per attention head — and modern transformers have 32–128 heads across many layers.",
      items: [
        { label: "Score matrix (N×N)", detail: "Must be fully materialised in HBM to compute softmax row-wise. This is the O(N²) memory wall.", cost: "expensive" },
        { label: "Q, K, V projections (3×N×d_k)", detail: "Linear in N — not the bottleneck. These are typically much smaller than the score matrix for long sequences.", cost: "neutral" },
        { label: "Output matrix (N×d_v)", detail: "Also linear in N. Cheap compared to the score matrix.", cost: "cheap" },
        { label: "Causal mask", detail: "A boolean N×N matrix masking future tokens. Same shape as the score matrix — adds memory but not compute.", cost: "expensive" },
        { label: "Compute (FLOPs)", detail: "2·N²·d_k for the QKᵀ multiply, plus 2·N²·d_v for the AV multiply. Both O(N²).", cost: "expensive" },
      ],
    },
    tradeoffs: {
      pros: [
        "Perfect recall — every token can directly attend to every other token in one layer",
        "Mathematically exact — no approximation, no information loss",
        "Simple to implement and reason about",
        "Works well for short sequences (N < 2048)",
      ],
      cons: [
        "O(N²) memory: 10× longer sequence = 100× more memory",
        "O(N²) compute: training on long documents becomes prohibitively slow",
        "Full N×N matrix must fit in GPU VRAM — limits maximum context length",
        "Slow HBM read/write bandwidth is the practical bottleneck (see Flash Attention)",
      ],
      whenToUse: "Short-to-medium sequences (up to ~4k tokens), research baselines, tasks where exact attention is critical, and any situation where you need the simplest correct implementation.",
      whenToAvoid: "Long documents, audio, video, or any modality where sequences routinely exceed 4k–8k tokens. At N = 32k tokens the score matrix requires ~2 GB per head — entirely impractical.",
    },
  },

  flash: {
    tagline: "Same math as dense attention, rewritten to never materialise the N×N matrix in slow memory.",
    intuition: [
      "Flash Attention produces mathematically identical outputs to dense attention — the same scores, the same softmax weights, the same final output. What changes is the order in which the computation happens, and crucially, where in the memory hierarchy intermediate values are stored.",
      "Standard attention materialises the full N×N score matrix in HBM (GPU VRAM) — a large but slow memory. This forces massive data transfers between the compute units and memory. Flash Attention avoids this by tiling the computation: it loads a small block of Q rows and K columns into SRAM (tiny, fast on-chip cache), computes that block's partial output, then moves on to the next block.",
      "The hard part is softmax. Normally softmax over a row requires you to see all N scores in that row before normalising. Flash Attention solves this with online softmax — it maintains a running maximum and normalisation sum across tiles. When the next tile arrives, it rescales the previously accumulated output to account for the new information. The final result is provably identical to computing softmax over the full row.",
      "The memory saving comes from the fact that the N×N score matrix never lands in HBM. Only O(N) output and O(√M) tile buffers are held in SRAM at any moment. For N = 16k tokens this is the difference between needing ~512 MB of HBM for the score matrix versus a few kilobytes of SRAM.",
    ],
    analogy: {
      title: "Grading essays on a small fast desk",
      body: "You have 1000 essays to mark, but your permanent desk (HBM) is far away and slow to access. Instead, you pick up 25 essays at a time, carry them to your tiny fast workbench (SRAM), mark them in full detail, record your running totals, then swap in the next 25. You never spread all 1000 essays on the slow desk — but your final grades are exactly the same as if you had.",
    },
    math: [
      {
        title: "Define tiles",
        body: "Divide the N queries into blocks of size B_r (rows) and the N keys/values into blocks of size B_c (columns). The tile size is chosen so that a Q-tile, K-tile, and V-tile fit simultaneously in SRAM.",
        formula: "B_r ≈ B_c ≈ √(M / 4d),   where M = SRAM size",
      },
      {
        title: "Online softmax: initialise running state",
        body: "For each query row, maintain a running maximum m and a running normalisation sum l. Initialise both to 0 before the first tile.",
        formula: "m⁽⁰⁾ = −∞,   l⁽⁰⁾ = 0,   O⁽⁰⁾ = 0",
      },
      {
        title: "Process one tile",
        body: "Load Q[i], K[j], V[j] into SRAM. Compute the local score block S = Q[i]·K[j]ᵀ/√d. Find the new running max and sum, then rescale the accumulated output and add the new contribution.",
        formula: "m_new = max(m, rowmax(S));   l_new = e^(m − m_new)·l + rowsum(e^(S − m_new))",
      },
      {
        title: "Rescale accumulated output",
        body: "Before adding the new tile's contribution, scale the old output down by e^(m_old − m_new) to account for the updated maximum. This keeps the running sum equivalent to a full-row softmax.",
        formula: "O_new = diag(e^(m − m_new))·O + e^(S − m_new)·V[j]",
      },
      {
        title: "Final normalisation",
        body: "After all tiles are processed for a query row, divide the accumulated output by the final l to complete the softmax normalisation. The result is provably equal to softmax(QKᵀ/√d)·V.",
        formula: "Output[i] = O / l   [identical to dense attention]",
      },
    ],
    memoryCompute: {
      overview: "Flash Attention uses O(N) HBM memory — the N×N score matrix never lands there. Compute is the same O(N²·d) as dense, but with far fewer HBM round-trips, which is the real bottleneck on modern GPUs.",
      items: [
        { label: "N×N score matrix in HBM", detail: "Never materialised. This is the key difference from dense attention.", cost: "cheap" },
        { label: "SRAM tile buffer", detail: "Only O(√M) bytes — one Q-tile + K-tile + V-tile fit in on-chip SRAM at once.", cost: "cheap" },
        { label: "Running softmax stats (m, l)", detail: "O(N) — one scalar per query row. Negligible.", cost: "cheap" },
        { label: "Output matrix (N×d)", detail: "Written to HBM once at the end. O(N·d) — same as dense.", cost: "neutral" },
        { label: "HBM I/O passes", detail: "O(N²/M) reads of K and V. Each K/V block is read once per Q-tile. Total I/O is O(N²·d/M) — much less than dense's O(N²) full-matrix reads.", cost: "neutral" },
      ],
    },
    tradeoffs: {
      pros: [
        "Zero quality loss — mathematically identical output to dense attention",
        "2–4× faster training due to reduced HBM bandwidth pressure",
        "O(N) memory instead of O(N²) — enables much longer context",
        "Directly enables 32k–128k+ token contexts in modern LLMs",
      ],
      cons: [
        "Complex GPU kernel implementation (thousands of lines of CUDA/Triton)",
        "Requires custom backward pass with recomputation — harder to implement than autograd",
        "Tile size must be tuned per GPU architecture (SRAM size varies)",
        "No reduction in total FLOPs — same compute, just faster in practice",
      ],
      whenToUse: "Virtually always when training or running inference on modern hardware. Flash Attention is now the default in PyTorch, JAX, and most major LLM frameworks. There is rarely a reason to use standard dense attention on a GPU.",
      whenToAvoid: "Extremely memory-constrained environments where SRAM is too small to hold even a single tile, or when debugging attention weights (Flash Attention doesn't materialise the weight matrix, making it harder to inspect).",
    },
  },

  linear: {
    tagline: "Reorder matrix multiplications to avoid the N×N score matrix entirely — O(N) at the cost of approximation.",
    intuition: [
      "Standard attention computes softmax(QKᵀ)V. The bottleneck is QKᵀ: it produces an N×N matrix. Linear attention observes that if you drop the softmax and replace it with a kernel function, you can exploit matrix associativity to change the order of operations from (QKᵀ)V to Q(KᵀV).",
      "KᵀV produces a d×d matrix — tiny. You compute it once and reuse it for all queries. Each query then does a cheap multiplication against this d×d context summary instead of scoring all N keys. The total cost is O(N·d²) instead of O(N²·d). For N >> d (long sequences with modest dimension), this is a dramatic saving.",
      "The catch is the kernel approximation. Softmax's normalisation gives each attention row a meaningful probability distribution — tokens with high scores dominate the output. When you drop softmax, the model loses some of this precision. The attention pattern becomes less sharp, which hurts tasks requiring precise long-range matching (like exact coreference resolution).",
      "Linear attention works especially well as a recurrent model. The d×d context matrix KᵀV acts like a recurrent state — each new token updates it by adding kᵀ·v. This makes linear attention ideal for streaming and autoregressive inference, where new tokens arrive one at a time and you don't want to recompute all past interactions.",
    ],
    analogy: {
      title: "A class summary instead of pairwise essay comparisons",
      body: "Grading by comparing every student's essay to every other student's essay takes N² comparisons. Instead, maintain a running class summary — a compact d×d matrix representing the collective knowledge of all essays seen so far. Each new essay is compared against the summary, not against every previous essay. You lose some nuance but save enormously on comparisons.",
    },
    math: [
      {
        title: "Standard attention recap",
        body: "Dense attention computes (softmax(QKᵀ/√d))·V. The N×N intermediate must be fully materialised. We want to avoid it.",
        formula: "Output = softmax(Q·Kᵀ / √d) · V   [O(N²) cost]",
      },
      {
        title: "Drop softmax, introduce kernel",
        body: "Replace softmax with a kernel function: sim(q, k) = φ(q)·φ(k)ᵀ where φ is a feature map (e.g. ELU+1, or random Fourier features). Now the attention weights are non-negative but not normalised to sum to 1.",
        formula: "Attn(Q, K, V)_i = Σⱼ φ(qᵢ)·φ(kⱼ)ᵀ · vⱼ / Σⱼ φ(qᵢ)·φ(kⱼ)ᵀ",
      },
      {
        title: "Exploit associativity",
        body: "The kernel output can be rewritten using associativity of matrix multiplication. Instead of (φ(Q)·φ(K)ᵀ)·V which forces the N×N intermediate, compute φ(Q)·(φ(K)ᵀ·V). The latter computes a d×d matrix first, then multiplies by each query.",
        formula: "φ(Q)·(φ(K)ᵀ·V)   vs   (φ(Q)·φ(K)ᵀ)·V",
      },
      {
        title: "The d×d context matrix",
        body: "φ(K)ᵀ·V has shape d×d. It is computed once and reused for all N queries. Similarly, the denominator Σⱼ φ(kⱼ) is a length-d vector computed once.",
        formula: "C = φ(K)ᵀ · V   [shape d×d,  O(N·d²) to build]",
      },
      {
        title: "Final complexity",
        body: "Building C costs O(N·d²). Each query costs O(d²) to look up. Total: O(N·d²). For N >> d this beats O(N²·d) by a factor of N/d.",
        formula: "O(N·d²)  vs  O(N²·d)  →  linear in N when d << N",
      },
    ],
    memoryCompute: {
      overview: "The d×d context matrix is the only large intermediate structure. At d = 64 and float16, it is just 8 KB — negligible. Memory scales linearly with sequence length.",
      items: [
        { label: "N×N score matrix", detail: "Never computed. This is the entire point of linear attention.", cost: "cheap" },
        { label: "Context matrix KᵀV (d×d)", detail: "Tiny — typically 8–256 KB regardless of sequence length N. Reused for all N queries.", cost: "cheap" },
        { label: "Feature map φ(Q) and φ(K) (N×d)", detail: "O(N·d) — linear in N. Cheap.", cost: "neutral" },
        { label: "Normalisation denominator (N×1)", detail: "One scalar per query: Σⱼ φ(qᵢ)·φ(kⱼ)ᵀ. Linear in N.", cost: "cheap" },
        { label: "Quality vs memory trade-off", detail: "The approximation error grows when the true attention pattern is sharp (a few high-scoring keys dominate). Tasks requiring precise matching are most affected.", cost: "neutral" },
      ],
    },
    tradeoffs: {
      pros: [
        "True O(N) memory — not just better constants, but linear scaling",
        "O(N·d²) compute — linear in sequence length for fixed d",
        "Natural recurrent formulation — ideal for streaming and online processing",
        "Autoregressive inference is fast: each new token does one O(d²) update",
      ],
      cons: [
        "Approximation — removing softmax degrades quality on precision-critical tasks",
        "Worse on tasks requiring sharp attention (coreference, symbolic reasoning)",
        "Not a drop-in replacement: requires retraining from scratch, not fine-tuning",
        "Choice of kernel function φ significantly affects quality — active research area",
      ],
      whenToUse: "Very long sequences (N > 32k) where O(N²) is impossible, streaming applications, and tasks where recall quality degrades gracefully (e.g. long-document summarisation, audio processing).",
      whenToAvoid: "Tasks requiring exact long-range matching — machine translation, code generation, reasoning tasks. Also avoid when working with pretrained dense models — linear attention cannot simply be bolted on.",
    },
  },

  sparse: {
    tagline: "Pick a structured subset of token pairs to attend to — most of the information flow at a fraction of the cost.",
    intuition: [
      "Dense attention spends O(N²) compute ensuring every token pair is scored. But most of these pairs carry negligible information — a token in paragraph 1 rarely needs to directly influence a token in paragraph 50. Sparse attention asks: which pairs actually matter, and can we skip the rest?",
      "The answer depends on the task, but three connectivity patterns cover most cases. Global tokens attend everywhere and are attended by everyone — they act as information hubs that aggregate context from across the entire sequence. Local tokens attend to their k nearest neighbours — short-range context is almost always relevant. Strided tokens attend at regular intervals, creating information 'highways' across the sequence.",
      "The combination of global + local + strided means that any two tokens can exchange information within a constant number of hops, even if they don't directly attend to each other. Information propagates: a local token reaches a global token in one hop; the global token then reaches any other token in one more hop.",
      "The theoretical complexity depends on pattern. With √N global tokens, each attending to all N positions, plus local windows of size √N, total non-zero cells are approximately N√N — giving O(N√N) complexity. In practice, the speedup over dense attention is most dramatic at large N.",
    ],
    analogy: {
      title: "A company's communication hierarchy",
      body: "In a large company, the CEO talks to all department heads (global tokens), each department head talks to all team members in their department (local window), and weekly all-hands meetings create regular cross-department exchanges (strided). Nobody in Engineering wastes time individually messaging every person in HR — but through the hierarchy, any message can reach anyone in a few hops.",
    },
    math: [
      {
        title: "Define the allowed set S(i)",
        body: "For each query token i, define S(i) as the set of key positions it is allowed to attend to. Only pairs (i, j) where j ∈ S(i) are computed. All other pairs are treated as −∞ before softmax.",
        formula: "Output_i = softmax({score(qᵢ, kⱼ) : j ∈ S(i)}) · {vⱼ : j ∈ S(i)}",
      },
      {
        title: "Global tokens (Ng tokens attend everywhere)",
        body: "Let Ng be the number of global tokens (typically 1–64). Each global token has S(i) = {0, …, N−1}: all N positions. Their contribution to compute is Ng × N — manageable if Ng << N.",
        formula: "Cost of global tokens: Ng · N   (e.g. 64 · 16000 = 1M  vs  16000² = 256M)",
      },
      {
        title: "Local window (each token sees w neighbours)",
        body: "Each non-global token attends to a window of size w around it. |S(i)| = w, so total non-zero local cells = N · w.",
        formula: "Cost of local attention: N · w",
      },
      {
        title: "Strided attention (every k-th position)",
        body: "Strided tokens attend to positions {0, k, 2k, 3k, …} giving |S(i)| = N/k per strided token. Total cells = N · (N/k) — adds another O(N²/k) term, but k is usually set so this is manageable.",
        formula: "Cost of strided: N · (N/stride)",
      },
      {
        title: "Total complexity",
        body: "Setting w = k = √N makes all three terms O(N√N). In practice, Longformer uses fixed w (e.g. 512) so local cost is O(N) — the dominant scaling depends on the chosen pattern.",
        formula: "O(N√N) with w = √N,  or O(N·w) if w is fixed",
      },
    ],
    memoryCompute: {
      overview: "Only |S(i)| entries per row need storage, not N entries. Sparse matrix storage means memory scales with total non-zero cells, not N².",
      items: [
        { label: "Score matrix storage", detail: "Only non-zero cells stored: ~N√N entries vs N² for dense. At N=4096 and √N≈64, that's ~262k vs ~16M cells.", cost: "neutral" },
        { label: "Global token attention", detail: "Ng rows × N columns — unavoidable O(N) per global token. Keep Ng small.", cost: "neutral" },
        { label: "Local attention buffers", detail: "N × w entries — linear in N for fixed window size w. Very cheap.", cost: "cheap" },
        { label: "Sparse kernel overhead", detail: "Implementing efficient sparse attention on GPUs is non-trivial. Block-sparse operations are faster than arbitrary sparsity.", cost: "neutral" },
        { label: "Pattern mismatch risk", detail: "If important long-range pairs fall outside the defined pattern, they are permanently lost — no memory cost, but quality cost.", cost: "expensive" },
      ],
    },
    tradeoffs: {
      pros: [
        "O(N√N) or O(N·w) — dramatically cheaper than dense for long sequences",
        "Global tokens preserve some all-to-all information flow",
        "Works with exact softmax — no kernel approximation like linear attention",
        "Easy to extend: can layer multiple pattern types (global + local + strided)",
      ],
      cons: [
        "Long-range pairs outside the pattern are completely missed — no approximation, just absent",
        "Sparse GPU kernels are harder to optimise than dense — may not fully realise theoretical speedup",
        "Choosing the right pattern requires domain knowledge",
        "Fixed patterns don't adapt to content — the model can't learn which pairs matter most",
      ],
      whenToUse: "Long structured documents (books, code, scientific papers) where local context dominates and a few special tokens (section headers, [CLS]) can serve as global hubs. Also effective for structured data like genomics or time series.",
      whenToAvoid: "Tasks where long-range dependencies are diffuse and unpredictable (e.g. complex reasoning, dialogue where any turn might be relevant). In these cases, the fixed sparse pattern will miss important pairs.",
    },
  },

  local: {
    tagline: "Restrict each token to a sliding window of nearby neighbours — linear cost, local context.",
    intuition: [
      "Local attention is the simplest possible restriction on dense attention: each token can only see the w tokens immediately surrounding it. The attention matrix shrinks from a full N×N square to a thin diagonal band of width w. Total scores computed: N × w instead of N².",
      "For fixed w (e.g. 512), the cost is perfectly linear in N — doubling the sequence length exactly doubles the computation. This is as good as it gets asymptotically. Processing a 100k-token document takes no more than ~200× the cost of a 512-token document, instead of the ~38,000× it would cost with dense attention.",
      "The obvious concern is long-range dependencies. If a pronoun at position 5000 must resolve to a noun at position 1, local attention can't connect them in a single layer. But in a deep model, information propagates through the layers. Each layer expands the effective 'receptive field' by w positions — after L layers a token has indirect access to tokens up to L×w positions away.",
      "Many production models combine local and global attention in a hybrid: most tokens use local attention for efficiency, while a small set of special tokens (like [CLS] or task-specific markers) use global attention. This recovers long-range capacity at minimal cost.",
    ],
    analogy: {
      title: "Reading with a spotlight",
      body: "Imagine reading a long book but your desk only illuminates a window of about five sentences at a time. You can read efficiently and understand local context perfectly. To understand how the ending relates to the opening, your brain connects information encountered at different times as you move the spotlight — it doesn't re-read everything simultaneously.",
    },
    math: [
      {
        title: "Define the window",
        body: "For each query token at position i, compute scores only against key positions in the range [i − w/2, i + w/2]. All other positions are masked to −∞.",
        formula: "S(i) = {j : |i − j| ≤ w/2}   →   |S(i)| = w",
      },
      {
        title: "Total scores computed",
        body: "Each of the N tokens computes exactly w scores (fewer at the edges). Total scores = N × w — independent of N² interactions.",
        formula: "Total scores = N · w   [O(N·w) vs O(N²)]",
      },
      {
        title: "Receptive field growth across layers",
        body: "After one layer, each token has seen up to w positions. After L layers, tokens at the same position in layer L have indirectly aggregated information from up to L × w positions in the input. This telescoping receptive field is how local attention handles long-range dependencies.",
        formula: "Receptive field after L layers = L · w",
      },
      {
        title: "Memory: diagonal band storage",
        body: "Only cells within the window need storage. For an N × N matrix stored as a dense band, memory is N × w. At N = 32k and w = 512, that is 16M cells — vs 1B cells for dense. 64× reduction.",
        formula: "Memory: O(N·w)  [e.g. 32k×512 = 16M  vs  32k² = 1B]",
      },
      {
        title: "Layers needed for full coverage",
        body: "To connect tokens distance D apart, you need at least ⌈D/w⌉ layers. A model with L layers and window w can handle dependencies up to L×w positions away without any global tokens.",
        formula: "Layers for distance D: ⌈D / w⌉",
      },
    ],
    memoryCompute: {
      overview: "Memory and compute are both O(N·w) — linear in sequence length for a fixed window size. The trade-off is depth: more layers are needed to propagate long-range information.",
      items: [
        { label: "Attention scores per layer", detail: "N × w per layer. At w=512 and N=32768: 16M scores vs 1B for dense. 64× cheaper.", cost: "cheap" },
        { label: "Score matrix memory", detail: "O(N·w) — fits in memory even for very long sequences. No quadratic memory wall.", cost: "cheap" },
        { label: "Depth requirement", detail: "More layers needed to cover long-range dependencies. L×w must exceed the maximum relevant dependency distance.", cost: "neutral" },
        { label: "Edge effects", detail: "Tokens at the start and end of a sequence have smaller windows. Handle with padding or asymmetric windows.", cost: "neutral" },
        { label: "KV cache at inference", detail: "For streaming inference, only w KV entries need to be kept in cache — very memory efficient.", cost: "cheap" },
      ],
    },
    tradeoffs: {
      pros: [
        "O(N·w) — true linear scaling in sequence length for fixed window",
        "Very memory efficient at inference: KV cache bounded by window size",
        "Simple to implement — just a masking change from dense attention",
        "Effective for modalities with strong local structure: audio, DNA, image patches",
      ],
      cons: [
        "Long-range dependencies require depth: ⌈D/w⌉ layers to connect tokens distance D apart",
        "Cannot model truly non-local dependencies in a single layer",
        "Fixed window doesn't adapt — model can't learn that some tokens need longer range",
        "Underperforms dense on tasks requiring precise long-range matching without hybrid global tokens",
      ],
      whenToUse: "Very long sequences with strong local structure (audio, genomics, sliding-context text generation). Also effective as the local component in hybrid architectures that add a few global tokens (Longformer, BigBird).",
      whenToAvoid: "Tasks where any token might need to attend to any other token across the full sequence length — e.g. question answering where the answer span is far from the question, or knowledge-intensive generation without retrieval.",
    },
  },

  paged: {
    tagline: "Borrow OS virtual memory management for the KV cache — eliminate fragmentation, maximise serving throughput.",
    intuition: [
      "Paged Attention doesn't change the attention computation at all. The scores, softmax, and output are identical to dense attention. What it changes is how the KV cache is stored in GPU memory during inference serving.",
      "During autoregressive inference, transformers cache the Key and Value tensors from all past tokens so they don't need to be recomputed on every new token. In naive implementations, each inference request pre-allocates a single large contiguous block of memory sized for the maximum possible output length. Most of that block sits empty as the sequence grows gradually. When requests finish at different lengths, the freed memory is fragmented — gaps too small for new requests. A serving system might have 40% of GPU memory technically free but unusable due to fragmentation.",
      "Paged Attention fixes this by borrowing a concept from operating systems: virtual memory with page tables. The KV cache is divided into fixed-size physical blocks (pages) of B tokens each. A page table maps logical token positions to physical block addresses. Blocks are allocated on demand, one at a time, as each new token is generated. When a request completes, its blocks are freed individually and can immediately be reused by any new request, regardless of size.",
      "The result: memory fragmentation drops below 4% (vs 60–80% naively). The GPU can hold far more simultaneous requests in memory — higher batch sizes mean higher throughput. For high-load serving systems, this is often a 2–4× improvement in requests per second.",
    ],
    analogy: {
      title: "OS virtual memory for GPU RAM",
      body: "Your operating system doesn't allocate one giant contiguous block of RAM to each process. It splits memory into 4KB pages, maintains a page table per process mapping virtual addresses to physical pages, and allocates pages on demand. Paged Attention applies this exact idea to KV cache: fixed-size blocks, a page table per request, on-demand allocation. The result is the same near-zero fragmentation that makes OS memory management efficient.",
    },
    math: [
      {
        title: "Naive allocation fragmentation",
        body: "In naive serving, each request pre-allocates max_len × 2 × n_layers × d_model × 2 bytes (float16) of contiguous memory. A request that finishes after generating 50 tokens when max_len=2048 wastes 97.5% of its allocation.",
        formula: "Wasted fraction ≈ 1 − (actual_len / max_len)  [often 60-80% on average]",
      },
      {
        title: "Paged block size",
        body: "Divide KV cache into physical blocks of B tokens each. A request uses ⌈seq_len / B⌉ blocks. Block size B trades off between two inefficiencies: large B wastes memory in the last partial block; small B wastes memory in the page table itself.",
        formula: "Blocks needed = ⌈seq_len / B⌉;   waste ≤ B − 1 tokens per request",
      },
      {
        title: "Page table overhead",
        body: "Each request maintains a page table: an array of block pointers of length ⌈max_len / B⌉. With B = 16 tokens and max_len = 2048, this is 128 entries — negligible overhead.",
        formula: "Page table size = ⌈max_len / B⌉ × sizeof(pointer)",
      },
      {
        title: "Fragmentation bound",
        body: "With paged allocation, the maximum wasted memory per request is B − 1 tokens (the last block is at most B − 1 tokens underfull). With B = 16, worst-case waste is 15/16 < 6.25% per request. In practice vLLM achieves under 4%.",
        formula: "Max fragmentation per request = (B − 1) / seq_len  →  < 4% for typical B",
      },
      {
        title: "Throughput gain",
        body: "Higher GPU utilisation from reduced fragmentation allows larger batch sizes. A 2× reduction in peak memory usage can translate to a 2–4× increase in concurrent requests, directly multiplying throughput.",
        formula: "Throughput ≈ batch_size × tokens_per_step;   batch_size ∝ 1 / memory_per_request",
      },
    ],
    memoryCompute: {
      overview: "Paged Attention doesn't change compute — the attention operation is identical. All savings are in memory layout, reducing fragmentation from ~70% to <4% and enabling much larger batches.",
      items: [
        { label: "KV cache fragmentation (naive)", detail: "60–80% of allocated memory is wasted on average due to variable sequence lengths and pre-allocation.", cost: "expensive" },
        { label: "KV cache fragmentation (paged)", detail: "Less than 4% waste. Each block holds exactly B tokens — only the last partial block per request is underfull.", cost: "cheap" },
        { label: "Page table per request", detail: "Tiny — ⌈max_len/B⌉ pointers. Negligible relative to the KV tensors themselves.", cost: "cheap" },
        { label: "Attention compute", detail: "Identical to dense attention — no change in FLOPs or algorithmic complexity.", cost: "neutral" },
        { label: "Block management overhead", detail: "Allocation and deallocation of physical blocks adds minor CPU-side bookkeeping. Amortised over many tokens per block, this is negligible.", cost: "cheap" },
      ],
    },
    tradeoffs: {
      pros: [
        "Near-zero memory fragmentation (<4% vs 60–80% naive) — directly increases max batch size",
        "2–4× throughput improvement for high-concurrency serving workloads",
        "Zero quality change — identical attention computation",
        "Enables memory sharing for beam search and parallel sampling (copy-on-write blocks)",
      ],
      cons: [
        "Only relevant at inference serving time — no benefit during training",
        "Requires a non-trivial serving runtime (like vLLM) to manage block allocation",
        "Block indirection adds a pointer dereference per KV lookup — minor latency cost",
        "Fixed block size B requires tuning: too small wastes page table space, too large wastes final block",
      ],
      whenToUse: "Any production LLM serving system handling multiple concurrent requests with variable output lengths. vLLM is the primary open-source implementation. Essential when GPU memory is the throughput bottleneck.",
      whenToAvoid: "Single-user local inference where only one request runs at a time (no fragmentation problem to solve). Also irrelevant during training where batch sizes are fixed and KV caches are not typically maintained across steps.",
    },
  },
};
