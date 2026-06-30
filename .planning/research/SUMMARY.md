# Project Research Summary

**Project:** Image Cropper
**Domain:** Browser-based bulk image cropping tool with AI subject detection
**Researched:** 2026-06-29
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a browser-based bulk image cropping tool for a 3-dev team, built client-side with Nuxt 3 + Vue 3 + Sass. The core workflow is: import multiple images, apply AI-assisted or manual crops, export as JPG/PNG/WebP in a ZIP. Experts recommend starting with Smartcrop.js (traditional CV-based detection, ~17KB, <20ms) rather than heavy ML models, reserving Transformers.js only if real users report accuracy issues. The architecture centers on Canvas API for manipulation, Web Workers for heavy operations (AI inference, encoding), and Pinia with shallowRef for reactive state that avoids copying large image blobs. Critical pitfalls center on memory management: Blob URL revocation, canvas pooling, ImageBitmap closure after worker transfer, and JSZip streaming for large batches. Phase structure should build foundation (import, basic crop) before AI detection, then batch processing, then export polish.

## Key Findings

### Recommended Stack

**Core technologies:**
- **Nuxt 3.x (3.10+)** — Meta-framework with file-based routing, server routes for future auth, Vite bundling, auto-imports. Stable and production-ready.
- **Vue 3.5.x** — Composition API with `<script setup>`, shallowRef for performance with large objects.
- **Sass** — Dart Sass via Vite/Nuxt natively. Standard CSS preprocessor.
- **Smartcrop.js 2.0.5** — AI-lite subject detection using traditional CV (edge detection, skin color, saturation). ~17KB, <20ms inference. Face detection boost via tracking.js optional. **Start here; upgrade to Transformers.js only if accuracy fails user testing.**
- **Pinia via @pinia/nuxt 0.11.3** — Official Vue 3 state. Use `shallowRef()` for ImageBitmap references to avoid deep reactivity overhead. Use `storeToRefs()` for reactive destructuring.
- **JSZip 3.10.1** — Browser-standard zip generation. Use `generateAsync({ type: "blob" })` for blobs, `streamFiles: true` for large batches.
- **Native Web Workers + OffscreenCanvas** — Move AI inference and image encoding off main thread. Pass `ImageBitmap` via transferable array. Requires COOP/COEP headers for SharedArrayBuffer support.

**Why not Fabric.js:** Fabric.js is a full canvas editor framework (100KB+). Native Canvas API with `ctx.drawImage()` and crop coordinates is sufficient for this use case.

**Why not Transformers.js for MVP:** Smartcrop.js is 17KB vs hundreds of MB for ML models. Speed is <20ms vs seconds. Only upgrade if real users report accuracy issues.

### Expected Features

**Must have (table stakes):**
- File picker + drag-and-drop import with visual drop zone feedback
- Bulk preview list with lazy-loaded thumbnails (show filename + dimensions)
- Draggable + resizable crop window with corner and edge handles
- Aspect ratio presets (16:9, 3:2, 1:1, 2:3) with constraint on drag
- Visual crop overlay (dimmed area outside crop, white border on crop region)
- Export as JPG/PNG/WebP with quality slider (1-100)
- ZIP download for batch exports
- Original filenames preserved with optional suffix
- Center-crop fallback (default when AI unavailable or disabled)
- Responsive canvas sizing (CSS Grid/Flexbox, canvas scales to container)

**Should have (competitive):**
- AI subject detection with one-click auto-crop — main differentiator
- Custom aspect ratio input (parse "W:H" string, validate > 0)
- Batch progress indicator with per-file status ("12/50 processed")
- Rule of thirds grid overlay (toggle-able)
- Crop position memory across images (apply last position to new imports)

**Defer (v2+):**
- Before/after comparison slider — memory concerns for large batches
- Multi-format single-click export — adds UI complexity
- Collaborative editing / project files — requires real-time sync infrastructure
- Cloud storage integration (Google Drive, Dropbox) — auth complexity, not v1 scope
- RAW format support — client-side decoding heavy, browser support poor
- Lossless WebP/AVIF — browser Canvas API quality setting is lossy-only for these formats

### Architecture Approach

The system uses a layered architecture: Presentation (Vue components) → Application (Pinia store) → Service (business logic) → Infrastructure (Canvas, Workers, File System). Canvas-based rendering with `shallowRef` for ImageBitmap references avoids Vue reactivity copying large blobs. Web Workers handle heavy operations (AI inference, encoding) using `OffscreenCanvas` and transferable `ImageBitmap` objects. Pinia manages global state (image registry, crop state, export queue) with `$patch` for efficient batch updates. Memory management is critical: always close `ImageBitmap` after transfer, revoke Blob URLs, pool canvas elements.

