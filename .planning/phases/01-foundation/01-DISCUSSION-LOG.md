# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 1-Foundation
**Areas discussed:** TypeScript strictness, SSR-safe composable pattern, COOP/COEP headers, Web Worker architecture, Memory management

---

## TypeScript Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Strict TypeScript | Full strict mode — strictNullChecks, noImplicitAny, exactOptionalPropertyTypes | |
| Standard TypeScript | Standard Nuxt 3 defaults — moderate strictness | |
| Loose TypeScript | Minimal TypeScript — typeScript.leaveNullish = true, less strict null checks | ✓ |

**User's choice:** Loose TypeScript
**Notes:** Faster initial DX over strict null safety for greenfield project

---

## SSR-Safe Composable Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Use composables with client guards | onMounted guards, process.client checks, composables abstracted away from Nuxt | ✓ |
| Use Nuxt ClientOnly components | Wrap components in <ClientOnly> with ssr:false per component | |
| Use useNuxtApp() context checks | Use useNuxtApp().ssrContext to conditionally render browser-dependent code | |

**User's choice:** Use composables with client guards
**Notes:** Most common pattern, clearest intent

---

## COOP/COEP Headers

| Option | Description | Selected |
|--------|-------------|----------|
| Configure now | Add COOP/COEP headers immediately — required for SharedArrayBuffer | ✓ |
| Defer to Phase 3 | Defer until Smartcrop.js actually needs SharedArrayBuffer | |

**User's choice:** Configure now
**Notes:** Easier to configure once, required for Phase 3 AI integration

---

## Web Worker Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Single worker composable | Define a single composable (useImageWorker) managing one worker | ✓ |
| Worker pool from start | Set up worker pool with navigator.hardwareConcurrency | |

**User's choice:** Single worker composable
**Notes:** Simpler for Phase 1, upgrade to pool in Phase 4

---

## Memory Management

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit registry composable | Implement useBlobRegistry + useCanvasPool for centralized tracking | ✓ |
| URL.createObjectURL + forget | Let GC handle it naturally | |

**User's choice:** Explicit registry composable
**Notes:** Prevents Blob URL leaks in long sessions

---

## Claude's Discretion

- Pinia store structure (organizing by feature vs. domain)
- Sass directory structure (7-1 pattern or flat)
- Worker message protocol details

## Deferred Ideas

None

---

*Discussion log: Phase 1-Foundation, 2026-06-30*
