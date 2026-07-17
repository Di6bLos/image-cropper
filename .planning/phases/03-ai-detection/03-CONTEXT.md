# Phase 3: AI Detection - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning
**Mode:** Auto-generated (context gathered during autonomous execution)

<domain>
## Phase Boundary

Users can automatically detect subjects and position crop window using Smartcrop.js. Smartcrop.js is lazy-loaded from CDN on first use. Detected focal point positions crop window automatically. Falls back to center-crop if AI fails. AI runs in Web Worker off main thread.

</domain>

<decisions>
## Implementation Decisions

### AI Detection Flow
- Auto crop button triggers Smartcrop.js subject detection on selected image
- Smartcrop.js lazy-loaded from CDN (not bundled) on first use
- Detected focal point positions crop window automatically
- If AI fails or unavailable, center-crop is used as fallback
- AI processing runs in Web Worker (off main thread)

### UI Integration
- Auto crop button is primary CTA for this phase
- Accent color reserved exclusively for auto crop button
- Button shows loading spinner during processing
- Toast notifications for fallback/failure messages
- Keyboard shortcut `A` for auto crop

### Claude's Discretion
All implementation choices are at Claude's discretion — using ROADMAP phase goal, UI-SPEC, and codebase patterns to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- IconButton.vue — button component pattern to extend for auto crop button
- CropOverlay.vue — overlay rendering pattern for focal point visualization
- useImageCrop composable — existing crop state management

### Established Patterns
- Phase 2 established dark mode CSS variables in _variables.scss
- Phase 2 established spacing scale (multiples of 4)
- isMounted ref pattern for SSR-safe component rendering

### Integration Points
- Crop workspace toolbar — where auto crop button will be placed
- Web Worker infrastructure from Phase 1 — for AI processing
- CropOverlay.vue — where detected focal point will be rendered

</code_context>

<specifics>
## Specific Ideas

- Smartcrop.js CDN URL: https://cdn.jsdelivr.net/npm/smartcropjs@latest/smartcrop.min.js
- Web Worker file: existing worker pattern from Phase 1
- Fallback: center-crop when AI unavailable

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is focused on AI detection integration.

</deferred>