**Major components:**
1. **ImageStore (Pinia)** — Central state for all images, selected image, crop parameters. Uses `shallowRef` for image array to avoid deep reactivity.
2. **ImageProcessor (Service)** — Canvas-based crop application using `OffscreenCanvas` for heavy ops. Applies crop coordinates to source image.
3. **SubjectDetector (Service)** — AI model orchestration. Smartcrop.js for MVP; lazy-load on first use, cache in IndexedDB.
4. **EncoderService (Worker)** — Image encoding to JPEG/PNG/WebP. Runs in Web Worker with WASM codecs (jSquash for WebP/AVIF).
5. **ZipGenerator (Service/Worker)** — Collects encoded blobs, creates downloadable zip. Use streaming for large batches.

### Critical Pitfalls

1. **Blob URL Memory Leaks** — `URL.createObjectURL()` creates permanent references. Always track created URLs in a registry, call `URL.revokeObjectURL()` when done. Warning: memory grows indefinitely in long sessions.

2. **Canvas Element Accumulation** — Creating canvas in loops prevents GC. Pre-allocate a fixed pool of canvas elements, reuse across batch operations. With 20MP images, each canvas consumes 60-80MB.

3. **AI Main-Thread Blocking** — Running Transformers.js/ONNX on main thread freezes UI. Always use Web Workers, add COOP/COEP headers in nuxt.config.ts, use quantized models (INT4/INT8).

4. **Batch Processing UI Freezing** — Synchronous canvas operations block event loop. Use worker pool (`navigator.hardwareConcurrency`), chunked processing (4-6 images, yield, continue), batch UI updates at 150ms intervals.

5. **SSR Hydration Mismatches** — `window`, `document`, `localStorage` fail on server. Use `<ClientOnly>`, `import.meta.client` checks, `useCookie()` instead of localStorage. Test in production build, not dev.

6. **ImageBitmap Not Closed After Transfer** — `ImageBitmap` holds GPU memory. Always call `bitmap.close()` immediately after transferring to worker via postMessage.

7. **JSZip Memory Exhaustion** — `generateAsync()` with `type: 'blob'` holds entire zip in memory. Use `streamFiles: true` for large batches (>20 images), or offer individual downloads.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Foundation
**Rationale:** Infrastructure must be correct before adding features. SSR-safe patterns and worker configuration are hard to retrofit.
**Delivers:** Nuxt 3 project with Pinia, Sass, production build verification, Web Worker infrastructure with Nuxt auto-imports working, COOP/COEP headers configured.
**Addresses:** Pitfall 6 (SSR/hydration), Pitfall 10 (Worker auto-imports). Establishes memory management patterns (Blob URL registry, canvas pooling) from start.
**Research flag:** Worker auto-import fix in nuxt.config.ts needs verification in production build mode.

### Phase 2: Core Cropping
**Rationale:** Basic crop is the foundation of all workflows. Must work flawlessly before adding AI.
**Delivers:** File import (drag-drop + picker), thumbnail grid with lazy loading, draggable + resizable crop window, aspect ratio presets, visual crop overlay, quality slider, format selection.
**Addresses:** Pitfall 8 (Crop UX confusion — validate with real users early), Table stakes features.
**Research flag:** Crop UX needs user testing with 5 users before Phase 3.

### Phase 3: AI Subject Detection
**Rationale:** AI detection depends on crop infrastructure. Must be able to position crop window at detected focal point.
**Delivers:** Smartcrop.js integration, lazy model loading with progress, center-crop fallback, detection overlay toggle.
**Addresses:** Pitfall 3 (Main-thread blocking — must use workers), Pitfall 4 (Model download errors — robust error handling), Pitfall 11 (ImageBitmap closure).
**Uses:** Smartcrop.js from STACK.md, Web Worker architecture from ARCHITECTURE.md.

### Phase 4: Batch Processing
**Rationale:** After core crop and AI work, optimize for scale. Batch processing reveals memory issues that must be addressed before release.
**Delivers:** Worker pool for parallel encoding, canvas pooling, chunked processing with yield, per-file progress reporting, memory-stable processing of 50+ images.
**Addresses:** Pitfall 2 (Canvas accumulation), Pitfall 5 (Batch UI freeze), Pitfall 11 (ImageBitmap closure), Pitfall 12 (OffscreenCanvas fallback detection).
**Research flag:** OffscreenCanvas feature detection needed for Safari < 16.4 / Firefox < 79.

