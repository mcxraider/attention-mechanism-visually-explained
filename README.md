# Attention Mechanisms — Visually Explained

An interactive, animated reference for the six core attention mechanisms used in modern transformer-based language models. Each mechanism is explained through step-by-step grid visualisations, plain-English descriptions, and a side-by-side comparison mode.

Live: [mcxraider.github.io/attention-mechanism-visually-explained](https://mcxraider.github.io/attention-mechanism-visually-explained)

---

## Table of Contents

- [Overview](#overview)
- [Mechanisms Covered](#mechanisms-covered)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Visualisation Logic](#visualisation-logic)
- [Compare Mode](#compare-mode)
- [Deployment](#deployment)
- [Local Development](#local-development)
- [Design Decisions](#design-decisions)

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

## Architecture

```
Next.js 15 (App Router)
├── Static export (output: "export")
├── No server-side runtime — all pages pre-rendered at build time
├── Client components for interactive state (animations, tabs, dropdowns)
└── Server components for static layout shells
```

**Rendering model:** Every page is a statically generated HTML file. Dynamic URL params on `/compare` (`?a=` and `?b=`) are read client-side via `useSearchParams()`, wrapped in a `<Suspense>` boundary to satisfy the static export constraint.

**State:** All animation state (current step, play/pause, active mechanism) is local React `useState` — no global store, no server state.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Root page — renders MechanismExplorer
│   ├── layout.tsx                # HTML shell, Google Fonts import
│   ├── globals.css               # Grid layout classes, box-sizing reset
│   ├── compare/
│   │   └── page.tsx              # /compare route — Suspense wrapper for CompareView
│   └── terms/
│       └── [id]/
│           └── page.tsx          # Stub term definition pages (generateStaticParams)
│
├── components/
│   ├── MechanismExplorer.tsx     # Root client component — owns all animation state
│   ├── Header.tsx                # SVG token arc visualisation + title
│   ├── OverviewGrid.tsx          # 6-card mechanism picker with mini grids
│   ├── GridPanel.tsx             # Left panel: AttentionGrid + step description
│   ├── InfoPanel.tsx             # Right panel: analogy, how it works, key terms, tradeoffs
│   ├── AttentionGrid.tsx         # Core 8×8 animated grid component
│   ├── StepControls.tsx          # Prev / Play / Next controls + step dots
│   ├── MechanismTabs.tsx         # (legacy) text-only tab bar — no longer used
│   └── TermPill.tsx              # Expandable term definition pill
│   └── compare/
│       └── CompareView.tsx       # Side-by-side comparison client component
│
└── lib/
    ├── mechanisms.ts             # All mechanism data (labels, steps, colors, metadata)
    ├── attention-logic.ts        # isActive() and getActiveRow() — cell highlight logic
    └── theme.ts                  # Shared colors, levelColors, btn() style helper
```

---

## Data Model

All mechanism content lives in `src/lib/mechanisms.ts`.

```typescript
interface Mechanism {
  label: string;          // Display name
  color: string;          // Hex color used throughout UI
  shortDesc: string;      // One-line description
  complexity: string;     // Big-O notation string
  level: Level;           // "Beginner" | "Intermediate" | "Advanced"
  analogy: string;        // Plain-English intuition
  whatIs: string;         // Technical explanation paragraph
  keyTerms: KeyTerm[];    // Expandable term definitions
  tradeoff: string;       // Tradeoffs paragraph
  usedIn: string;         // Real-world models/systems
  steps: Step[];          // Animation steps: { label, desc }[]
  // Compare mode fields:
  solves: string;
  mechanismDesc: string;
  mathOutput: string;
  usedDuring: string;
}
```

`MECHANISMS` is a `Record<MechanismKey, Mechanism>` where `MechanismKey = "dense" | "linear" | "sparse" | "flash" | "paged" | "local"`.

---

## Visualisation Logic

`src/lib/attention-logic.ts` contains two pure functions:

### `isActive(row, col, type, step): boolean`

Determines whether a cell at `(row, col)` should be lit at a given animation step. Each mechanism implements its own pattern:

- **dense** — `row === step` for steps 0–7 (one query row per step), then all cells on step 8
- **linear** — `col <= 1` always (two context columns representing the d×d KV context matrix)
- **sparse** — additive: step 0 = global tokens, step 1 = +local diagonal, step 2 = +strided columns
- **flash** — 4×4 block tiles: step maps to `(blockRow, blockCol)` pairs in row-major order
- **paged** — cumulative page allocation: step N shows all blocks 0..N lit simultaneously
- **local** — sliding window: each step covers a 2-row band, `Math.abs(row - col) <= windowSize`

### `getActiveRow(type, step): number | null`

Returns which query row to highlight (the row-highlight underlay) for mechanisms that process one row at a time. Used in `AttentionGrid` to render a dim background highlight on the active row.

### `AttentionGrid` component

```typescript
interface Props {
  type: MechanismKey;
  step: number;
  color: string;
  size?: number;       // grid dimension N (default 8)
  activeRow?: number | null;
  cellSize?: number;   // px per cell (default 20)
}
```

Renders an N×N CSS grid. Each cell calls `isActive()` to determine fill color and opacity. Transitions are `0.35s ease` on all properties for smooth animation.

---

## Compare Mode

`/compare?a=<mechKey>&b=<mechKey>` renders `CompareView`, which:

1. Reads `a` and `b` from `useSearchParams()` on mount; defaults to `flash` vs `paged`
2. Maintains independent `stepA`, `stepB`, `playingA`, `playingB` state per panel
3. **Sync play mode** (`syncPlaying`): a single shared `setInterval` drives both panels. The shorter animation holds at its last step until the longer one finishes, then both reset to step 0 together. This uses `useRef` to read current step values inside the interval without stale closure issues
4. Changing a dropdown calls `router.replace()` to update URL params without a navigation push
5. Both dropdowns exclude the other panel's current selection to prevent duplicates
6. The dense baseline card always shows the complete N×N matrix (`step=8`) as a static reference

### Sync play implementation

```typescript
const stepARef = useRef(stepA);
const stepBRef = useRef(stepB);
stepARef.current = stepA;  // kept in sync on every render
stepBRef.current = stepB;

useEffect(() => {
  if (!syncPlaying) return;
  const id = setInterval(() => {
    const a = stepARef.current;
    const b = stepBRef.current;
    if (a >= maxA && b >= maxB) {
      setStepA(0); setStepB(0);          // both done — restart cycle
    } else {
      if (a < maxA) setStepA(s => s + 1);
      if (b < maxB) setStepB(s => s + 1);
    }
  }, 1200);
  return () => clearInterval(id);
}, [syncPlaying, mA.steps.length, mB.steps.length]);
```

---

## Deployment

The project deploys to GitHub Pages via a GitHub Actions workflow at `.github/workflows/deploy.yml`.

### Build pipeline

```
push to main
  → actions/checkout@v4
  → actions/setup-node@v4 (Node 20, npm cache)
  → npm ci
  → npm run build  (NEXT_PUBLIC_BASE_PATH=/<repo-name>)
  → actions/upload-pages-artifact@v3  (uploads ./out)
  → actions/deploy-pages@v4
```

### Static export configuration (`next.config.ts`)

```typescript
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",       // generates ./out static HTML
  basePath,               // e.g. /attention-mechanism-visually-explained
  assetPrefix: basePath ? `${basePath}/` : "",
  trailingSlash: true,    // /compare → /compare/index.html
  images: { unoptimized: true },
};
```

`basePath` is injected at build time from `NEXT_PUBLIC_BASE_PATH`, set dynamically in the workflow using `${{ github.event.repository.name }}`. This means the same codebase works on both `localhost:3000` (no basePath) and GitHub Pages (with subdirectory prefix).

**Important:** All internal navigation uses `next/link`'s `<Link>` component, not plain `<a>` tags. `<Link>` automatically prepends `basePath` to every `href`; plain `<a>` tags do not.

### Prerequisites (one-time)

In your repository: **Settings → Pages → Source → GitHub Actions**

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

No environment variables are needed for local development. `NEXT_PUBLIC_BASE_PATH` defaults to `""` (empty string) when unset, so all routes resolve from the root.

---

## Design Decisions

**Why no state management library?**
All state is local to `MechanismExplorer` and `CompareView`. There is no shared cross-component state that would justify Zustand or Context. Prop drilling is shallow (2 levels max).

**Why inline styles instead of Tailwind or CSS modules?**
The component palette is small and design tokens (colors, fonts) come directly from the `MECHANISMS` data at runtime — e.g. each mechanism's border color is `mech.color`. This makes dynamic styling with Tailwind (which requires static class names) impractical. Inline styles keep the color logic co-located with the component logic.

**Why a pure function for `isActive()` instead of pre-computed lookup tables?**
Each call is O(1) and runs on every render of every cell. For an 8×8 grid that is 64 calls — trivially fast. Keeping it as a pure function makes it easy to test in isolation and extend with new mechanisms without touching component code.

**Why `useRef` for step values in the sync interval?**
React state updates are asynchronous and `setInterval` captures a stale closure over the state values at the time the effect runs. Mirroring state into refs (`stepARef.current = stepA` on every render) gives the interval callback a reliable way to read the latest values without re-creating the interval on every step change, which would reset the timer.

**Why `generateStaticParams` on `/terms/[id]`?**
`output: export` requires all dynamic routes to enumerate their params at build time. The term pages are a stub, so `generateStaticParams` derives slugs from the `keyTerms` arrays in `MECHANISMS` — ensuring the build succeeds without hardcoding a list.
