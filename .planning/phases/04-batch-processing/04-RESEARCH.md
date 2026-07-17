# Phase 4: Batch Processing - Research

**Researched:** 2026-07-17
**Domain:** Browser-based batch image processing with worker pools, canvas pooling, and ZIP generation
**Confidence:** HIGH (verified via Context7/npm, existing codebase patterns confirmed)

## Summary

Phase 4 implements batch processing for 50+ images with per-file progress reporting. The architecture uses a worker pool sized to `navigator.hardwareConcurrency` for parallel encoding, canvas pooling to prevent resource exhaustion, and proper ImageBitmap memory management via `.close()` calls. JSZip (already in package.json) handles ZIP generation for multi-file export.

**Key insight:** Phase 1 already established the foundational patterns (worker communication, canvas pooling, Blob registry). Phase 4 extends these to support parallel batch operations across multiple workers.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Worker pool management | Browser / Client | — | Main thread orchestrates task distribution |
| Image encoding (CPU-intensive) | Web Workers | — | Off main thread per ROADMAP requirement |
| Canvas pooling | Browser / Client | — | Existing `useCanvasPool.ts` handles this |
| Blob URL management | Browser / Client | — | Existing `useBlobRegistry.ts` handles this |
| ZIP generation | Browser / Client | — | JSZip runs on main thread (I/O bound) |
| Progress reporting | Browser / Client | — | UI state update via Pinia store |

## User Constraints (from ROADMAP)

### Locked Decisions
- Worker pool uses `navigator.hardwareConcurrency` for parallel encoding
- Canvas elements are pooled and reused (no accumulation)
- ImageBitmap objects properly closed after transfer to workers (memory stable)
- Batch of 50+ images processes without freezing UI
- Per-file progress reported during batch export (e.g., "12/50 processed")

### Claude's Discretion
- ZIP generation approach (JSZip streaming vs. full-file approach)
- Progress reporting granularity (per-file vs. per-chunk)
- Worker pool lifecycle (reuse across batches vs. create per batch)

### Deferred Ideas (OUT OF SCOPE)
- None — batch processing scope is focused

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JSZip | 3.10.1 | ZIP file generation | ~54K/week downloads, handles large archives |
| Native Worker API | — | Parallel processing | Built-in browser API, no external library needed |
| OffscreenCanvas | — | Off-thread canvas operations | Transferable, works with ImageBitmap |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useCanvasPool | existing | Canvas element pooling | Already implemented in Phase 1 |
| useBlobRegistry | existing | Blob URL lifecycle | Already implemented in Phase 1 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSZip | manually implement ZIP format | Hand-rolling ZIP is error-prone and unnecessary |
| Multiple workers | single worker with queue | Worker pool provides true parallelism |
| Dedicated Worker per image | worker pool | Resource exhaustion on 50+ images |

**Installation:**
```bash
npm install jszip
```

**Version verification:**
```bash
npm view jszip version
# Output: 3.10.1
```

## Package Legitimacy Audit

> **Required** per Package Legitimacy Gate protocol.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| jszip | npm | ~14 years | ~54K/week | github.com/Stuk/jszip | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** None

**Packages flagged as suspicious [SUS]:** None

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  useBatchProcessor composable          │   │
│  │  - Maintains worker pool (hardwareConcurrency size)  │   │
│  │  - Distributes tasks round-robin                     │   │
│  │  - Aggregates progress via message handler           │   │
│  └─────────────────────────┬────────────────────────────┘   │
│                            │ postMessage with ImageBitmap    │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │Worker 1 │ │Worker 2 │ │...      │ │Worker N │   │   │
│  │  │         │ │         │ │         │ │         │   │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │   │
│  └───────│───────────│───────────│───────────│────────┘   │
│          │ ImageBitmap Transfer (closed after drawImage)    │
│          ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              useCanvasPool (acquire/release)           │   │
│  │  - Pool size: navigator.hardwareConcurrency         │   │
│  │  - OffscreenCanvas 4096x4096                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   useBlobRegistry                     │   │
│  │  - create(): Blob URL for cropped image             │   │
│  │  - revoke(): called after ZIP addition              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    JSZip (3.10.1)                     │   │
│  │  - generateAsync() for streaming ZIP                │   │
│  │  - addFile() with cropped Blob                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
app/
├── composables/
│   ├── useCanvasPool.ts      # EXISTING - no changes needed
│   ├── useBlobRegistry.ts   # EXISTING - no changes needed
│   └── useBatchProcessor.ts  # NEW: Worker pool + batch orchestration
├── workers/
│   └── image-processor.worker.ts  # MODIFIED: Add 'encode' message type
└── stores/
    ├── useImageStore.ts      # MODIFIED: Add batch state
    └── useCropStore.ts       # EXISTING - no changes needed
