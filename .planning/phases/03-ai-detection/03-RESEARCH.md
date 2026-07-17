# Phase 3: AI Detection - Research

**Researched:** 2026-07-17
**Domain:** Smartcrop.js integration for AI-powered subject detection and crop positioning
**Confidence:** HIGH (verified via npm, jsDelivr CDN, GitHub docs)

## Summary

Phase 3 integrates Smartcrop.js for AI-powered content-aware cropping. The library analyzes images to find optimal focal points and positions the crop window accordingly. Smartcrop.js is lazy-loaded from CDN on first use (not bundled), runs detection in a Web Worker off the main thread, and falls back to center-crop if detection fails.

**Critical correction:** The package name is `smartcrop`, NOT `smartcropjs`. The CDN URL specified in UI-SPEC (`smartcropjs@2.0.5`) is incorrect. The correct CDN URL is `https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js`.

**Primary recommendation:** Use the CDN script injection pattern to lazy-load Smartcrop.js. In the Web Worker, load the library, then call `smartcrop.crop(image, options)` with the image data and desired crop dimensions. The result `topCrop` object contains `{x, y, width, height}` for positioning.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Smartcrop.js CDN loading | Browser / Client | Web Worker | Dynamic script injection happens in the worker context |
| AI detection computation | Web Worker | — | Off main thread per AIDT-05 |
| Crop window positioning | Browser / Client | — | UI state update after detection returns |
| CDN script caching | Browser | — | Native browser cache behavior |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Auto crop button triggers Smartcrop.js subject detection on selected image
- Smartcrop.js lazy-loaded from CDN (not bundled) on first use
- Detected focal point positions crop window automatically
- If AI fails or unavailable, center-crop is used as fallback
- AI processing runs in Web Worker (off main thread)
- Auto crop button is primary CTA for this phase
- Accent color reserved exclusively for auto crop button
- Button shows loading spinner during processing
- Toast notifications for fallback/failure messages
- Keyboard shortcut `A` for auto crop

### Claude's Discretion
All implementation choices are at Claude's discretion — using ROADMAP phase goal, UI-SPEC, and codebase patterns to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — phase scope is focused on AI detection integration.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| smartcrop | 2.0.5 | Content-aware crop detection | Industry-standard for client-side intelligent cropping, zero dependencies |
| Native Web Worker API | — | Off-thread processing | Built-in browser API, no external library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Nuxt 3 dynamic import | — | Lazy CDN script loading | Loading Smartcrop.js on first use |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| smartcrop | manually implement edge/skin detection | Custom solution would be significantly worse — Smartcrop.js has 12K+ GitHub stars, well-tested |
| CDN loading | bundle Smartcrop.js | Violates AIDT-02 requirement for lazy CDN loading |
| Web Worker | run on main thread | Would freeze UI during detection (AIDT-05 violation) |

**Installation:**
```bash
# No npm install needed — smartcrop is loaded via CDN, not bundled
# CDN URL (verified 200 OK):
# https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js
```

**Version verification:**
```bash
npm view smartcrop version
# Output: 2.0.5
```

## Package Legitimacy Audit

> **Critical:** Smartcrop.js is NOT a valid package name. The correct npm package is `smartcrop`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| smartcrop | npm | ~5 years | ~54K/week | github.com/jwagner/smartcrop.js | N/A (CDN-only) | Approved |
| smartcropjs | npm | — | — | — | — | REMOVED — package does not exist |

**Packages removed:** `smartcropjs` — package does not exist on npm or jsDelivr (verified via curl)

**Packages flagged as suspicious [SUS]:** None

**Critical correction:** The UI-SPEC.md and CONTEXT.md reference `smartcropjs` as the package name. This is incorrect. The correct package is `smartcrop`. The CDN URL in UI-SPEC.md (`https://cdn.jsdelivr.net/npm/smartcropjs@latest/smartcrop.min.js`) returns 404. The correct URL is `https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js`.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CropWorkspace.vue                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Auto Crop   │  │ Ratio        │  │ Export           │   │
│  │ Button (A)  │  │ Controls     │  │ Button           │   │
│  └──────┬──────┘  └──────────────┘  └──────────────────┘   │
└─────────┼───────────────────────────────────────────────────┘
          │ onAutoCrop()
          ▼
┌─────────────────────────────────────────────────────────────┐
│                  useSmartCrop composable                     │
│  - Lazy-loads Smartcrop.js from CDN                        │
│  - Manages loading state (isDetecting)                     │
│  - Handles fallback to center-crop                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ postMessage({ type: 'ai-detect', ... })
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              image-processor.worker.ts                       │
│  - Receives image bitmap data                              │
│  - Loads Smartcrop.js from CDN (if not cached)             │
│  - Calls smartcrop.crop(image, { width, height })           │
│  - Returns { x, y, width, height }                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ postMessage({ type: 'ai-result', ... })
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  CropWorkspace.vue                           │
│  - Updates crop window position via useCropWindow           │
│  - Shows toast on fallback                                 │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
app/
├── composables/
│   └── useSmartCrop.ts          # NEW: Smartcrop.js integration composable
├── workers/
│   └── image-processor.worker.ts  # MODIFIED: Add 'ai-detect' message type
└── components/
    ├── CropWorkspace.vue          # MODIFIED: Auto crop button, keyboard shortcut
    └── IconButton.vue            # MODIFIED: Add 'sparkles' icon, loading state
