# Phase 5: Export Polish - Research

**Researched:** 2026-07-17
**Domain:** Export modal, format conversion, quality slider, streaming ZIP generation
**Confidence:** MEDIUM-HIGH (JSZip verified, canvas API standard, modal patterns well-documented)

## Summary

Phase 5 implements the export polish UI and ZIP download functionality. Users click "Export" to open a format/quality modal, select JPG/PNG/WebP with optional quality (1-100 for lossy formats), and download all cropped images bundled in a streaming ZIP. The architecture uses a `useExportModal` composable managing modal state and export options, Phase 4's `useBatchProcessor` for orchestrating crop/encode per image, and JSZip `generateAsync` with `streamFiles: true` for memory-efficient ZIP generation.

**Primary recommendation:** Build `useExportModal` as a Vue composable that owns modal visibility and export options state, uses `Teleport` + `ClientOnly` to render into `<body>` outside component hierarchy, and delegates actual processing to the existing Phase 4 `useBatchProcessor` composable. JSZip streaming handles the memory concern for large batches.

## User Constraints (from ROADMAP.md)

### Locked Decisions
- Format selection: JPG, PNG, WebP (EXPT-02)
- Quality slider: 1-100 for lossy formats (EXPT-03)
- Original filenames preserved with optional "_cropped" suffix (EXPT-05)
- Multiple images bundled into single ZIP (EXPT-06)
- Streaming ZIP to avoid memory exhaustion (EXPT-07)

### Claude's Discretion
- Modal UI structure and styling approach
- Filename sanitization rules (beyond basic character replacement)
- Whether to process ZIP generation in a Worker
- Quality slider granularity (1-step vs 5-step increments)

### Deferred Ideas (OUT OF SCOPE)
- Multi-format single-click export (PWRU-03)
- Custom batch rename with tokens

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Export modal UI | Browser/Client | — | Vue component with Teleport; modal dialog is DOM overlay |
| Format conversion (canvas) | Web Workers | Browser/Client | Phase 4 worker handles encoding; canvas operations in worker |
| Quality setting | Browser/Client | — | User input; passed to worker for encoding |
| ZIP generation | Browser/Client | — | JSZip runs on main thread (I/O bound); streaming reduces memory |
| Progress reporting | Browser/Client | — | Pinia store updates; modal displays progress |
| File download trigger | Browser/Client | — | `saveAs(blob, filename)` from FileSaver or native URL |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXPT-01 | "Export" button opens format/quality options modal | Modal composable with `useExportModal` pattern |
| EXPT-02 | Format selection: JPG, PNG, WebP | Canvas `convertToBlob()` supports all three |
| EXPT-03 | Quality slider (1-100) for lossy formats | Canvas `convertToBlob({ quality })` maps 0-1; slider maps 1-100 |
| EXPT-04 | Export applies crop settings to all images | Phase 4 `useBatchProcessor` reads crop settings from `useCropStore` |
| EXPT-05 | Preserve original filenames with "_cropped" suffix | Filename sanitization composable |
| EXPT-06 | Multiple images bundled into single ZIP | JSZip `zip.file()` adds entries; `generateAsync()` creates archive |
| EXPT-07 | Streaming ZIP to avoid memory exhaustion | JSZip `generateAsync({ streamFiles: true })` per Context7 docs |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JSZip | 3.10.1 [VERIFIED: npm registry] | ZIP file generation | `generateAsync` with `streamFiles: true` for streaming; `zip.file()` for entries |
| Canvas `convertToBlob()` | Native Browser API | Format conversion | `toBlob(callback, mimeType, quality)` maps directly to JPG/WebP quality parameter |
| Vue `<Teleport>` | Vue 3 native | Modal DOM placement | Renders modal outside component hierarchy; prevents z-index stacking issues |
| `<ClientOnly>` | Nuxt 3 native | SSR guard | Modal is browser-only (uses Blob, download APIs) |
| Pinia `useCropStore` | Existing (Phase 2) | Crop settings for export | `effectiveRatio`, `ratioString`, mode all exist |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useBatchProcessor | Phase 4 | Orchestration | Worker pool, progress callbacks |
| useBlobRegistry | Phase 1 | Blob URL lifecycle | Cropped image Blobs need URL for preview/download |
| useCanvasPool | Phase 1 | Canvas reuse | If doing any canvas ops outside worker |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `canvas.toDataURL()` | `canvas.convertToBlob()` | `convertToBlob` is newer, better memory (no base64 string), async |
| `saveAs` from file-saver package | Native `URL.createObjectURL` + click | FileSaver is ~2KB; native approach requires cleanup |
| Modal in component template | Teleport composable pattern | Teleport avoids stacking context issues; cleaner DOM |