### Phase 5: Export Polish
**Rationale:** Final export experience determines user satisfaction. Memory issues surface here with large batches.
**Delivers:** ZIP download with streaming for large batches, filename sanitization, format guidance UI, estimated file size preview.
**Addresses:** Pitfall 7 (JSZip memory exhaustion), Pitfall 9 (Export format confusion).
**Uses:** JSZip with `streamFiles: true`, File System Access API fallback for very large exports.

### Phase Ordering Rationale

1. **Foundation before features** — SSR patterns and worker configuration are architectural foundations. Retrofitting is painful.
2. **Basic crop before AI** — AI detection outputs a focal point; crop UI must exist to display it. Validate basic crop UX before adding AI complexity.
3. **Batch processing before export polish** — Batch processing reveals memory issues (canvas pooling, ImageBitmap closure) that affect export stability.
4. **Memory management throughout** — Blob URL registry, canvas pooling, ImageBitmap closure patterns established in Phase 1, used throughout all phases.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Crop UX validation — needs user testing plan, 5 participants minimum
- **Phase 3:** Smartcrop.js accuracy — may need comparison testing vs user expectations
- **Phase 4:** Safari/Firefox OffscreenCanvas fallback — feature detection implementation

Phases with standard patterns (skip research-phase):
- **Phase 1:** Nuxt project setup, Pinia, Sass — well-documented, established patterns
- **Phase 5:** JSZip + streaming — standard library usage, documented limitations

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Nuxt 3, Vue 3, Sass, Pinia, Smartcrop.js, JSZip — all well-documented with official sources |
| Features | MEDIUM | Table stakes and differentiators well-researched from competitor analysis. Anti-features reasoning solid but may need user validation. |
| Architecture | MEDIUM | Patterns well-sourced (web-based graphic editor architecture, Vue ecosystem patterns). Some inference for component boundaries. |
| Pitfalls | MEDIUM-HIGH | Multiple sources confirm memory issues, SSR pitfalls, worker patterns. Recovery strategies well-documented. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Smartcrop.js accuracy** — No hands-on testing yet. Real user validation needed in Phase 3 before committing to it as primary detection method.
- **Crop UX details** — Specific interaction patterns (drag vs click-to-select, handle sizing) need prototyping and user testing.
- **Performance at scale** — 50+ image batch memory behavior not tested. May need adjustments to pool sizes or chunking strategy.
- **Safari-specific issues** — OffscreenCanvas support, WebP encoding quality differences need testing on target browsers.

## Sources

### Primary (HIGH confidence)
- [Nuxt 3 Documentation](https://nuxt.com/docs/3.x) — /websites/nuxt_3_x
- [Vue 3 Documentation](https://vuejs.org/) — /vuejs/vue
- [Pinia Documentation](https://pinia.vuejs.org/) — /websites/pinia_vuejs
- [Smartcrop.js GitHub](https://github.com/jwagner/smartcrop.js/) — /jwagner/smartcrop.js
- [JSZip Documentation](https://stuk.github.io/jszip/) — /stuk/jszip
- [H3 HTTP Framework](https://h3.unjs.io/) — /h3js/h3

### Secondary (MEDIUM confidence)
- [The Architecture of Web-Based Graphic Editors](https://dev.to/feconf/the-architecture-of-web-based-graphic-editors-and-7-design-patterns-part-2-4kfb) — Architectural patterns
- [jSquash - WASM image codecs](https://github.com/jamsinclair/jSquash) — Web Worker codec integration
- [Optimizing Transformers.js for Production Web Apps](https://www.sitepoint.com/optimizing-transformers-js-production/) — AI inference patterns
- [JSZip Large File Issues](https://github.com/Stuk/jszip/issues/580) — Memory management for large batches
- [Nuxt Hydration Guide](https://nuxt.com/docs/3.x/guide/best-practices/hydration) — SSR patterns

### Tertiary (LOW confidence)
- [Browser Batch Image Converter with OPFS](https://dev.to/sapianyi/how-i-built-a-blazingly-fast-privacyfirst-batch-image-converter-in-the-browser-using-opfs-and-web-1f8p) — Experimental patterns, needs validation
- [Parallel Browser Image Converter](https://dev.to/enekomtz1/how-i-built-a-browser-image-converter-that-processes-files-in-parallel-1400) — Worker pool implementation details

---
*Research completed: 2026-06-29*
*Ready for roadmap: yes*
