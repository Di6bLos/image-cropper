# Phase 1: Foundation - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish production-ready Nuxt 3 project infrastructure with Pinia, Sass, COOP/COEP headers, SSR-safe composable patterns, Web Worker communication foundation, and memory management patterns (Blob URL registry + canvas pooling).
</domain>

<decisions>
## Implementation Decisions

### TypeScript Strictness
- **D-01:** Use loose/standard TypeScript configuration (faster initial DX over strict null safety)

### SSR-Safe Pattern
- **D-02:** Use composables with client guards (`onMounted`, `process.client`) — most common Vue/Nuxt pattern, clearest intent

### COOP/COEP Headers
- **D-03:** Configure COOP/COEP headers in `nuxt.config.ts` immediately — required for SharedArrayBuffer (workers, AI in Phase 3), easier to set up once

### Web Worker Architecture
- **D-04:** Single worker composable (`useImageWorker`) managing one worker instance — simpler for Phase 1, upgrade to pool in Phase 4 when batch processing is needed

### Memory Management
- **D-05:** Explicit `useBlobRegistry` composable for Blob URL lifecycle — centralized tracking and revocation, prevents leaks in long sessions
- **D-06:** Canvas pooling via `useCanvasPool` composable — pre-allocate and reuse canvas elements across batch operations

### Claude's Discretion
- Pinia store structure (organizing by feature vs. domain) — standard Nuxt 3 patterns apply
- Sass directory structure (7-1 pattern or flat) — follow Nuxt defaults unless user has preference
- Worker message protocol details — postMessage + ImageBitmap transfer is specified, specific command shapes deferred to Phase 2 planning
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Project documents
- `.planning/ROADMAP.md` — Phase 1 goals, success criteria, and dependencies
- `.planning/PROJECT.md` — stack decisions (Nuxt 3 + Vue 3 + Sass + Pinia), client-side AI intent, privacy-first constraint
- `.planning/REQUIREMENTS.md` — Phase 1 touches no direct requirements (infrastructure only), but Phase 2+ requirements establish the runtime context
- `.planning/STATE.md` — current project state and phase structure

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — greenfield project

### Integration Points
- Phase 2 composables will consume `useBlobRegistry` and `useCanvasPool` from Phase 1
- Phase 3 AI worker will build on Phase 1's `useImageWorker` composable pattern
- Phase 4 batch worker pool will extend Phase 1's single-worker composable

</codebase_context>

<specifics>
## Specific Ideas

- Blob URL registry must track all `URL.createObjectURL` calls and provide `revokeAll()` for cleanup on component unmount
- Canvas pool should have configurable pool size, defaulting to `navigator.hardwareConcurrency` or 2, whichever is higher
- Worker composable should expose `isProcessing` state for UI indicators
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 infrastructure scope

---

*Phase: 1-Foundation*
*Context gathered: 2026-06-30*
