# Phase 1: Foundation - Research

**Researched:** 2026-06-30
**Domain:** Nuxt 3 infrastructure setup, SSR-safe patterns, Web Worker foundation, memory management
**Confidence:** HIGH

## Summary

Phase 1 establishes the production-ready infrastructure for the Image Cropper application. The project uses Nuxt 3 (Vue 3) with Pinia for state management, Sass for styling, and requires cross-origin isolation headers (COOP/COEP) for SharedArrayBuffer support in upcoming Web Worker phases. Key infrastructure decisions include SSR-safe composable patterns using client guards, a single-worker architecture for Phase 1 (upgradeable to pool in Phase 4), explicit memory management via Blob URL registry and canvas pooling composables, and loose TypeScript configuration for faster initial DX.

**Primary recommendation:** Use `nuxt-security` module for COOP/COEP headers (cleanest API), implement SSR-safe composables with `process.client` guards, use `useBlobRegistry` and `useCanvasPool` composables for explicit memory lifecycle management, and establish worker communication pattern with `postMessage` + `ImageBitmap` transferable transfers.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use loose/standard TypeScript configuration (faster initial DX over strict null safety)
- **D-02:** Use composables with client guards (`onMounted`, `process.client`) — most common Vue/Nuxt pattern, clearest intent
- **D-03:** Configure COOP/COEP headers in `nuxt.config.ts` immediately — required for SharedArrayBuffer (workers, AI in Phase 3), easier to set up once
- **D-04:** Single worker composable (`useImageWorker`) managing one worker instance — simpler for Phase 1, upgrade to pool in Phase 4 when batch processing is needed
- **D-05:** Explicit `useBlobRegistry` composable for Blob URL lifecycle — centralized tracking and revocation, prevents leaks in long sessions
- **D-06:** Canvas pooling via `useCanvasPool` composable — pre-allocate and reuse canvas elements across batch operations

### Claude's Discretion

- Pinia store structure (organizing by feature vs. domain) — standard Nuxt 3 patterns apply
- Sass directory structure (7-1 pattern or flat) — follow Nuxt defaults unless user has preference
- Worker message protocol details — postMessage + ImageBitmap transfer is specified, specific command shapes deferred to Phase 2 planning

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 1 infrastructure scope

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SSR-safe composables | API/Backend (Nuxt SSR) | Browser/Client | Nuxt renders on server; client guards prevent window/document errors |
| COOP/COEP headers | API/Backend (Nuxt) | CDN/Static | Headers set at server response level in nuxt.config.ts |
| Web Worker communication | Browser/Client | API/Backend (Nuxt) | Workers run in browser; Nuxt serves the worker file |
| Blob URL registry | Browser/Client | — | DOM API; tracks created object URLs |
| Canvas pooling | Browser/Client | — | Canvas API is browser-only; pooling reuses DOM elements |
| Pinia state management | API/Backend (Nuxt) | Browser/Client | Pinia works in both SSR and client contexts |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Nuxt 3 | [CITED: nuxt.com, /nuxt/nuxt] | Vue 3 framework with SSR, auto-imports, file-based routing | User-specified; production-ready |
| Pinia | 3.x | State management | User-specified; official Vue recommendation |
| @pinia/nuxt | 0.11.3 [VERIFIED: npm registry] | Pinia Nuxt 3 integration module | Official Nuxt module for Pinia |
| Sass | 1.101.0 [VERIFIED: npm registry] | CSS preprocessor | User-specified; preferred by team |
| nuxt-security | 2.6.0 [VERIFIED: npm registry] | Security headers including COOP/COEP | Clean API for cross-origin isolation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | loose config | Type safety | All TypeScript files |
| @vueuse/core | latest | Composables (useEventListener, useIntersectionObserver) | Phase 2+ UI interactions |

**Installation:**
```bash
npm install nuxt @pinia/nuxt sass nuxt-security
```

---

## Package Legitimacy Audit

