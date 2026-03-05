# Attention Mechanism Visualization — Enhancement Plan

## Overview
Single-file React visualization (`attention_mechanism.jsx`, 476 lines) demonstrating 6 attention mechanisms. Target audience: beginners → intermediate → advanced ML practitioners. The UI aesthetic is preserved — changes focus on correctness, educational clarity, and interactivity.

---

## Part 1: Bug Fixes

### BUG-1 — Sparse strided pattern incorrectly overlaps global token (line 23)
**Current:** `c % 4 === 0 && r > c`
- Column 0 is already a global token (line 20). `c % 4 === 0` includes c=0, creating unintended overlap.
- `r > c` makes it lower-triangle only — asymmetric and wrong for most sparse attention implementations (BigBird, Sparse Transformer are bidirectional).

**Fix:** `c % 4 === 0 && c !== 0`
Strided columns at c=4 only, bidirectional (no lower-triangle restriction, no global overlap).

---

### BUG-2 — Missing Queries axis label on grid (line 338–340)
**Current:** Only `← tokens (Keys) →` shown at the bottom.
Rows represent query tokens — currently unlabeled.

**Fix:** Wrap the grid in a flex row. Add a rotated label on the left:
```jsx
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", ... }}>
    ↑ Queries ↑
  </div>
  <AttentionGrid ... />
</div>
```

---

### BUG-3 — Linear attention `isActive` ignores `step`; pattern is misleading (lines 11–16)
**Current:** Static diagonal triangular band — visually identical to causal sparse attention.
**Reality:** Linear attention never builds the N×N matrix. It uses the kernel trick: φ(Q)·(φ(K)ᵀV), where KᵀV is a small d×d context matrix.

**Fix:** Replace pattern with a two-column "context state" visualization representing the accumulated KᵀV. Add steps:
- Step 0: "Accumulate K→V context" — column 0–1 fills progressively (rows light up top→bottom)
- Step 1: "All Q queries read from context" — entire grid reads from the same 2 columns

Update step descriptions to clearly state this is a conceptual abstraction.

---

### BUG-4 — Mini gallery shows only 4 cells for Paged Attention at step=0 (line 443)
**Current:** `isActive(r, c, key, 0)` — paged at step=0 lights only the 2×2 top-left corner in the 5×5 thumbnail. Looks broken.

**Fix:** For the mini gallery, pass a special `galleryMode` flag or use a modified isActive that shows all 4 pages simultaneously (union of all steps) for paged type:
```js
// In mini gallery rendering for paged:
const a = key === "paged"
  ? [0,1,2,3].some(s => isActive(r, c, key, s))
  : isActive(r, c, key, 0);
```

---

## Part 2: Correctness Improvements

### CORRECT-1 — Linear attention visualization (see BUG-3 above)
Already covered. Key addition to `whatIs` text: concrete numbers showing O(N) vs O(N²) impact. Example: "At N=16,000 tokens, dense needs 256M scores. Linear attention needs ~16,000 — 16,000× less memory."

---

### CORRECT-2 — Dense attention: add causal mask note
Modern GPT-style models use causal (lower-triangular) masking so tokens can only attend to past tokens.

**Fix:** Add to `dense.tradeoff` or `dense.whatIs`: "Note: autoregressive models (GPT, LLaMA) apply a causal mask — the upper triangle is zeroed out so each token can only attend to earlier tokens."

---

### CORRECT-3 — Flash Attention: tile labels already accurate, minor polish
The 4 steps correctly describe SRAM loading. No functional change needed — clarity can be improved by adding "(rows 0–3)" context inline in each label.

---

## Part 3: Educational Improvements (Beginner → Advanced)

### EDU-1 — Add animated multi-step walkthroughs to currently static mechanisms

**Dense — 4 steps (currently 1):**
| Step | Pattern | Label |
|------|---------|-------|
| 0 | Row 0 only (all cols) | "Query 0 attends to all N tokens" |
| 1 | Row 1 only | "Query 1 attends to all N tokens" |
| 2 | Row 2 only | "Query 2 attends to all N tokens" |
| 3 | All cells | "Full N×N matrix — all queries complete" |

This gives beginners intuition: each row = one token scanning all keys.

**Local — 4 steps (currently 1):**
| Step | Pattern | Label |
|------|---------|-------|
| 0 | Window centered on row 0–1 | "Tokens 0–1 look at their neighborhood" |
| 1 | Window centered on rows 3–4 | "Window slides to tokens 3–4" |
| 2 | Window centered on rows 5–6 | "Window slides further" |
| 3 | Full diagonal band | "All windows together = diagonal band" |

**Sparse — 3 steps (currently 1):**
| Step | Pattern | Label |
|------|---------|-------|
| 0 | Row 0 + col 0 only | "Global tokens — attend/attended by all" |
| 1 | Add diagonal ±1 | "+ Local neighbors added" |
| 2 | Add strided cols | "+ Strided long-range connections" |