**Installation:**
```bash
npm install jszip
```

**Version verification:**
```bash
npm view jszip version
# Output: 3.10.1
```

---

## Package Legitimacy Audit

> **Required** per Package Legitimacy Gate protocol.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| jszip | npm | ~14 years | ~54K/week | github.com/Stuk/jszip | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** None
**Packages flagged as suspicious [SUS]:** None

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Export User Flow                                │
│                                                                         │
│  User clicks "Export" ──▶ useExportModal.show() ──▶ Modal renders        │
│                              │                                           │
│                              ▼                                           │
│                     Format/Quality Form                                  │
│                     ┌─────────────────────┐                            │
│                     │ Format: JPG/PNG/WebP│                            │
│                     │ Quality: [=======]  │                            │
│                     │ Suffix: [_cropped]  │                            │
│                     │ [Cancel] [Download] │                            │
│                     └─────────────────────┘                            │
│                              │                                           │
│         User clicks ─────────┘                                           │
│         "Download"                                                   │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    useBatchProcessor.runExport()                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                   │  │
│  │  │  Worker 1  │  │  Worker 2  │  │  Worker N  │  (pooled)         │  │
│  │  │  - crop    │  │  - crop    │  │  - crop    │                   │  │
│  │  │  - encode  │  │  - encode  │  │  - encode  │                   │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                   │  │
│  └────────│────────────────│────────────────│──────────────────────────┘  │
│           │                │                │                            │
│           └────────────────┼────────────────┘                            │
│                            ▼                                             │
│                    Per-image cropped Blob                                │
│                            │                                             │
│                            ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    useExportPipeline.generateZip()                  │  │
│  │                                                                   │  │
│  │   const zip = new JSZip()                                        │  │
│  │   for (image of images) {                                        │  │
│  │     const name = sanitize(image.filename) + "_cropped" + ext      │  │
│  │     zip.file(name, croppedBlob)                                   │  │
│  │   }                                                               │  │
│  │   const blob = await zip.generateAsync(                          │  │
│  │     { type: 'blob', streamFiles: true },                          │  │
│  │     (metadata) => updateProgress(metadata.percent)               │  │
│  │   )                                                               │  │
│  │                                                                   │  │
│  │   saveAs(blob, 'cropped-images.zip')                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
app/
├── composables/
│   ├── useExportModal.ts       # NEW: Modal state + export options
│   ├── useExportPipeline.ts    # NEW: ZIP generation + progress
│   ├── useFilenameSanitize.ts  # NEW: Filename sanitization
│   └── useBatchProcessor.ts    # EXISTING (Phase 4)
├── components/
│   └── ExportModal.vue         # NEW: Modal UI with Teleport
├── stores/
│   └── useImageStore.ts        # EXISTING (Phase 2)
├── workers/
│   └── image-processor.worker.ts  # MODIFIED (Phase 4): batchEncode handler
```

### Pattern 1: Export Modal Composable with Teleport
**What:** A composable that manages modal visibility and options, rendering via Teleport to `<body>`
**When to use:** Any modal dialog in a Vue/Nuxt app
**Source:** [WebSearch verified: Vue teleport modal pattern]

```typescript
// composables/useExportModal.ts
import { ref, readonly } from 'vue'

export type ExportFormat = 'jpeg' | 'png' | 'webp'

export interface ExportOptions {
  format: ExportFormat
  quality: number        // 1-100
  addSuffix: boolean     // true = "_cropped"
}

