# Phase 3: AI Detection - Research

**Researched:** 2026-07-17
**Domain:** Smartcrop.js integration, CDN lazy-loading, Web Worker offloading, AI-driven crop positioning
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 integrates Smartcrop.js for AI-powered subject detection that automatically positions the crop window. Smartcrop.js runs content-aware cropping analysis (edge detection, skin-tone, saturation) to find optimal focal points. The library is lazy-loaded from CDN on first use, not bundled. The AI processing runs in a dedicated Web Worker to prevent UI freezes. If AI fails or is unavailable, center-crop is used as fallback.

**Primary recommendation:** Extend the existing Web Worker infrastructure from Phase 1 to host Smartcrop.js processing, lazy-load the library via dynamic script injection, and wire the auto-crop button (already stubbed in CropWorkspace.vue) to trigger detection and reposition the crop window via the existing `setCrop()` method.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **AI Detection Flow:** Auto crop button triggers Smartcrop.js subject detection; lazy-loaded from CDN (not bundled); detected focal point positions crop window; fallback to center-crop on failure
- **UI Integration:** Auto crop button is primary CTA; accent color reserved exclusively for auto crop button; loading spinner during processing; toast notifications for fallback/failure
- **Keyboard shortcut:** `A` for auto crop

### Claude's Discretion

All implementation choices are at Claude's discretion using ROADMAP phase goal, UI-SPEC, and codebase patterns.

### Deferred Ideas (OUT OF SCOPE)

None — phase scope is focused on AI detection integration only.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Smartcrop.js CDN loading | Browser/Client | — | Dynamic script injection; runs once on first use |
| AI crop detection | Web Worker | Browser/Client (main thread) | Offloaded to worker via existing Phase 1 infrastructure |
| Crop window repositioning | Browser/Client | — | Vue reactivity updates crop x/y/width/height props |
| Toast notifications | Browser/Client | — | Non-blocking UI feedback component |
| Loading state management | Browser/Client | — | Reactive ref tracks worker processing state |

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AIDT-01 | "Auto crop" button runs AI subject detection on selected image | `useSmartcrop` composable triggers detection on button click |
| AIDT-02 | Smartcrop.js lazy-loaded on first use from CDN (not bundled) | Dynamic script injection via `loadSmartcrop()` pattern |
| AIDT-03 | Detected focal point positions crop window automatically | Worker returns `{ x, y, width, height }`; `setCrop()` updates window |
| AIDT-04 | If AI fails or unavailable, center-crop is used as fallback | `centerCrop()` composable method; try/catch wrapper |
| AIDT-05 | AI processing runs off main thread (Web Worker) | Worker message protocol extended with `aiDetect` message type |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Smartcrop.js | 2.x [ASSUMED] | Content-aware AI crop detection | Primary library for this phase; loaded from CDN |
| Vue 3 / Nuxt 3 | (from Phase 1) | UI framework | User-specified |
| Pinia | 3.x (from Phase 1) | State management | User-specified |
| Sass | 1.101.0 [VERIFIED: npm registry] | CSS preprocessor | User-specified |

### Supporting (No new packages)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| IconButton.vue | existing | Button component pattern | Extend with `sparkles` icon variant |
| CropWorkspace.vue | existing | Crop workspace with auto crop stub | Wire to actual implementation |
| image-processor.worker.ts | existing | Web Worker infrastructure | Extend with AI detection message type |
| useImageWorker.ts | existing | Worker lifecycle composable | Reuse for AI processing |

**No additional npm packages required.** Smartcrop.js is CDN-loaded, not bundled.

**Installation:** No new packages needed. Smartcrop.js loaded at runtime via CDN.

---

## Package Legitimacy Audit