---

### EDU-2 — Add complexity badges to each mechanism
Add a `complexity` field to each MECHANISMS entry:
```js
dense:  { complexity: "O(N²)", ... }
linear: { complexity: "O(N)",  ... }
sparse: { complexity: "O(N√N)", ... }
flash:  { complexity: "O(N²) compute, O(N) memory", ... }
paged:  { complexity: "O(N²) compute, O(N) memory", ... }
local:  { complexity: "O(N·w)", ... }
```
Render as a small monospace badge next to `shortDesc` in the left panel.

---

### EDU-3 — Add difficulty tags (Beginner / Intermediate / Advanced)
Add a `level` field:
```js
dense:  { level: "Beginner" }
local:  { level: "Beginner" }
sparse: { level: "Intermediate" }
linear: { level: "Advanced" }
flash:  { level: "Advanced" }
paged:  { level: "Advanced" }
```
Render as a small colored pill:
- Beginner → green
- Intermediate → amber
- Advanced → red/pink

---

### EDU-4 — Highlight active query row during step animations
When stepping through Dense/Local/Sparse steps, highlight the "current" query row with a distinct border or brighter top edge, separate from the regular active-cell color. Add an `activeRow` prop to `AttentionGrid` and render a special style for cells where `r === activeRow`.

---

### EDU-5 — Learning order hint in header
Below the subtitle, add a small hint line:
```
New to attention? Start with Dense → Local → Sparse → Flash
```
Styled in muted monospace, non-intrusive.

---

### EDU-6 — Improve Linear attention `whatIs` with concrete numbers
Append to existing text: "At N=16,000 tokens (a short book chapter), standard attention requires 256 million scores. Linear attention needs only ~16,000 — a 16,000× reduction in memory."

---

## Part 4: General UX Improvements

### GEN-1 — Responsive layout for mobile/tablet
Current: `gridTemplateColumns: "1fr 1fr"` (fixed 2 columns, cramped on mobile).

**Fix:** Inject a `<style>` tag at the top of the App component:
```html
<style>{`
  .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 640px) { .main-grid { grid-template-columns: 1fr; } }
  .overview-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
  @media (max-width: 640px) { .overview-grid { grid-template-columns: repeat(3, 1fr); } }
`}</style>
```
Replace inline `style` on the main content div with `className="main-grid"`.

---

### GEN-2 — Play animation loops instead of stopping
**Current:** Timer fires `setPlaying(false)` when `s >= maxStep`.
**Fix:** Reset to step 0 and keep playing:
```js
setStep(s => s >= maxStep ? 0 : s + 1);
// remove the setPlaying(false) call
```

---

### GEN-3 — Keyboard navigation (Arrow keys + Space)
Add a `useEffect` to the App component:
```js
useEffect(() => {
  const handler = (e) => {
    if (e.key === "ArrowRight") { setPlaying(false); setStep(s => Math.min(maxStep, s + 1)); }
    if (e.key === "ArrowLeft")  { setPlaying(false); setStep(s => Math.max(0, s - 1)); }
    if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [maxStep]);
```
Add a small hint below the controls: `← → Space to navigate`

---

## Implementation Order

1. BUG-1: Fix sparse strided pattern (1 line change)
2. BUG-4: Fix mini gallery paged attention (1 line change)
3. CORRECT-2: Add causal mask note to dense.whatIs
4. EDU-5: Add learning order hint in header
5. EDU-2: Add `complexity` field + badge rendering
6. EDU-3: Add `level` field + difficulty tag rendering
7. BUG-2: Add Queries axis label (flex wrapper + rotated text)
8. EDU-1: Add animated steps to Dense, Local, Sparse (update MECHANISMS + isActive)
9. EDU-4: Highlight active query row in AttentionGrid
10. BUG-3 + CORRECT-1: Fix linear attention pattern + steps + improved whatIs text (EDU-6)
11. GEN-2: Loop play animation
12. GEN-3: Keyboard navigation
13. GEN-1: Responsive layout via injected style tag

---

## Verification Checklist
- [ ] All 6 mechanism grids display correct highlight patterns
- [ ] Dense, Local, Sparse, Flash, Paged all have multiple animated steps
- [ ] Linear attention shows factored context pattern (not diagonal band)
- [ ] Sparse strided does NOT overlap with col 0 global token
- [ ] Mini gallery paged shows all 4 pages in thumbnail
- [ ] Both Keys (bottom) and Queries (left, rotated) axis labels visible
- [ ] Complexity badges visible for all mechanisms
- [ ] Difficulty tags visible for all mechanisms
- [ ] Learning order hint visible in header
- [ ] Play loops back to step 0 instead of stopping
- [ ] Arrow keys and Space bar navigate steps
- [ ] Layout renders correctly at 375px, 768px, 1280px widths