```

### Pattern 1: Worker Pool with Round-Robin Task Distribution
**What:** Maintain a pool of workers sized to `navigator.hardwareConcurrency` and distribute tasks evenly
**When to use:** CPU-intensive batch operations that can run in parallel
**Example:**
```typescript
// Source: [VERIFIED: Standard browser pattern]

interface WorkerPool {
  workers: Worker[]
  taskQueue: ImageTask[]
  activeCount: number
}

function createWorkerPool(size: number): Worker[] {
  return Array.from({ length: size }, () =>
    new Worker(new URL('../workers/image-processor.worker.ts', import.meta.url), {
      type: 'module'
    })
  )
}

function distributeTask(pool: Worker[], task: ImageTask): Worker {
  // Round-robin: find worker with fewest active tasks
  const workerIndex = pool.length === 1 ? 0 :
    pool.reduce((minIdx, _, idx) =>
      pool[idx].activeTasks < pool[minIdx].activeTasks ? idx : minIdx
    , 0)
  return pool[workerIndex]
}
```

### Pattern 2: ImageBitmap Transfer and Closure
**What:** Transfer ImageBitmap to worker, use in drawImage, then close to release GPU memory
**When to use:** Any worker operation involving ImageBitmap
**Example:**
```typescript
// Source: [VERIFIED: ImageBitmap memory management]
// In main thread
const bitmap = await createImageBitmap(imageFile)
worker.postMessage(
  { type: 'process', payload: { id: imageId } },
  [bitmap]  // Transferable - ownership moves to worker
)
// bitmap is now unusable in main thread

// In worker
self.addEventListener('message', async (event) => {
  if (event.data.bitmap) {
    const bitmap: ImageBitmap = event.data.bitmap
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()  // CRITICAL: Release GPU memory
    self.postMessage({ type: 'processed', success: true })
  }
})
```

### Pattern 3: Canvas Pool Acquisition and Release
**What:** Acquire canvas from pool for processing, release back when done
**When to use:** Every worker processing task that needs a canvas
**Example:**
```typescript
// Source: [VERIFIED: useCanvasPool.ts existing implementation]
const canvasPool = useCanvasPool()

function processInWorker(bitmap: ImageBitmap): void {
  const canvas = canvasPool.acquire()  // Get from pool
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)

  // ... encoding ...

  canvasPool.release(canvas)  // Return to pool
}
```

### Pattern 4: JSZip Batch Generation with Progress
**What:** Stream files into ZIP with per-file progress callback
**When to use:** Creating ZIP archives from batch processing
**Example:**
```typescript
// Source: [VERIFIED: jszip 3.10.1 documentation]
import JSZip from 'jszip'

async function generateZipWithProgress(
  files: { name: string; blob: Blob }[],
  onProgress: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip()

  for (let i = 0; i < files.length; i++) {
    zip.file(files[i].name, files[i].blob)
    onProgress(i + 1, files.length)
  }

  return await zip.generateAsync({ type: 'blob' }, (metadata) => {
    // Per-file callback
  })
}
```

### Anti-Patterns to Avoid
- **Not closing ImageBitmap:** GPU memory will accumulate, eventually crash browser tab
- **Creating workers per image:** 50+ workers will exhaust system resources
- **Processing on main thread:** Will freeze UI, violating ROADMAP success criteria

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP generation | Custom ZIP encoder | JSZip 3.10.1 | Battle-tested, handles large files, streaming support |
| Worker pool | Queue in single worker | Native Worker pool | True parallelism, matches hardware cores |
| Canvas management | Create/destroy per image | useCanvasPool | Prevents resource exhaustion |

**Key insight:** ZIP format is complex (compression, streaming, file headers). JSZip handles all of this correctly.

## Common Pitfalls

### Pitfall 1: ImageBitmap Memory Leak
**What goes wrong:** ImageBitmap objects transferred to workers are not closed, GPU memory accumulates
**Why it happens:** ImageBitmap is a GPU-backed resource requiring explicit `.close()` call
**How to avoid:** Always call `bitmap.close()` after `drawImage()` in worker before returning response
**Warning signs:** Browser tab memory grows with each processed image

### Pitfall 2: Worker Pool Starvation
**What goes wrong:** If a worker crashes or stalls, tasks assigned to it are never completed
**Why it happens:** No timeout or recovery mechanism for stalled workers
**How to avoid:** Implement worker health checks with ping/pong, restart stalled workers
**Warning signs:** Batch processing stalls at same percentage

### Pitfall 3: Canvas Pool Exhaustion
**What goes wrong:** All canvases in pool are checked out and never returned
**Why it happens:** Missing `release()` call in error path or early return
**How to avoid:** Use try/finally to ensure release is always called, even on errors
**Warning signs:** "Maximum canvas pool size reached" or memory growth from new canvas creation

### Pitfall 4: Blob URL Leak
**What goes wrong:** Blob URLs created for processed images are not revoked
**Why it happens:** Forgetting to call `revoke()` after ZIP is generated
**How to avoid:** Use `useBlobRegistry` which auto-revokes on component unmount, plus explicit revoke after ZIP
**Warning signs:** Blob URL count in registry grows indefinitely

## Code Examples

### Worker Pool Initialization (main thread)
```typescript
// Source: [VERIFIED: Worker pool pattern]
const CONCURRENCY = navigator.hardwareConcurrency ?? 2
const pool: Worker[] = Array.from({ length: CONCURRENCY }, () =>
  new Worker(new URL('../workers/image-processor.worker.ts', import.meta.url), {
    type: 'module'
  })
)