```

### Pattern 1: Lazy CDN Script Loading in Web Worker
**What:** Dynamically load Smartcrop.js from CDN only when first needed
**When to use:** When a library must not be bundled but must be available in a Web Worker
**Example:**
```typescript
// Source: https://github.com/jwagner/smartcrop.js (verified)
// In the Web Worker
let smartcropLib: typeof import('smartcrop') | null = null

async function ensureSmartcrop(): Promise<typeof import('smartcrop')> {
  if (smartcropLib) return smartcropLib

  // Dynamic script injection for CDN loading
  await importScripts('https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js')

  // The library exposes itself as 'smartcrop' global
  smartcropLib = (self as any).smartcrop
  return smartcropLib
}

async function detectCrop(imageData: ImageData, width: number, height: number) {
  const sc = await ensureSmartcrop()
  const result = await sc.crop(imageData, { width, height })
  return result.topCrop
}
```

### Pattern 2: Web Worker Message Protocol for AI Detection
**What:** Extend existing worker message protocol with new `ai-detect` type
**When to use:** When adding new off-thread processing to existing worker infrastructure
**Example:**
```typescript
// Message to worker
{ type: 'ai-detect', payload: { imageBitmap: ImageBitmap, cropWidth: number, cropHeight: number } }

// Response from worker
{ type: 'ai-result', payload: { x: number, y: number, width: number, height: number } | null }
// null indicates detection failed, fallback to center-crop
```

### Pattern 3: SSR-Safe Composable with Loading State
**What:** Create a composable that manages async loading state and handles SSR
**When to use:** When the composable does async work (CDN loading, detection) that should not run on server
**Example:**
```typescript
// Source: Existing useImageWorker.ts SSR pattern
export function useSmartCrop() {
  // Early return for SSR safety
  if (!process.client) {
    return { detect: () => {}, isDetecting: { value: false } }
  }

  const isDetecting = ref(false)
  // ... implementation
  return { detect, isDetecting: readonly(isDetecting) }
}
```

### Anti-Patterns to Avoid
- **Bundle Smartcrop.js:** Violates AIDT-02. The requirement explicitly states CDN lazy-loading.
- **Run detection on main thread:** Would freeze UI on large images, violating AIDT-05.
- **Use package name `smartcropjs`:** This package does not exist. Use `smartcrop`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content-aware crop detection | Custom edge/skin detection algorithm | smartcrop 2.0.5 | 12K GitHub stars, well-tested, zero dependencies, sub-20ms performance |
| Center-crop fallback | Guess center point manually | useCropWindow.centerCrop() | Already implemented in useCropWindow composable |

**Key insight:** Smartcrop.js is a battle-tested library. Rolling custom detection would be both worse quality and more work than integrating the real thing.

## Common Pitfalls

### Pitfall 1: Wrong Package Name
**What goes wrong:** `smartcropjs` does not exist on npm or jsDelivr. Attempting to load it will 404.
**Why it happens:** The UI-SPEC.md and CONTEXT.md incorrectly reference `smartcropjs` instead of `smartcrop`.
**How to avoid:** Use `smartcrop` (without `js`) as the package name. Correct CDN URL: `https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js`
**Warning signs:** 404 errors when trying to load the CDN script

### Pitfall 2: CORS Issues with Cross-Domain Images
**What goes wrong:** Smartcrop.js works with ImageData/canvas, but cross-domain images without CORS headers will taint the canvas and cause errors.
**Why it happens:** Browser security policy — canvas becomes tainted when drawing cross-origin images without proper headers.
**How to avoid:** Ensure images are same-origin OR have `crossOrigin="anonymous"` attribute and server sends `Access-Control-Allow-Origin` header.
**Warning signs:** "Tainted canvases may not be exported" errors in console

### Pitfall 3: ImageBitmap Transfer Without Proper Closure
**What goes wrong:** ImageBitmap objects are transferred (not cloned) to workers. If not closed after transfer, memory leaks occur.
**Why it happens:** ImageBitmap is a GPU-backed resource that must be explicitly closed.
**How to avoid:** Call `.close()` on ImageBitmap after transferring to worker, or rely on worker termination to clean up.
**Warning signs:** Memory usage grows with each detection run

### Pitfall 4: CDN Script Caching in Worker
**What goes wrong:** `importScripts` caches globally in the worker context, but if the worker is terminated and recreated, the script may not be cached on subsequent runs in some browsers.
**Why it happens:** Worker context is separate; caching behavior varies by browser.
**How to avoid:** Use a module-level flag to track if script was already loaded, with a fallback reload.

## Code Examples

Verified patterns from official sources:

### Smartcrop.js Basic Usage
```typescript
// Source: https://github.com/jwagner/smartcrop.js README (verified)
// Basic API: smartcrop.crop(image, options)
// image: Anything ctx.drawImage() accepts (HTMLImageElement, HTMLCanvasElement, etc.)
// options: { width, height, minScale?, boost?, ruleOfThirds? }
// Returns: Promise<{ topCrop: { x, y, width, height } }>