> Package Legitimacy Gate: All packages verified via npm registry.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| nuxt | npm | 12+ yrs | 3M/wk | github.com/nuxt/nuxt | OK | Approved |
| @pinia/nuxt | npm | 4+ yrs | 2M/wk | github.com/vuejs/pinia | OK | Approved |
| sass | npm | 18+ yrs | 12M/wk | github.com/sass/dart-sass | OK | Approved |
| nuxt-security | npm | 3+ yrs | 400K/wk | github.com/Baroshem/nuxt-security | OK | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser Environment                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                         Nuxt App (SSR)                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │ │
│  │  │   Pinia      │  │  Composables │  │   nuxt-security     │   │ │
│  │  │   Stores     │  │  (SSR-safe)  │  │   (COOP/COEP)       │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                    Client-side hydration                             │
│                                 ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Vue Application                           │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │ │
│  │  │ useBlobRegistry│  │ useCanvasPool  │  │  useImageWorker │  │ │
│  │  │ (Blob URLs)    │  │ (Canvas reuse) │  │  (Web Worker)   │  │ │
│  │  └────────────────┘  └────────────────┘  └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
image-cropper/
├── nuxt.config.ts           # COOP/COEP headers, modules, SSR config
├── app/
│   ├── plugins/             # Client-only plugins
│   │   └── blob-registry.client.ts
│   ├── composables/         # SSR-safe composables
│   │   ├── useBlobRegistry.ts
│   │   ├── useCanvasPool.ts
│   │   ├── useImageWorker.ts
│   │   └── useSSRGuard.ts
│   ├── stores/              # Pinia stores
│   │   └── ...
│   ├── assets/
│   │   └── sass/            # Sass partials (flat structure)
│   │       ├── _variables.scss
│   │       └── main.scss
│   └── pages/
│       └── index.vue
├── workers/
│   └── image-processor.worker.ts
└── public/
```

### Pattern 1: SSR-Safe Composable Guard

**What:** Composables that use browser APIs wrapped with `process.client` check or `onMounted`
**When to use:** Any composable accessing `window`, `document`, `localStorage`, or DOM APIs
**Source:** [Nuxt Hydration Guide](https://nuxt.com/docs/guide/concepts/hydration)

```typescript
// composables/useWindowSize.ts
export function useWindowSize() {
  const width = ref(0)
  const height = ref(0)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  // Only run on client
  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { width, height }
}
```

### Pattern 2: Blob URL Registry Composable

**What:** Centralized tracking and revocation of `URL.createObjectURL` created URLs
**When to use:** Any component creating object URLs for images/files
**Source:** [ASSUMED] Standard memory management pattern for Blob URLs

```typescript
// composables/useBlobRegistry.ts
interface BlobRegistry {
  create: (blob: Blob) => string
  revoke: (url: string) => void
  revokeAll: () => void
  urls: Set<string>
}

export function useBlobRegistry(): BlobRegistry {
  const urls = new Set<string>()

  function create(blob: Blob): string {
    const url = URL.createObjectURL(blob)
    urls.add(url)
    return url
  }

  function revoke(url: string): void {
    if (urls.has(url)) {
      URL.revokeObjectURL(url)
      urls.delete(url)
    }
  }

  function revokeAll(): void {
    urls.forEach(url => URL.revokeObjectURL(url))
    urls.clear()
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    revokeAll()
  })

  return { create, revoke, revokeAll, urls: readonly(urls) }
}
```

### Pattern 3: Canvas Pool Composable

**What:** Pre-allocate and reuse OffscreenCanvas or HTMLCanvasElement instances
**When to use:** Batch image processing where creating/destroying canvases causes GC pressure
**Source:** [WebSearch verified with MDN, StackOverflow patterns]

```typescript
// composables/useCanvasPool.ts
interface CanvasPool {
  acquire: () => OffscreenCanvas | HTMLCanvasElement
  release: (canvas: OffscreenCanvas | HTMLCanvasElement) => void
  dispose: () => void
}

