# Phase 2: Core Cropping - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can import images via file picker or drag-and-drop, see them in a preview list, select any image for cropping, position a draggable/resizable crop window constrained to aspect ratio presets or custom dimensions, and work in dark mode.
</domain>

<decisions>
## Implementation Decisions

### Preview List UX
- **D-01:** Single-column list layout — filename and original dimensions visible without hover
- **D-02:** Thumbnail size 64×64 or 80×80 — balances visibility with compactness
- **D-03:** Selected items show a border ring — immediate visual feedback, familiar pattern
- **D-04:** Empty state shows the drop zone inside the list area — no separate empty-state zone

### Crop Window Rendering
- **D-05:** HTML/CSS overlay divs — native cursor support, CSS transitions, easier handle implementation
- **D-06:** Corner handles only (4 handles) — minimal UI, fast to implement
- **D-07:** Dark overlay at 60-70% opacity outside crop area — clear kept-vs-cut distinction

### Ratio Control Layout
- **D-08:** Preset buttons with expandable custom section below — easy to scan, familiar radio behavior, inline expansion keeps it compact
- **D-09:** Separate W and H fields for custom input — clearer than single unified field, no format guessing needed
- **D-10:** Ratio mode vs. Pixel mode as tabs — explicit mutual exclusivity, RATIO-05 satisfied cleanly

### Drop Zone + File Picker
- **D-11:** Drop zone and file picker button always visible — drop zone prominent in list area when empty, file picker as secondary button
- **D-12:** Drag-over feedback: border color change + animated upload icon — immediate, double signal, communicates clearly

### Claude's Discretion
- Specific CSS color values for overlay (60-70% opacity), handle size (8px corners), border ring color — follow existing CSS variables from Phase 1
- Transition timing for drag-over states — standard 150-200ms ease
- Pixel ratio for thumbnail generation — use canvas-drawn thumbnails at device pixel ratio
- Whether "Add more images" button appears after list has items — simple icon button in list header
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project documents
- `.planning/ROADMAP.md` — Phase 2 goals, success criteria, and dependencies
- `.planning/PROJECT.md` — stack decisions, privacy-first constraint, client-side AI intent
- `.planning/REQUIREMENTS.md` — Phase 2 covers IMPT-01–04, PRVW-01–03, CROP-01–06, RATIO-01–05, UIUX-01–02 (21 requirements)
- `.planning/STATE.md` — current project state
- `.planning/phases/01-foundation/01-CONTEXT.md` — Phase 1 decisions (SSR-safe composables, Pinia, canvas pool, blob registry)

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `useBlobRegistry` composable — for managing Blob URLs of imported images and thumbnails
- `useCanvasPool` composable — for drawing thumbnails without leaking canvas elements
- `useImageWorker` composable — Phase 3 will extend this pattern for AI worker

### Established Patterns
- SSR-safe composables with `onMounted` / `process.client` guards — apply to all Phase 2 composables
- Pinia stores — organize state for images, crop selection, ratio settings
- CSS variables for theming — dark mode via `color-scheme` and CSS variable overrides

### Integration Points
- Preview list thumbnails use `useBlobRegistry` to manage Object URLs
- Canvas-based thumbnail rendering uses `useCanvasPool`
- Crop window state lives in Pinia store; composables handle DOM interaction
- Dark mode respects `prefers-color-scheme` media query

</codebase_context>

<specifics>
## Specific Ideas

- Import flow: file input is hidden, triggered by button click or drop event on drop zone
- Thumbnails: use `createImageBitmap` + canvas draw for consistent sizing across image formats
- Crop window: absolute-positioned div with `pointer-events: none` on overlay, `pointer-events: auto` on handles
- Ratio presets: 16:9, 3:2, 1:1, 2:3 — show as "16:9" labels on buttons, not icons
- Custom ratio input: appears below presets when "Custom" button is clicked (not a separate page)
- Dimension validation: real-time, show inline error if non-numeric or zero/negative values
</specifics>

<deferred>
## Deferred Ideas

None — all discussion stayed within Phase 2 scope

---

*Phase: 2-Core Cropping*
*Context gathered: 2026-07-01*