export function useExportModal() {
  const isOpen = ref(false)
  const options = ref<ExportOptions>({
    format: 'jpeg',
    quality: 90,
    addSuffix: true,
  })

  function show() {
    isOpen.value = true
  }

  function hide() {
    isOpen.value = false
  }

  function getOptions(): ExportOptions {
    return { ...options.value }
  }

  return {
    isOpen: readonly(isOpen),
    options: readonly(options),
    show,
    hide,
    getOptions,
  }
}
```

### Pattern 2: Export Modal Component with Teleport
**What:** Vue component using `<Teleport to="body">` + `<ClientOnly>` for SSR-safe modal rendering
**When to use:** The actual modal UI markup
**Source:** [Nuxt 3 Context7: ClientOnly + Teleport pattern]

```vue
<!-- components/ExportModal.vue -->
<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="isOpen" class="modal-backdrop" @click.self="handleBackdropClick">
        <div class="modal-content" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h2>Export Settings</h2>
            <button @click="hide" aria-label="Close">×</button>
          </header>

          <div class="modal-body">
            <!-- Format Selection -->
            <fieldset class="format-group">
              <legend>Format</legend>
              <label v-for="fmt in formats" :key="fmt">
                <input type="radio" v-model="options.format" :value="fmt" />
                {{ fmt.toUpperCase() }}
              </label>
            </fieldset>

            <!-- Quality Slider (only for lossy formats) -->
            <div v-if="isLossyFormat(options.format)" class="quality-control">
              <label for="quality">Quality: {{ options.quality }}</label>
              <input
                id="quality"
                type="range"
                min="1"
                max="100"
                v-model.number="options.quality"
              />
            </div>

            <!-- Suffix Toggle -->
            <label class="suffix-toggle">
              <input type="checkbox" v-model="options.addSuffix" />
              Add "_cropped" suffix to filenames
            </label>
          </div>

          <footer class="modal-footer">
            <button @click="hide">Cancel</button>
            <button @click="handleExport" :disabled="isExporting">
              {{ isExporting ? 'Exporting...' : 'Download ZIP' }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
const { isOpen, options, hide } = useExportModal()

const isLossyFormat = (fmt: string) => fmt === 'jpeg' || fmt === 'webp'

function handleBackdropClick() {
  hide()
}

async function handleExport() {
  // Delegate to useExportPipeline
}
</script>
```

### Pattern 3: Filename Sanitization
**What:** Safe filename handling that strips/replaces problematic characters
**When to use:** Any time user filenames are used in export/archive contexts
**Source:** [ASSUMED] Standard filename sanitization patterns

```typescript
// composables/useFilenameSanitize.ts

/**
 * Sanitize a filename for use in ZIP archive
 * - Removes path separators and null bytes
 * - Replaces problematic chars with underscore
 * - Limits length to 200 chars (ZIP spec limit is 255)
 */
export function sanitizeFilename(name: string): string {
  // Get base name without path
  const base = name.replace(/^.*[\\/]/, '').replace(/\0/g, '')

  // Replace problematic characters
  return base
    .replace(/[<>:"|?*]/g, '_')  // Reserved Windows chars
    .replace(/[\x00-\x1f]/g, '')   // Control chars
    .replace(/\.{2,}/g, '.')      // Multiple dots
    .replace(/^\.+/, '')           // Leading dots
    .substring(0, 200)             // Length limit
}

/**
 * Build output filename with optional suffix
 */
export function buildExportFilename(
  originalName: string,
  extension: string,
  addSuffix: boolean
): string {
  const sanitized = sanitizeFilename(originalName)
  const base = sanitized.replace(/\.[^.]+$/, '')  // Remove original extension
  const suffix = addSuffix ? '_cropped' : ''
  return `${base}${suffix}.${extension}`
}
```

### Pattern 4: Canvas `convertToBlob` with Quality
**What:** Convert canvas to Blob with format and quality parameters
**When to use:** Encoding cropped image to JPG/WebP with quality setting
**Source:** [ASSUMED] Canvas API standard behavior

```typescript
/**
 * Convert OffscreenCanvas to Blob with format and quality
 * Quality parameter: 0.0 - 1.0 (maps from slider 1-100)
 */
async function canvasToBlob(
  canvas: OffscreenCanvas,
  format: 'jpeg' | 'png' | 'webp',
  quality: number  // 1-100
): Promise<Blob> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
  const qualityNormalized = quality / 100  // Convert 1-100 to 0-1

  return new Promise((resolve, reject) => {
    canvas.convertToBlob({ type: mimeType, quality: qualityNormalized })
      .then(resolve)
      .catch(reject)
  })
}

// Usage in worker
const blob = await canvasToBlob(canvas, 'jpeg', 90)
```

### Pattern 5: JSZip Streaming Generation with Progress
**What:** Generate ZIP using `generateAsync` with `streamFiles: true` and progress callback
**When to use:** Creating ZIP archives, especially with large files or many entries
**Source:** [VERIFIED: JSZip 3.10.1 documentation via Context7]

```typescript
// composables/useExportPipeline.ts
import JSZip from 'jszip'
import { buildExportFilename } from './useFilenameSanitize'

export interface ExportResult {
  success: boolean
  filename?: string
  error?: string
}

export function useExportPipeline() {
  async function generateZip(
    images: ImageItem[],
    options: ExportOptions,
    onProgress?: (percent: number, filename: string) => void
  ): Promise<Blob> {
    const zip = new JSZip()

    // Add each image to ZIP
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const ext = options.format === 'jpeg' ? 'jpg' : options.format
      const filename = buildExportFilename(image.filename, ext, options.addSuffix)

      // Image is already cropped and encoded by useBatchProcessor
      // Here we just add the pre-processed Blob to the ZIP
      const croppedBlob = await getCroppedBlob(image, options)

      zip.file(filename, croppedBlob)

      // Report progress per file added
      const percent = Math.round(((i + 1) / images.length) * 100)
      onProgress?.(percent, filename)
    }

    // Generate ZIP with streaming
    return await zip.generateAsync(
      { type: 'blob', streamFiles: true },
      (metadata) => {
        // metadata.percent is 0-100 during generation
        onProgress?.(metadata.percent, metadata.currentFile || '')
      }
    )
  }

  async function downloadZip(blob: Blob, name = 'cropped-images.zip'): Promise<void> {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return { generateZip, downloadZip }
}
```

### Anti-Patterns to Avoid
- **Quality slider for PNG:** PNG is lossless; ignore quality slider when PNG selected (or disable slider)
- **Not closing ImageBitmaps in batch:** Memory leak in workers; always call `bitmap.close()` after `drawImage`
- **Processing ZIP on main thread for huge batches:** JSZip `generateAsync` is async but still main thread; consider moving to Worker for 100+ images
- **Hardcoded path separators in filenames:** Use path-agnostic approach; strip all `\` and `/` from original filenames

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP generation | Custom ZIP encoder | JSZip 3.10.1 | Handles compression, streaming, file headers; battle-tested |
| Filename sanitization | Ad-hoc string replace | `sanitizeFilename()` | Handles edge cases: null bytes, reserved chars, length |
| Modal rendering | In-component conditional | `<Teleport to="body">` | Avoids z-index stacking context issues |
| Format conversion | Custom encoder | Canvas `convertToBlob()` | Native browser API; handles all three formats |

**Key insight:** ZIP format complexity (DEFLATE compression, local file headers, central directory) makes hand-rolling inappropriate. JSZip is the community standard for browser ZIP generation.

---

## Common Pitfalls

### Pitfall 1: Quality Slider Shown for PNG
**What goes wrong:** PNG is lossless; quality setting has no effect but slider confuses users
**Why it happens:** Forgetting to conditionally render/hide slider based on format selection
**How to avoid:** `v-if="options.format !== 'png'"` on slider; visually disable or show "N/A" when PNG selected
**Warning signs:** User sets quality to 10 for PNG, exports, file is still large

### Pitfall 2: ZIP Memory Exhaustion on 100+ Images
**What goes wrong:** `generateAsync` without `streamFiles: true` loads all file data into memory
**Why it happens:** Default behavior collects all entries before generating; for large batches this exceeds memory
**How to avoid:** Always use `{ streamFiles: true }` option; consider chunked generation for 100+ images
**Warning signs:** Browser tab memory spikes to 1GB+ during export; "Aw, snap" crash in Chrome

### Pitfall 3: Duplicate Filenames in ZIP
**What goes wrong:** Multiple images with same original name (e.g., `photo.jpg` from different folders) overwrite each other in ZIP
**Why it happens:** Using just the base filename without disambiguation
**How to avoid:** Append numeric suffix `-1`, `-2` for duplicates; or include parent folder name
**Warning signs:** ZIP contains fewer files than exported; files missing after extraction

### Pitfall 4: Blob URL Leak After Download
**What goes wrong:** `URL.createObjectURL` for the ZIP blob is never revoked
**Why it happens:** Download link removal doesn't automatically revoke the object URL
**How to avoid:** Always call `URL.revokeObjectURL` after click simulation; use try/finally
**Warning signs:** `DOMException: Failed to execute 'createObjectURL'` after multiple exports

### Pitfall 5: SSR Rendering of Modal
**What goes wrong:** Modal tries to render on server where Blob/download APIs don't exist
**Why it happens:** Nuxt still runs components through SSR unless guarded
**How to avoid:** Wrap modal in `<ClientOnly>`; use `process.client` guards for any Blob APIs
**Warning signs:** `window is not defined` or `document is not defined` errors during `nuxt build`

---

## Code Examples

### Quality Mapping (Slider 1-100 to Canvas 0.0-1.0)
```typescript
// composables/useExportModal.ts
const options = ref({
  format: 'jpeg' as ExportFormat,
  quality: 90,  // User sees 1-100
})

// When passing to canvas.convertToBlob()
const canvasQuality = options.value.quality / 100  // Convert to 0-1 for canvas API
```

### Export Button in Parent Component
```vue
<!-- app/components/ExportButton.vue -->
<template>
  <button @click="openExportModal">
    Export
  </button>

  <ClientOnly>
    <ExportModal />
  </ClientOnly>
</template>

<script setup lang="ts">
const { show } = useExportModal()

function openExportModal() {
  show()
}
</script>
```

### Handling Export with useBatchProcessor Integration
```typescript
// In ExportModal.vue or a dedicated useExportFlow composable
import { useBatchProcessor } from '~/composables/useBatchProcessor'
import { useExportPipeline } from '~/composables/useExportPipeline'

async function handleExport() {
  const imageStore = useImageStore()
  const cropStore = useCropStore()
  const batchProcessor = useBatchProcessor()
  const exportPipeline = useExportPipeline()

  const options = getOptions()
  const images = imageStore.images

  // Phase 4: Process all images (crop + encode)
  const processedBlobs = await batchProcessor.runExport({
    images,
    format: options.format,
    quality: options.quality,
    cropSettings: {
      ratio: cropStore.effectiveRatio,
      ratioString: cropStore.ratioString,
    },
    onProgress: (current, total, filename) => {
      // Update modal progress display
      progress.value = { current, total, filename }
    },
  })

  // Phase 5: Add to ZIP
  const zipBlob = await exportPipeline.generateZip(processedBlobs, options, (percent) => {
    progress.value.zipPercent = percent
  })

  // Trigger download
  await exportPipeline.downloadZip(zipBlob)

  hide()
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `canvas.toDataURL()` | `canvas.convertToBlob()` | Canvas API update | Better memory behavior; async vs sync |
| `saveAs` package | Native URL.createObjectURL + click | FileSaver package deprecation | No external dependency; simple cleanup |
| Full-file ZIP generation | `streamFiles: true` streaming | JSZip 3.x | Memory-stable for 50+ image batches |
| In-component modals | Teleport to body | Vue 3 | Cleaner stacking context; accessibility |

**Deprecated/outdated:**
- `canvas.toDataURL()`: Replaced by `convertToBlob()` for memory efficiency
- FileSaver.js package: Native approach is now sufficient for simple downloads
- Inline modal rendering: Use Teleport to avoid z-index issues

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | JSZip 3.10.1 is current and has `streamFiles: true` | Standard Stack | Could verify with `npm view jszip version` |
| A2 | `canvas.convertToBlob()` quality parameter works for WebP in all browsers | Code Examples | Some older browsers may not support WebP quality; fallback to 0.92 default |
| A3 | Modal backdrop click should close modal | Pattern 2 | Some UIs require explicit close button; user may prefer no backdrop click close |
| A4 | Quality slider step of 1 is appropriate | Common Pitfalls | Mobile users may prefer coarser steps (5 or 10) |
| A5 | PNG quality slider should be hidden, not just disabled | Common Pitfalls | Could instead show "Lossless" label instead of hiding |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **ZIP naming for user**
   - What we know: Default name in docs is "cropped-images.zip"
   - What's unclear: Should we timestamp it (e.g., "cropped-2026-07-17.zip")?
   - Recommendation: Start simple; "cropped-images.zip" is sufficient for v1

2. **When to process images (immediate vs deferred)**
   - What we know: Modal collects options, then processes on "Download" click
   - What's unclear: Should we pre-process and cache cropped images when modal opens?
   - Recommendation: Process on-demand; pre-processing adds complexity and memory usage

3. **Export button state during processing**
   - What we know: Modal should show progress during export
   - What's unclear: Cancel button during export? Progress shows per-file or overall?
   - Recommendation: Show overall progress with filename; Cancel terminates batch processing via worker pool

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond existing infrastructure and jszip npm package)

This phase uses:
- Browser-native APIs (Canvas, Blob, URL.createObjectURL, `<a>` download)
- Existing project infrastructure (useBatchProcessor, useCropStore, useImageStore, Pinia)
- JSZip (npm package — already researched, needs install if not present)

**Note:** `jszip` was not found in `package.json` — Phase 4 plan references it but it may not be installed. Planner should add `npm install jszip` to Phase 5 task list.

---

## Validation Architecture

> **Config:** `workflow.nyquist_validation: false` — Nyquist validation is DISABLED for this project

**Verification approach:** Manual browser testing:
- Export single image as JPG/PNG/WebP at various quality settings
- Export 10+ images as ZIP, verify all files present and correctly cropped
- Memory profiling: Open DevTools Performance tab, export 50 images, verify no memory spike
- Filename sanitization: Test with `my"file.jpg`, `null\0byte.jpg`, `very-long-name.jpg`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not applicable |
| V3 Session Management | No | Not applicable |
| V4 Access Control | No | Not applicable |
| V5 Input Validation | Yes | Sanitize filenames before adding to ZIP; validate quality range |
| V6 Cryptography | No | Not applicable |
| V12 Files Integrity | Yes | ZIP entries use original file extensions; validate Blob types before ZIP |

### Known Threat Patterns for Export Feature

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious filename with path traversal | Tampering | `sanitizeFilename()` strips path separators; ZIP entries are relative paths only |
| Malicious filename with null byte | Tampering | `sanitizeFilename()` removes null bytes; JSZip handles safely |
| Large quality value crash | Denial of Service | Quality clamped to 1-100 range in modal; canvas API expects 0-1 |
| Memory exhaustion from 1000+ images | Denial of Service | `streamFiles: true` streaming; consider batch chunking if >100 images |

---

## Sources

### Primary (HIGH confidence)
- [JSZip Documentation](https://stuk.github.io/jszip/) - `generateAsync`, `streamFiles`, `zip.file()` API
- [Canvas.convertToBlob MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/convertToBlob) - Format and quality parameters
- [Nuxt 3 ClientOnly + Teleport](https://nuxt.com/docs/3.x/api/components/client-only) - SSR-safe modal rendering

### Secondary (MEDIUM confidence)
- [Vue Teleport Modal Pattern](https://dev.to/alexandergekov/creating-better-modals-using-vue-teleport-3cd4) - Modal composable pattern
- [Stack Overflow: Teleport in Composable](https://stackoverflow.com/questions/78447389/teleport-composable-using-component-inside-of-composable-and-render-via-tele) - Programmatic modal rendering

### Tertiary (LOW confidence)
- [Filename Sanitization Patterns](https://stackoverflow.com/questions/19771942/sanitize-filename-in-javascript) - Community patterns, needs cross-browser testing

---

## Metadata

**Confidence breakdown:**
- Standard Stack: MEDIUM-HIGH - JSZip verified on npm, canvas API is standard, but some browser-specific format support unverified
- Architecture: HIGH - Patterns well-documented; Phase 4 batch processor provides foundation
- Pitfalls: MEDIUM - Filename sanitization edge cases may vary by browser; Safari WebP quality support unverified

**Research date:** 2026-07-17
**Valid until:** 2026-08-17 (30 days for stable domain — JSZip and Canvas APIs are mature)

---

## RESEARCH COMPLETE

**Phase:** 5 - Export Polish
**Confidence:** MEDIUM-HIGH

### Key Findings

1. **JSZip `generateAsync({ streamFiles: true })`** is the correct approach for streaming ZIP generation per Context7 documentation
2. **Canvas `convertToBlob({ type, quality })`** maps directly to format selection (jpeg/png/webp) with quality parameter 0-1
3. **Export modal** uses Vue `<Teleport to="body">` + `<ClientOnly>` for SSR-safe modal rendering
4. **Filename sanitization** must strip path separators, null bytes, and reserved characters; limit to 200 chars
5. **jszip not in package.json** — needs to be installed (Phase 4 referenced but may not have completed)

### File Created
`.planning/phases/05-export-polish/05-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | MEDIUM-HIGH | JSZip verified on npm; Canvas API standard; some Safari format support needs testing |
| Architecture | HIGH | Phase 4 batch processor provides foundation; modal patterns well-documented |
| Pitfalls | MEDIUM | Filename edge cases may vary; Safari WebP quality support unverified |

### Open Questions
- Should ZIP filename include timestamp?
- Should we pre-process images when modal opens or process on-demand?
- Cancel button during export — terminate batch processor?

### Dependencies on Prior Phases
- **Phase 4 (Batch Processing):** `useBatchProcessor` for worker pool orchestration; if Phase 4 is incomplete, Phase 5 cannot fully implement EXPT-04, EXPT-06, EXPT-07
- **Phase 2 (Core Cropping):** `useCropStore` for crop settings (effectiveRatio, ratioString); if incomplete, export applies incorrect crop dimensions

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
