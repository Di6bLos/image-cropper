# Phase 2: Core Cropping - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 2-Core Cropping
**Areas discussed:** Preview list UX, Crop window rendering, Ratio control layout, Drop zone + picker

---

## Preview list UX

| Option | Description | Selected |
|--------|-------------|----------|
| Grid (2-3 cols) | Consistent sizing, scannable at a glance, good for many images | |
| List (single col) | Less space, better for seeing filename/dimensions text clearly | ✓ |
| Masonry / fluid | Fills width in rows, wraps naturally to next line | |

**User's choice:** List (single col)
**Notes:** Filename and dimensions visible without hover, single column fits well in sidebar layout

---

## Preview list UX — Thumbnail size

| Option | Description | Selected |
|--------|-------------|----------|
| 64×64 or 80×80 | Balances visibility with list compactness — thumbnail readable, filename visible without hover | ✓ |
| 48×48 | Very compact, good for 20+ images — less thumbnail detail visible | |
| 120×120 | Large thumbnails, list becomes long — good for ≤15 images | |

**User's choice:** 64×64 or 80×80
**Notes:** —

---

## Preview list UX — Selection state

| Option | Description | Selected |
|--------|-------------|----------|
| Highlighted background | Shows selected state immediately, familiar from file browsers | |
| Border ring | Clear ring around thumbnail, no background color change | ✓ |
| Subtle lift shadow | Selected item floats slightly — subtle but clear | |

**User's choice:** Border ring
**Notes:** —

---

## Preview list UX — Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Show drop zone in list area | Prominent empty state with dashed border + icon + CTA text | ✓ |
| Full-area drop zone only | Just the big drop zone, no list area until images exist | |
| Loading skeleton rows | Animated upload indicator during processing | |

**User's choice:** Show drop zone in list area
**Notes:** —

---

## Crop window rendering — Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| HTML/CSS overlay divs | Native cursor support, CSS transitions, easier to implement handles and interactions | ✓ |
| Canvas-drawn overlay | Pixel-perfect rendering across DPIs, more complex handle logic | |

**User's choice:** HTML/CSS overlay divs
**Notes:** —

---

## Crop window rendering — Handle style

| Option | Description | Selected |
|--------|-------------|----------|
| Corner handles only (4) | Small squares at corners only — minimal UI, fast to implement | ✓ |
| Corner + edge (8) | Corners + midpoints — easier to grab, slightly busier look | |
| Large corner squares + edges | Most grabbable, also visually busiest | |

**User's choice:** Corner handles only (4)
**Notes:** —

---

## Crop window rendering — Dimmed overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Dark overlay (60-70% opacity) | Darkens outside crop — user sees exactly what's kept vs. cut | ✓ |
| White border only, no overlay | Crop window area fully opaque white, creates clear frame | |
| Light overlay (30-40% opacity) | Minimal dimming — just enough to distinguish crop area | |

**User's choice:** Dark overlay (60-70% opacity)
**Notes:** —

---

## Ratio control layout — Preset presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Button group (row of buttons) | Easier to scan, familiar radio behavior, good for ≤5 presets | |
| Segmented control (pill) | More compact, good for horizontal toolbar | |
| Preset buttons + expandable custom | Clear visual grouping, expands inline below presets | ✓ |

**User's choice:** Preset buttons + expandable custom
**Notes:** —

---

## Ratio control layout — Custom dimension inputs

| Option | Description | Selected |
|--------|-------------|----------|
| Single unified W:H field | Single field, auto-detects format. Simpler UI. | |
| Separate W and H fields | Two fields side by side. Clearer, no format guessing. | ✓ |
| W × H px fields | Same fields but pixel mode — adds dimension suffix | |

**User's choice:** Separate W and H fields
**Notes:** —

---

## Ratio control layout — Mode switching

| Option | Description | Selected |
|--------|-------------|----------|
| Ratio mode vs. Pixel mode tabs | Two sets of inputs, clear mutual exclusivity, RATIO-05 satisfied | ✓ |
| Single W+H pair + mode toggle | One pair of fields, radio toggle above: ratio vs. pixel | |
| Single field, format-sensitive | Auto-detect: '1200:800' = ratio, '1200×800' = pixels. Single field. | |

**User's choice:** Ratio mode vs. Pixel mode tabs
**Notes:** —

---

## Drop zone + picker — Positioning

| Option | Description | Selected |
|--------|-------------|----------|
| Visible drop zone + button | Both always visible. Drop zone prominent in the list area (empty state). File picker is secondary button. | ✓ |
| Click-to-open file picker | Click anywhere in drop zone to open file picker. Good for keyboard/mouse consistency. | |
| Separate zones | In-page drop zone, separate button opens new tab for file picker | |

**User's choice:** Visible drop zone + button
**Notes:** —

---

## Drop zone + picker — Drag-over feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Border + background color shift | Immediate visual feedback, communicates clearly | |
| Border becomes dashed | Less aggressive than color — good for re-drops | |
| Border + icon animation | Double signal: border changes + background lightens | ✓ |

**User's choice:** Border + icon animation
**Notes:** —

---

## Claude's Discretion

- Specific CSS color values for overlay, handle size, border ring color — follow existing CSS variables from Phase 1
- Transition timing for drag-over states — standard 150-200ms ease
- Pixel ratio for thumbnail generation — use canvas-drawn thumbnails at device pixel ratio
- "Add more images" button appearance — simple icon button in list header

## Deferred Ideas

None — all discussion stayed within Phase 2 scope