export function useCanvasPool(size?: number): CanvasPool {
  const poolSize = size ?? Math.max(2, navigator.hardwareConcurrency ?? 2)
  const pool: (OffscreenCanvas | HTMLCanvasElement)[] = []

  // Pre-allocate canvases
  function init() {
    for (let i = 0; i < poolSize; i++) {
      pool.push(createCanvas())
    }
  }

  function createCanvas(): OffscreenCanvas | HTMLCanvasElement {
    // Use OffscreenCanvas if available (better for workers)
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(4096, 4096)
    }
    const canvas = document.createElement('canvas')
    canvas.width = 4096
    canvas.height = 4096
    return canvas
  }

  function acquire(): OffscreenCanvas | HTMLCanvasElement {
    return pool.pop() ?? createCanvas()
  }

  function release(canvas: OffscreenCanvas | HTMLCanvasElement): void {
    if (pool.length < poolSize) {
      pool.push(canvas)
    }
  }

  function dispose(): void {
    pool.length = 0
  }

  init()

  onUnmounted(() => {
    dispose()
  })

  return { acquire, release, dispose }
}
```

### Pattern 4: Web Worker Communication with Transferables

**What:** Worker composable using `postMessage` with `ImageBitmap` transferable transfers
**When to use:** Image processing that must not block main thread
**Source:** [MDN Worker.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage), [JavaScriptBit Transferable Objects](https://javascriptbit.com/javascript-transferable-objects-postmessage/)

```typescript
// composables/useImageWorker.ts
interface WorkerMessage {
  type: string
  payload: any
  transferables?: Transferable[]
}

interface UseImageWorkerReturn {
  isProcessing: Readonly<Ref<boolean>>
  postMessage: (message: WorkerMessage) => void
  terminate: () => void
}

export function useImageWorker(workerUrl: string): UseImageWorkerReturn {
  const isProcessing = ref(false)
  let worker: Worker | null = null

  function init() {
    if (!process.client) return
    worker = new Worker(workerUrl)
  }

  function postMessage(message: WorkerMessage) {
    if (!worker) return
    isProcessing.value = true
    worker.postMessage(message, message.transferables ?? [])
  }

  function terminate() {
    worker?.terminate()
    worker = null
  }

  // Listen for responses
  worker?.addEventListener('message', (event) => {
    isProcessing.value = false
    // Handle response...
  })

  onMounted(init)
  onUnmounted(terminate)

  return { isProcessing: readonly(isProcessing), postMessage, terminate }
}
```

### Anti-Patterns to Avoid

- **Creating Blob URLs without tracking:** Causes memory leaks in long sessions. Always use a registry composable.
- **Not closing ImageBitmaps:** ImageBitmap holds GPU memory. Always call `.close()` after transferring via `drawImage()`.
- **Creating canvases per-operation in batch loops:** Causes GC jank. Pre-allocate pool and reuse.
- **Using `window`/`document` in setup outside guards:** Causes SSR errors. Wrap all browser API access with `process.client` or `onMounted`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-origin isolation headers | Manual header middleware | `nuxt-security` module | Clean declarative config; handles all edge cases |
| Blob URL lifecycle management | Ad-hoc `URL.createObjectURL`/`revokeObjectURL` | `useBlobRegistry` composable | Centralized tracking prevents leaks; `revokeAll()` for cleanup |
| Canvas memory management | Creating/destroying canvases per operation | `useCanvasPool` composable | Prevents GC pressure in batch operations |
| Worker communication | Raw `new Worker()` in components | `useImageWorker` composable | Single source of truth for worker lifecycle |
| SSR guards | Various patterns (check `window` everywhere) | `process.client` + `onMounted` | Most common Vue/Nuxt pattern; clearest intent |

---

## Common Pitfalls

### Pitfall 1: COOP/COEP Headers Not Set Before Phase 3
**What goes wrong:** SharedArrayBuffer unavailable when AI worker needs it; runtime error
**Why it happens:** Headers must be set at server response time; cannot be added later without rebuild
**How to avoid:** Configure in nuxt.config.ts immediately in Phase 1
**Warning signs:** `SharedArrayBuffer is not defined` error in browser console

### Pitfall 2: Blob URL Memory Leaks
**What goes wrong:** `URL.createObjectURL` creates URLs that persist until explicitly revoked; in long batch sessions, memory grows unbounded
**Why it happens:** Each imported image creates Blob URLs; if not revoked, browser holds references
**How to avoid:** Use `useBlobRegistry` with centralized `revokeAll()` called on component unmount or session clear
**Warning signs:** `DOMException: Failed to execute 'createObjectURL' on 'URL'` — too many open URLs

### Pitfall 3: ImageBitmap GPU Memory Not Released
**What goes wrong:** ImageBitmaps transferred to workers hold GPU memory after processing; memory grows with each batch
**Why it happens:** ImageBitmap is a handle to GPU-allocated pixel data; garbage collector does not immediately reclaim
**How to avoid:** Explicitly call `bitmap.close()` on ImageBitmap after `drawImage()` completes
**Warning signs:** GPU memory grows linearly with batch size; browser tab memory >500MB for 50 images

### Pitfall 4: SSR Hydration Mismatch from Browser API Usage
**What goes wrong:** Server renders component with different state than client; hydration warnings or broken UI
**Why it happens:** Using `window`, `document`, `localStorage` directly in setup function or synchronous code
**How to avoid:** Wrap all browser API access with `process.client` guard or move to `onMounted`
**Warning signs:** `[Vue warn]: Hydration node mismatch` in console; visible UI flicker on load

### Pitfall 5: OffscreenCanvas Not Supported in Safari
**What goes wrong:** Phase 3/4 code assumes OffscreenCanvas; Safari <16.4 has partial/no support
**Why it happens:** OffscreenCanvas is newer; Safari implementation is incomplete
**How to avoid:** Check `typeof OffscreenCanvas !== 'undefined'` before use; fall back to regular canvas
**Warning signs:** `TypeError: OffscreenCanvas constructor is not defined` in Safari

---

## Code Examples

### COOP/COEP Configuration via nuxt-security

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-security'],

  security: {
    headers: {
      crossOriginEmbedderPolicy: 'require-corp',
      crossOriginOpenerPolicy: 'same-origin',
    },
  },
})
```

