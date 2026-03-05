# Attention Mechanisms — Visually Explained

An interactive, animated reference for the six core attention mechanisms used in modern transformer-based language models. Each mechanism is explained through step-by-step grid visualisations, plain-English descriptions, and a side-by-side comparison mode.

Live: [mcxraider.github.io/attention-mechanism-visually-explained](https://mcxraider.github.io/attention-mechanism-visually-explained)

---

## Overview

This project is a client-side educational tool that animates attention patterns as 8×8 token grids. Each lit cell in the grid represents an attention score being computed between a query token (row) and a key token (column). The animations step through the mechanism's computation process — e.g. dense attention lights up one row at a time, flash attention lights up 4×4 SRAM tiles, and paged attention accumulates non-contiguous KV cache blocks.

The site is fully statically exported and hosted on GitHub Pages with no backend.

---

## Mechanisms Covered

| Mechanism | Complexity | Key Concept |
|---|---|---|
| Dense (Full) Attention | O(N²) | Every token attends to every other token |
| Linear Attention | O(N) | Kernel feature map trick to avoid the N×N matrix |
| Sparse Attention | O(N√N) | Global + local + strided structured subsets |
| Flash Attention | O(N²) compute, O(N) memory | Tiled SRAM computation, never materialises N×N in HBM |
| Paged Attention | O(N²) compute, O(N) memory | Non-contiguous page table for KV cache blocks |
| Local (Sliding Window) Attention | O(N·w) | Fixed-width diagonal band, window slides across sequence |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Type-check
npx tsc --noEmit

# Production build (local)
npm run build
# Output in ./out

# Lint
npm run lint
```

No environment variables are needed for local development. `NEXT_PUBLIC_BASE_PATH` defaults to `""` when unset, so all routes resolve from the root.