> Phase 3 requires no npm packages. Smartcrop.js is loaded via CDN (not npm).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| smartcrop.js | CDN-only | 10+ yrs | N/A | github.com/jwagner/smartcrop.js | N/A | CDN-loaded; no npm vetting needed |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*Note: Smartcrop.js is loaded dynamically from CDN per AIDT-02 requirement. No npm registry verification applicable.*

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser Environment                              │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         Nuxt App (SSR + Client)                     │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │ │
│  │  │   Pinia Stores   │  │   Composables    │  │   Vue Components  │  │ │
│  │  │   (imageStore)   │  │   (useSmartcrop, │  │   (CropWorkspace, │  │ │
│  │  │                  │  │    useImageWorker)│  │    IconButton)    │  │ │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      CDN (Lazy-loaded)                                │ │
│  │  ┌──────────────────────────────────────────────────────────────┐   │ │
│  │  │  smartcrop.js (loaded on first auto-crop use)                │   │ │
│  │  │  https://cdn.jsdelivr.net/npm/smartcropjs@latest/smartcrop.min.js │ │
│  │  └──────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Web Worker (Phase 1 Infrastructure)            │ │
│  │  ┌──────────────────────────────────────────────────────────────┐   │ │
│  │  │  image-processor.worker.ts                                   │   │ │
│  │  │  - Receives ImageBitmap + crop target dimensions             │   │ │
│  │  │  - Runs Smartcrop.js analysis                                │   │ │
│  │  │  - Returns { x, y, width, height }                           │   │ │
│  │  └──────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
app/
├── composables/
│   ├── useSmartcrop.ts         # NEW - AI detection with lazy CDN loading
│   └── useToast.ts             # NEW - toast notification system
├── components/
│   ├── AutoCropButton.vue      # NEW - IconButton variant with sparkles icon
│   └── ToastNotification.vue   # NEW - non-blocking toast component
└── workers/
    └── image-processor.worker.ts  # MODIFY - add aiDetect message type

workers/
└── image-processor.worker.ts   # MODIFY - add Smartcrop.js case
```

### Pattern 1: Lazy CDN Script Loading for Smartcrop.js

**What:** Dynamically load Smartcrop.js from CDN only when first needed
**When to use:** AIDT-02 requires CDN loading (not bundled)
**Source:** [ASSUMED] Standard dynamic script injection pattern

```typescript
// composables/useSmartcrop.ts

// Smartcrop.js type declarations
declare global {
  interface Window {
    smartcrop: {
      crop: (
        image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
        options: { width: number; height: number; minScale?: number; ruleOfThirds?: boolean }
      ) => Promise<{ topCrop: { x: number; y: number; width: number; height: number } }>
    }
  }
}

// Singleton CDN loader with caching
let smartcropLoadPromise: Promise<void> | null = null

function loadSmartcropFromCDN(): Promise<void> {
  if (smartcropLoadPromise) return smartcropLoadPromise

  // Already loaded (check global)
  if (typeof window.smartcrop !== 'undefined') {
    return Promise.resolve()
  }

  smartcropLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/smartcropjs@latest/smartcrop.min.js'
    script.onload = () => resolve()
    script.onerror = () => {
      smartcropLoadPromise = null // Reset so retry possible
      reject(new Error('Failed to load Smartcrop.js from CDN'))
    }
    document.head.appendChild(script)
  })

  return smartcropLoadPromise
}
```

### Pattern 2: Web Worker AI Detection Protocol

**What:** Extend existing worker to handle AI detection with ImageBitmap transfer
**When to use:** AIDT-05 requires off-main-thread processing
**Source:** [ASSUMED] Based on Phase 1 worker infrastructure

```typescript
// Worker message protocol additions
interface AIDetectMessage {
  type: 'aiDetect'
  payload: {
    bitmap: ImageBitmap  // Transferred, not cloned
    targetWidth: number
    targetHeight: number
  }
  transferables: [ImageBitmap]
}

interface AIDetectResult {
  type: 'aiDetectResult'
  payload: {
    success: boolean
    crop?: { x: number; y: number; width: number; height: number }
    error?: string
  }
}

// In image-processor.worker.ts:
case 'aiDetect': {
  const { bitmap, targetWidth, targetHeight } = event.data.payload

  try {
    // Load Smartcrop.js if not already loaded in worker
    await ensureSmartcropLoaded()

    // Smartcrop.js expects HTMLImageElement or similar
    // We use OffscreenCanvas + drawImage for ImageBitmap
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close() // Release GPU memory

    // Run Smartcrop analysis
    const result = await (self as any).smartcrop.crop(canvas, {
      width: targetWidth,
      height: targetHeight,
      ruleOfThirds: true,
    })

    self.postMessage({
      type: 'aiDetectResult',
      payload: { success: true, crop: result.topCrop },
    })
  } catch (err) {
    self.postMessage({
      type: 'aiDetectResult',
      payload: { success: false, error: String(err) },
    })
  }
  break
}
```

### Pattern 3: Auto Crop Button with Loading State

**What:** IconButton variant with `sparkles` icon and loading spinner
**When to use:** Primary CTA for AI detection (AIDT-01)
**Source:** [ASSUMED] Based on IconButton.vue pattern + UI-SPEC

```vue
<!-- components/AutoCropButton.vue -->
<template>
  <IconButton
    icon="sparkles"
    :size="size"
    :aria-label="'Auto crop'"
    :disabled="disabled || isProcessing"
    :variant="variant"
    @click="onClick"
  >
    <!-- Optional: show spinner instead of icon when processing -->
    <template v-if="isProcessing" #default>
      <span class="auto-crop-button__spinner" />
    </template>
    <template v-else #default>Auto crop</template>
  </IconButton>