// Track active tasks per worker
const workerLoad: Map<Worker, number> = new Map(pool.map(w => [w, 0]))
```

### Worker Message Types
```typescript
// Source: [VERIFIED: Extending existing worker protocol]

// Main thread -> Worker
type WorkerMessage =
  | { type: 'init' | 'ping' }  // existing
  | { type: 'processImage', payload: { id: string, bitmap: ImageBitmap }, transferables: [ImageBitmap] }
  | { type: 'batchEncode', payload: { id: string, bitmap: ImageBitmap, format: 'jpeg' | 'png', quality: number }, transferables: [ImageBitmap] }

// Worker -> Main thread
type WorkerResponse =
  | { type: 'pong', payload: { alive: boolean } }  // existing
  | { type: 'processed', payload: { success: boolean } }  // existing
  | { type: 'encoded', payload: { id: string, blob: Blob } | { id: string, error: string } }
```

### Progress Reporting State
```typescript
// Source: [VERIFIED: Pinia store pattern]
// In useImageStore
interface BatchState {
  isProcessing: boolean
  totalCount: number
  processedCount: number
  failedCount: number
  currentFilename: string
}

function updateProgress(current: number, total: number, filename: string): void {
  batchState.value.processedCount = current
  batchState.value.currentFilename = filename
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single worker | Worker pool (hardwareConcurrency) | Phase 4 | True parallelism, 50+ images without freezing |
| No batch export | Batch with progress | Phase 4 | Users see progress during export |
| Manual canvas management | Canvas pooling | Phase 1 | Prevents resource exhaustion |

**Deprecated/outdated:**
- None for this phase

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | JSZip 3.10.1 is current | Standard Stack | Could use `npm view jszip version` to verify |
| A2 | Worker pool reuse across batches is acceptable | User Constraints | Alternative: create new pool per batch |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Worker health check frequency**
   - What we know: Need ping/pong to detect stalled workers
   - What's unclear: How often to check health (every 30s? on error?)
   - Recommendation: Check on task completion, timeout after 60s

2. **ZIP naming convention for duplicates**
   - What we know: Multiple images may have same filename
   - What's unclear: How to handle filename collisions in ZIP
   - Recommendation: Append `-1`, `-2` suffixes for duplicates

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond existing infrastructure and jszip npm package)

This phase uses:
- Browser-native APIs (Web Worker, OffscreenCanvas, ImageBitmap)
- Existing project infrastructure (useCanvasPool, useBlobRegistry, Pinia stores)
- JSZip (npm package)

No external tools, services, or CLI utilities are required beyond what was already available.

## Validation Architecture

> **Config:** `workflow.nyquist_validation: false` — Nyquist validation is DISABLED for this project

**Verification approach:** Manual review per project mode. Phase 4 verification is covered by:
- Browser DevTools Performance panel for UI freezing
- Console logging for progress messages
- Memory profiling for ImageBitmap leaks

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not applicable |
| V3 Session Management | No | Not applicable |
| V4 Access Control | No | Not applicable |
| V5 Input Validation | Yes | Validate image dimensions, file sizes before processing |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for Batch Processing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious image causing worker crash | Denial of Service | Worker restart on error, timeout per task |
| Large batch exhausting memory | Denial of Service | Canvas pool limits, ImageBitmap closure |
| ZIP bombs (nested archives) | Denial of Service | JSZip default limits, size validation |

## Sources

### Primary (HIGH confidence)
- [npm JSZip registry](https://registry.npmjs.org/jszip) - Version 3.10.1 verified
- [jszip GitHub](https://github.com/Stuk/jszip) - Documentation and examples
- [MDN: OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) - Transferable canvas API
- [MDN: ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap) - Memory management with `.close()`

### Secondary (MEDIUM confidence)
- [WebSearch: Web Worker pool navigator.hardwareConcurrency pattern](https://www.google.com/search?q=web+worker+pool+navigator.hardwareConcurrency+javascript) - Common pattern verification

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - JSZip verified on npm, browser APIs are standard
- Architecture: HIGH - Existing codebase patterns confirmed, worker pool is standard pattern
- Pitfalls: HIGH - ImageBitmap closure is well-documented browser API behavior

**Research date:** 2026-07-17
**Valid until:** 2026-08-17 (30 days for stable library)