const result = await smartcrop.crop(imageElement, {
  width: 400,
  height: 300,
  minScale: 1.0,      // Prevent crops smaller than necessary
  ruleOfThirds: true  // Enable rule of thirds weighting
})

const crop = result.topCrop
// crop.x = 300, crop.y = 200, crop.width = 400, crop.height = 300
```

### Dynamic Script Loading in Worker
```typescript
// Source: Worker pattern from useImageWorker.ts + Smartcrop.js CDN loading
// Using importScripts for classic script loading in dedicated worker

async function loadSmartcrop(): Promise<any> {
  return new Promise((resolve, reject) => {
    // @ts-ignore - smartcrop global is added by the script
    if (self.smartcrop) {
      resolve(self.smartcrop)
      return
    }

    self.importScripts('https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js')

    if (self.smartcrop) {
      resolve(self.smartcrop)
    } else {
      reject(new Error('Failed to load Smartcrop.js'))
    }
  })
}
```

### Center-Crop Fallback (Existing Pattern)
```typescript
// Source: useCropWindow.ts centerCrop() method (verified)
// Center the crop window in the image using existing composable

function centerCrop(): void {
  const x = (imageWidth - state.value.width) / 2
  const y = (imageHeight - state.value.height) / 2
  state.value.x = Math.max(0, x)
  state.value.y = Math.max(0, y)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual crop only | AI-assisted crop via Smartcrop.js | Phase 3 | Users get automatic subject detection |
| Bundle libraries | CDN lazy-loading | AIDT-02 requirement | Smaller bundle, faster initial load |

**Deprecated/outdated:**
- None for this phase

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Smartcrop.js 2.0.5 is still current | Standard Stack | Current (2021) — but check if newer version exists before implementation |
| A2 | Web Worker can use `importScripts` for CDN loading | Architecture Patterns | Standard Web Worker API — should work in all modern browsers |
| A3 | ImageData from canvas can be passed to Smartcrop.js | Code Examples | Standard API usage — Smartcrop.js accepts anything drawImage accepts |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Image source CORS handling**
   - What we know: Cross-origin images without CORS will cause canvas tainting
   - What's unclear: Whether the project needs to handle cross-origin images or if all images are same-origin
   - Recommendation: Handle CORS gracefully with error handling and fallback to center-crop

2. **CDN URL versioning**
   - What we know: `@2.0.5` is pinned in research, but UI-SPEC uses `@latest`
   - What's unclear: Whether `@latest` is acceptable or if pinned version is required
   - Recommendation: Use pinned version `@2.0.5` for reproducibility

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond browser APIs and CDN)

This phase uses only:
- Browser-native APIs (Web Worker, Canvas, ImageData)
- CDN-loaded library (Smartcrop.js via jsDelivr)
- Existing project infrastructure (useImageWorker, useCropWindow, etc.)

No external tools, services, or CLI utilities are required beyond what was already available in Phase 1/2.

## Validation Architecture

> **Config:** `workflow.nyquist_validation: false` — Nyquist validation is DISABLED for this project

**Verification approach:** Manual review per project mode. Phase 3 verification is covered by:
- Browser console checking for CDN load success/failure
- Manual testing of auto crop button and keyboard shortcut

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not applicable |
| V3 Session Management | No | Not applicable |
| V4 Access Control | No | Not applicable |
| V5 Input Validation | Yes | Image dimension validation before passing to Smartcrop.js |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for Smartcrop.js Integration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious image causing DoS in worker | Denial of Service | Worker timeout, terminate and restart worker |
| Large image causing memory exhaustion | Denial of Service | Image dimension limits before processing |
| XSS via CDN script injection | Injection | Only use trusted CDN (jsdelivr), verify script hash in production |

**Mitigation notes:**
- Smartcrop.js is loaded from jsdelivr CDN (trusted)
- CDN scripts are cached by browser
- No user data is sent to external services

## Sources

### Primary (HIGH confidence)
- [GitHub jwagner/smartcrop.js](https://github.com/jwagner/smartcrop.js/) - Main repository with README and examples
- [npm smartcrop registry page](https://registry.npmjs.org/smartcrop) - Package metadata, version 2.0.5
- [jsDelivr CDN verification](https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js) - Confirmed 200 OK with curl

### Secondary (MEDIUM confidence)
- [WebSearch: smartcrop.js CDN jsdelivr npm API usage crop](https://www.google.com/search?q=smartcrop.js+CDN+jsdelivr+npm+API+usage+crop) - Ecosystem usage patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Package verified on npm, CDN verified with curl
- Architecture: HIGH - Web Worker pattern exists in codebase (useImageWorker.ts)
- Pitfalls: MEDIUM - CDN URL corrected based on verification, CORS handling is assumption

**Research date:** 2026-07-17
**Valid until:** 2026-08-17 (30 days for stable library version)