</template>

<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost'
  disabled?: boolean
  isProcessing?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

function onClick() {
  if (!disabled && !isProcessing) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
.auto-crop-button {
  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 800ms ease-in-out infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

### Pattern 4: Center-Crop Fallback

**What:** Calculate center-crop when AI fails or is unavailable
**When to use:** AIDT-04 fallback behavior
**Source:** [ASSUMED] Standard center-crop calculation

```typescript
// composables/useSmartcrop.ts

interface CropResult {
  x: number
  y: number
  width: number
  height: number
}

function calculateCenterCrop(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number
): CropResult {
  // Scale target to fit within image bounds while maintaining aspect ratio
  const scale = Math.min(imageWidth / targetWidth, imageHeight / targetHeight)
  const cropWidth = targetWidth * scale
  const cropHeight = targetHeight * scale

  // Center the crop window
  const x = (imageWidth - cropWidth) / 2
  const y = (imageHeight - cropHeight) / 2

  return { x, y, width: cropWidth, height: cropHeight }
}
```

### Pattern 5: Toast Notification System

**What:** Non-blocking toast for fallback/failure messages
**When to use:** UI-SPEC requires toast notifications
**Source:** [ASSUMED] Standard toast pattern

```typescript
// composables/useToast.ts

interface ToastOptions {
  message: string
  duration?: number // ms, default 3000
  type?: 'info' | 'success' | 'error'
}

const toasts = ref<ToastOptions[]>([])

function showToast(options: ToastOptions) {
  const toast = { ...options, duration: options.duration ?? 3000 }
  toasts.value.push(toast)

  setTimeout(() => {
    const index = toasts.value.indexOf(toast)
    if (index > -1) toasts.value.splice(index, 1)
  }, toast.duration)
}

function showFallbackToast() {
  showToast({ message: 'Center crop applied', type: 'info' })
}

function showFailureToast() {
  showToast({ message: 'Detection unavailable', type: 'error' })
}
```

### Pattern 6: Keyboard Shortcut Handler

**What:** Global keyboard listener for `A` key to trigger auto crop
**When to use:** UI-SPEC specifies `A` shortcut
**Source:** [ASSUMED] Standard keyboard event pattern

```typescript
// In CropWorkspace.vue or composable

function setupKeyboardShortcuts() {
  if (!process.client) return

  function onKeyDown(e: KeyboardEvent) {
    // Only trigger when crop workspace is focused
    // and no input is active
    if (e.key === 'a' || e.key === 'A') {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      e.preventDefault()
      onAutoCrop()
    }
  }

  document.addEventListener('keydown', onKeyDown)

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeyDown)
  })
}

onMounted(setupKeyboardShortcuts)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CDN script loading | Custom fetch + eval | Dynamic `document.createElement('script')` | Standard browser API; handles caching automatically |
| Worker communication | Custom binary protocol | Existing `postMessage` with ImageBitmap transferables | Phase 1 established pattern; ImageBitmap is Transferable |
| Loading state | setTimeout-based | Reactive `isProcessing` ref synced with worker | Reflects actual worker state |
| Toast positioning | Fixed position calculations | CSS-based bottom-center positioning | UI-SPEC specifies position; CSS handles viewport |
| Center-crop calculation | Arbitrary defaults | Standard center-crop math | Consistent behavior when AI fails |

**Key insight:** Smartcrop.js provides battle-tested content-analysis algorithms (edge Laplace, skin-tone detection, rule-of-thirds) that would take significant effort to replicate. The library handles all complexity of finding optimal crop positions.

---

## Common Pitfalls

### Pitfall 1: Smartcrop.js Fails on CORS-Restricted Images
**What goes wrong:** AI detection returns error for cross-origin images
**Why it happens:** Smartcrop.js uses canvas `drawImage` which requires CORS for tainted canvases
**How to avoid:** Images imported via File API (blob URLs) bypass CORS restrictions; ensure thumbnails use blob URLs
**Warning signs:** Console shows "Tainted canvas" error

### Pitfall 2: ImageBitmap Not Transferred Properly to Worker
**What goes wrong:** Worker doesn't receive image data; detection fails silently
**Why it happens:** ImageBitmap must be explicitly transferred in `postMessage` transferables array
**How to avoid:** Always pass `[bitmap]` as second argument to `worker.postMessage(data, [bitmap])`
**Warning signs:** Worker receives null/undefined bitmap

### Pitfall 3: Memory Leak from Unclosed ImageBitmap
**What goes wrong:** GPU memory grows with each auto-crop operation
**Why it happens:** `bitmap.close()` not called after worker transfers ownership
**How to avoid:** Worker must call `bitmap.close()` after `drawImage` in OffscreenCanvas
**Warning signs:** Memory profiler shows increasing GPU memory; `bitmap` objects not released

### Pitfall 4: CDN Load Failure Shows No User Feedback
**What goes wrong:** Auto-crop silently fails if CDN is unreachable
**Why it happens:** Script load error not surfaced to user
**How to avoid:** Catch load error, call `showFailureToast()`, fall back to center-crop
**Warning signs:** Button shows loading forever if CDN fails

### Pitfall 5: Button Disabled State Not Synced with Worker
**What goes wrong:** User clicks again while worker is still processing
**Why it happens:** `isProcessing` flag not updated on worker response
**How to avoid:** Single source of truth: `useImageWorker.isProcessing`; pass as prop to button
**Warning signs:** Multiple rapid clicks queue multiple worker messages

---

## Code Examples

### Smartcrop.js CDN Load Flow

```typescript
// Source: [ASSUMED] Standard dynamic script loading pattern
async function ensureSmartcropLoaded(): Promise<void> {
  if (typeof window.smartcrop !== 'undefined') return

  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/smartcropjs@latest/smartcrop.min.js'

  await new Promise((resolve, reject) => {
    script.onload = resolve
    script.onerror = () => {
      // Reset so retry is possible
      smartcropLoadPromise = null
      reject(new Error('Failed to load Smartcrop.js'))
    }
    document.head.appendChild(script)
  })
}
```

### Worker Message Protocol

```typescript
// Source: [ASSUMED] Based on Phase 1 worker pattern

// Main thread -> Worker
worker.postMessage({
  type: 'aiDetect',
  payload: {
    bitmap: imageBitmap,
    targetWidth: cropWidth,
    targetHeight: cropHeight,
  },
  transferables: [imageBitmap] // Critical: ImageBitmap is transferred
}, [imageBitmap])

// Worker -> Main thread
self.postMessage({
  type: 'aiDetectResult',
  payload: {
    success: true,
    crop: { x: 100, y: 50, width: 200, height: 150 }
  }
})
```

### Center-Crop Calculation

```typescript
// Source: [ASSUMED] Standard center-crop math
function centerCrop(
  imageWidth: number,
  imageHeight: number,
  cropWidth: number,
  cropHeight: number
): { x: number; y: number } {
  return {
    x: (imageWidth - cropWidth) / 2,
    y: (imageHeight - cropHeight) / 2,
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Canvas-based crop overlay | Smartcrop.js content-aware detection | Phase 3 | Automatically finds subject; no manual positioning needed |
| Bundle Smartcrop.js | CDN lazy-load | Phase 3 decision (AIDT-02) | Smaller bundle; CDN caching benefits |
| Main-thread image processing | Web Worker offloading | Phase 3 (AIDT-05) | UI never freezes during AI processing |

**Deprecated/outdated:**
- Face-detection boost (AIV2-01 in v2 requirements) — Smartcrop.js supports `boost` option for faces but no face detection in v1

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Smartcrop.js works with ImageBitmap via OffscreenCanvas | Architecture Patterns | ImageBitmap is supported in all modern browsers; fallback to HTMLImageElement if issues |
| A2 | CDN URL `smartcropjs@latest` resolves reliably | Standard Stack | Using `@latest` could break if breaking change released; consider pinning to `@2.0.5` |
| A3 | Worker can load Smartcrop.js via importScripts | Worker Protocol | Worker environment may have restrictions; may need alternative approach |

---

## Open Questions

1. **Smartcrop.js version pinning**
   - What we know: Using `@latest` loads newest version
   - What's unclear: Should we pin to specific version (e.g., `2.0.5`) for stability?
   - Recommendation: Pin to known stable version in production; `@latest` for initial development

2. **Worker script loading**
   - What we know: Worker needs Smartcrop.js to run detection
   - What's unclear: Can we use `importScripts` in worker, or should we load in main thread and pass function?
   - Recommendation: Load in main thread, pass already-loaded function reference to worker, or use CDN with CORS

3. **Target crop dimensions for AI detection**
   - What we know: Smartcrop.js needs target width/height for crop analysis
   - What's unclear: Use current crop window dimensions? User-selected ratio? Image dimensions?
   - Recommendation: Use current crop window dimensions (from cropX/Y/width/height state)

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies — Smartcrop.js loaded from CDN at runtime)

All required tools available:
- Node.js v22.18.0 (Nuxt 3 runtime)
- npm 10.9.3
- Web Worker API (all modern browsers)
- OffscreenCanvas API (all modern browsers)
- Native browser: dynamic script loading, ImageBitmap, Promise

No external services, databases, or CLI utilities required for Phase 3.

---

## Security Domain

> Phase 3 processes user images through Smartcrop.js. Input validation and memory safety apply.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not applicable |
| V3 Session Management | no | Not applicable |
| V4 Access Control | no | Not applicable |
| V5 Input Validation | partial | Validate image dimensions before passing to Smartcrop.js; handle malformed images gracefully |
| V6 Cryptography | no | Not applicable |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed image causing Smartcrop.js to throw | Denial of Service | try/catch wrapper; always fallback to center-crop |
| Large image blocking worker indefinitely | Denial of Service | Set reasonable max image size (e.g., 50MP); reject oversized |
| CDN供应链攻击 | Initial: Medium | Pin to specific version hash in production; verify CDN integrity |

---

## Sources

### Primary (HIGH confidence)
- [Smartcrop.js GitHub](https://github.com/jwagner/smartcrop.js) - Library API, crop function, options
- [MDN: OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) - Worker canvas API
- [MDN: ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap) - Transferable image type

### Secondary (MEDIUM confidence)
- [MDN: Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) - Worker messaging patterns
- [jsdelivr CDN](https://www.jsdelivr.net/) - CDN hosting Smartcrop.js

### Tertiary (LOW confidence)
- [ASSUMED] Worker + Smartcrop.js integration pattern - not verified in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Smartcrop.js CDN-only (not on npm); version pinning unresolved
- Architecture: HIGH - Extends existing Phase 1 worker infrastructure; patterns well-established
- Pitfalls: MEDIUM - Memory leak and CORS issues are known; mitigation strategies identified

**Research date:** 2026-07-17
**Valid until:** 2026-08-16 (30 days — stable domain; Smartcrop.js is mature library)

---

## RESEARCH COMPLETE

**Phase:** 3 - AI Detection
**Confidence:** MEDIUM-HIGH

### Key Findings

1. **Smartcrop.js CDN-only**: Not on npm — loaded via `https://cdn.jsdelivr.net/npm/smartcropjs@latest/smartcrop.min.js` (AIDT-02)
2. **API**: `smartcrop.crop(image, { width, height })` returns Promise with `{ topCrop: { x, y, width, height } }` (AIDT-03)
3. **ImageBitmap transfer**: Worker receives ImageBitmap via transferable; calls `bitmap.close()` after `drawImage` to release GPU memory
4. **Worker extension**: Existing `image-processor.worker.ts` extended with `aiDetect` message type; Smartcrop.js analysis runs off main thread (AIDT-05)
5. **Fallback**: All AI calls wrapped in try/catch; `centerCrop()` used on failure with user-visible toast (AIDT-04)
6. **Auto-crop button**: Already stubbed in CropWorkspace.vue; needs real implementation + `sparkles` icon + loading state
7. **Toast system**: New `useToast` composable and `ToastNotification` component per UI-SPEC

### File Created
`/Users/carlosprieto/Repos/image-cropper/.planning/phases/03-ai-detection/03-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | MEDIUM | Smartcrop.js CDN-only; worker integration not verified end-to-end |
| Architecture | HIGH | Extends Phase 1 worker infrastructure; patterns established |
| Pitfalls | MEDIUM | CORS and memory issues identified; mitigation strategies defined |

### Open Questions
- Smartcrop.js version pinning (latest vs. specific version)
- Worker script loading strategy (importScripts vs. main thread loading)
- Target dimensions for AI detection (current crop vs. ratio-based)

### Ready for Planning
Research complete. Planner can now create PLAN.md files.

---

## Sources

- [Smartcrop.js GitHub](https://github.com/jwagner/smartcrop.js)
- [MDN: OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [MDN: ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap)
- [MDN: Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [jsdelivr CDN](https://www.jsdelivr.net/)