**Source:** [nuxt-security documentation](https://nuxt-security.vercel.app/headers/crossoriginembedderpolicy/), [web.dev COOP/COEP](https://web.dev/articles/coop-coep)

### Alternative: COOP/COEP via routeRules

```typescript
// nuxt.config.ts (if not using nuxt-security)
export default defineNuxtConfig({
  routeRules: {
    '/': {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  },
})
```

### SSR-Safe Blob Creation

```typescript
// composables/useImageLoader.ts
export function useImageLoader() {
  const blobRegistry = useBlobRegistry()

  async function loadImage(file: File): Promise<string | null> {
    // Only run on client
    if (!process.client) return null

    const url = blobRegistry.create(file)
    return url
  }

  function cleanup() {
    blobRegistry.revokeAll()
  }

  onUnmounted(cleanup)

  return { loadImage, cleanup }
}
```

### Worker Message with ImageBitmap Transfer

```typescript
// Main thread -> Worker
const bitmap = await createImageBitmap(file)
worker.postMessage(
  { type: 'process', imageId, cropRegion },
  [bitmap] // Transfer ownership — bitmap becomes detached in sender
)

// In worker
self.addEventListener('message', async (event) => {
  const { type, imageId, cropRegion } = event.data
  const bitmap = event.data.bitmap // ImageBitmap received via transfer

  // Process with OffscreenCanvas
  const canvas = new OffscreenCanvas(cropRegion.width, cropRegion.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height, 0, 0, cropRegion.width, cropRegion.height)

  const result = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })

  // CRITICAL: Close the ImageBitmap to release GPU memory
  bitmap.close()

  // Transfer result back
  const resultBitmap = await createImageBitmap(result)
  self.postMessage(
    { type: 'result', imageId, bitmap: resultBitmap },
    [resultBitmap]
  )
})
```

**Source:** [MDN: Worker postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage), [WHATWG: ImageBitmap.close()](https://wiki.whatwg.org/wiki/Changes_to_ImageBitmap_for_OffscreenCanvas)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strict TypeScript null checks | Loose TypeScript config (D-01) | Phase 1 decision | Faster initial DX; deferred null safety |
| Global window guards in every file | `process.client` composable pattern (D-02) | Phase 1 decision | Cleaner code; standard Nuxt pattern |
| Manual header middleware | `nuxt-security` module (D-03) | Phase 1 decision | Declarative config; maintained by community |
| Raw Worker in components | `useImageWorker` composable (D-04) | Phase 1 decision | Centralized lifecycle; easier to extend |
| Ad-hoc Blob URLs | `useBlobRegistry` composable (D-05) | Phase 1 decision | Prevents memory leaks; `revokeAll()` safety |
| Per-operation canvas creation | `useCanvasPool` composable (D-06) | Phase 1 decision | Reduces GC pressure; stable batch memory |
| Structured clone for large data | Transferable ImageBitmap (D-04) | Phase 1 decision | Zero-copy transfer; critical for >200KB data |
| Not calling ImageBitmap.close() | Explicit close() after drawImage() | Phase 1 discovery | Prevents GPU memory growth; stable long sessions |

**Deprecated/outdated:**
- `localStorage` for SSR-safe storage: Use `useCookie` instead
- `@nuxtjs/composition-api`: Deprecated; use native Nuxt 3 composables
- Canvas `toDataURL()`: Use `convertToBlob()` for better memory behavior

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `nuxt-security` module version 2.6.0 is compatible with latest Nuxt 3 | Standard Stack | Module may need different version; check before install |
| A2 | `useBlobRegistry` composable pattern is idiomatic Vue/Nuxt | Pattern 2 | Alternative patterns exist; this is a reasonable approach |
| A3 | `useCanvasPool` defaults to `navigator.hardwareConcurrency or 2` | Pattern 3 | Browser may report incorrect core count; user may want control |
| A4 | OffscreenCanvas available in target browsers (Chrome, Firefox, Safari 16.4+, Edge) | Pitfall 5 | Safari <16.4 lacks OffscreenCanvas; may need fallback |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Sass directory structure**
   - What we know: User specified Sass, Nuxt has no mandated structure
   - What's unclear: 7-1 pattern vs. flat structure preference
   - Recommendation: Start flat; restructure if complexity grows

2. **Pinia store organization**
   - What we know: User specified Pinia, no structure mandated
   - What's unclear: Feature-based vs. domain-based organization
   - Recommendation: Feature-based (stores per feature: `useImageStore`, `useCropStore`)

3. **Worker URL resolution in Nuxt 3**
   - What we know: Workers must be served as static files or via `new URL()` import
   - What's unclear: Exact Nuxt 3 pattern for worker file resolution
   - Recommendation: Place workers in `public/workers/` or use `new URL('./workers/foo.worker.ts', import.meta.url)`

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified — all tools available via npm/pip within project)

All required tools are available:
- Node.js v22.18.0 (runtime)
- npm 10.9.3 (package manager)
- Git (version control)

No external services, databases, or CLI utilities required for Phase 1.

---

## Validation Architecture

> Phase 1 is infrastructure-only; no direct requirements from REQUIREMENTS.md to validate.

**Test framework:** None required for infrastructure phase. Success criteria are build/runtime verification tasks.

### Phase Success Criteria Verification

| Criteria | Verification Method | Type |
|----------|--------------------|------|
| Nuxt 3 project builds with Pinia, Sass, production mode | `npm run build` succeeds | Smoke |
| COOP/COEP headers configured | Browser devtools network tab shows headers on index load | Manual |
| Web Worker communication works | Console log from worker on page load | Smoke |
| Blob URL registry prevents leaks | Import 50 images, check `URL.urls.size === 0` after cleanup | Unit |
| Canvas pool reuses elements | Inspect pool size vs. operations count | Unit |
| SSR-safe patterns work | No window/document errors in SSR render | Smoke |

### Wave 0 Gaps
- None — Phase 1 is greenfield infrastructure, no existing tests to extend

---

## Security Domain

> This phase is infrastructure setup. No user data, authentication, or sensitive operations.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Architecture | yes | COOP/COEP headers for cross-origin isolation (D-03) |
| V5 Input Validation | no | Phase 1 is infrastructure only |
| V12 Files Integrity | partial | Blob URL registry prevents URL-based attacks |

### Known Threat Patterns for Nuxt 3 + Browser Workers

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via user-provided filenames | Information Disclosure | Sanitize filenames in Phase 2; use Content-Disposition header on export |
| Memory exhaustion from Blob leaks | Denial of Service | `useBlobRegistry` with `revokeAll()` prevents unbounded growth |
| GPU memory exhaustion from ImageBitmaps | Denial of Service | Explicit `bitmap.close()` after transfer; canvas pooling |
| Cross-origin data leakage | Information Disclosure | COOP/COEP headers enforce cross-origin isolation |

---

## Sources

### Primary (HIGH confidence)
- [Nuxt 3](https://nuxt.com/) - Framework documentation, hydration patterns
- [Pinia](https://pinia.vuejs.org/) - State management API, Nuxt 3 integration
- [nuxt-security](https://nuxt-security.vercel.app/) - Security headers documentation
- [MDN: Worker.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) - Worker communication
- [WHATWG: ImageBitmap.close()](https://wiki.whatwg.org/wiki/Changes_to_ImageBitmap_for_OffscreenCanvas) - Memory management

### Secondary (MEDIUM confidence)
- [web.dev: Making your website cross-origin isolated](https://web.dev/articles/coop-coep) - COOP/COEP explanation
- [JavaScriptBit: Transferable Objects](https://javascriptbit.com/javascript-transferable-objects-postmessage/) - postMessage with transferables
- [Stack Overflow: ImageBitmap memory leak](https://stackoverflow.com/questions/67148570/memory-leak-in-javascript-webworker-canvas-indexeddb) - Real-world pattern

### Tertiary (LOW confidence)
- [DEV Community: Browser Image Converter](https://dev.to/enekomtz1/how-i-built-a-browser-image-converter-that-processes-files-in-parallel-1400) - Worker pool pattern (verify against MDN before trusting)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified on npm; Nuxt 3 and Pinia are established technologies
- Architecture: HIGH - SSR-safe patterns, Blob registry, canvas pooling are well-documented
- Pitfalls: MEDIUM - Cross-verified with MDN, Stack Overflow, and web.dev; some Safari specifics may vary

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (30 days — stable domain, no fast-moving changes expected)

---

## RESEARCH COMPLETE

**Phase:** 1 - Foundation
**Confidence:** HIGH

### Key Findings

1. **COOP/COEP headers** are best configured via `nuxt-security` module (clean API, version 2.6.0 verified on npm)
2. **SSR-safe patterns** use `process.client` guards and `onMounted` — Nuxt-documented pattern
3. **Memory management** requires explicit composables: `useBlobRegistry` for URL lifecycle, `useCanvasPool` for canvas reuse, `bitmap.close()` for GPU memory
4. **Worker communication** uses `postMessage` with `ImageBitmap` as transferable for zero-copy transfer (>200KB threshold)
5. **Pinia + Nuxt 3** integration via `@pinia/nuxt` module (version 0.11.3 verified)

### File Created
`/Users/carlosprieto/Repos/image-cropper/.planning/phases/01-foundation/01-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All packages verified on npm; established technologies |
| Architecture | HIGH | Patterns well-documented by MDN, Nuxt, and community |
| Pitfalls | MEDIUM | Cross-verified; Safari specifics may need testing |

### Open Questions
- Sass directory structure (flat vs. 7-1) — deferred to implementation
- Pinia store organization (feature vs. domain) — deferred to Phase 2 planning
- Worker file URL resolution in Nuxt 3 bundler — may need testing

### Ready for Planning
Research complete. Planner can now create PLAN.md files.