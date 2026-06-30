# Roadmap: Image Cropper

**Project:** Image Cropper
**Granularity:** Coarse (3-5 phases)
**Created:** 2026-06-29

## Phases

- [ ] **Phase 1: Foundation** — Project setup, SSR-safe patterns, worker infrastructure, memory management
- [ ] **Phase 2: Core Cropping** — Import, preview, crop window, ratio presets, dark mode
- [ ] **Phase 3: AI Detection** — Smartcrop.js integration, lazy loading, center-crop fallback
- [ ] **Phase 4: Batch Processing** — Worker pool, canvas pooling, chunked processing with progress
- [ ] **Phase 5: Export Polish** — Streaming ZIP, format/quality modal, filename sanitization

---

## Phase Details

### Phase 1: Foundation
**Goal:** Project infrastructure is stable and production-ready with proper memory management patterns

**Depends on:** Nothing (first phase)

**Requirements:** None directly (infrastructure setup)

**Success Criteria** (what must be TRUE):
1. Nuxt 3 project builds successfully with Pinia, Sass, and production mode verified
2. COOP/COEP headers configured in nuxt.config.ts for SharedArrayBuffer support
3. Web Worker communication pattern established (postMessage + transferable ImageBitmap)
4. Memory management patterns implemented (Blob URL registry, canvas pooling)
5. SSR-safe patterns working (no window/document errors on server render)

**Plans:** 2 plans
- [ ] 01-foundation/01-foundation/01-01-PLAN.md — Initialize Nuxt 3 project with modules and COOP/COEP headers
- [ ] 01-foundation/01-foundation/01-02-PLAN.md — Memory management composables and worker foundation

---

### Phase 2: Core Cropping
**Goal:** Users can import images and perform manual crop operations with ratio constraints

**Depends on:** Phase 1

**Requirements:** IMPT-01, IMPT-02, IMPT-03, IMPT-04, PRVW-01, PRVW-02, PRVW-03, CROP-01, CROP-02, CROP-03, CROP-04, CROP-05, CROP-06, RATIO-01, RATIO-02, RATIO-03, RATIO-04, RATIO-05, UIUX-01, UIUX-02

**Success Criteria** (what must be TRUE):
1. User can import images via file picker (click-to-browse) and see them appear in preview list
2. User can drag-and-drop images onto drop zone with visible highlight feedback
3. Preview list shows lazy-loaded thumbnails with filename and original dimensions
4. User can click any image in preview list to select it for cropping
5. Crop window is draggable, has visible corner/edge handles, and constrains to selected aspect ratio
6. Area outside crop window is dimmed with semi-transparent overlay; crop window has white border
7. User can select ratio presets (16:9, 3:2, 1:1, 2:3) or enter custom W:H ratio and custom pixel dimensions
8. Canvas and crop window scale responsively to browser window; dark mode respects system preference

**Plans:** TBD

**UI hint:** yes

---

### Phase 3: AI Detection
**Goal:** Users can automatically detect subjects and position crop window using Smartcrop.js

**Depends on:** Phase 2

**Requirements:** AIDT-01, AIDT-02, AIDT-03, AIDT-04, AIDT-05

**Success Criteria** (what must be TRUE):
1. "Auto crop" button triggers AI subject detection on selected image
2. Smartcrop.js is lazy-loaded from CDN on first use (not bundled)
3. Detected focal point automatically positions the crop window
4. If AI detection fails or is unavailable, center-crop is used as fallback
5. AI processing runs in Web Worker (off main thread) with no UI freeze

**Plans:** TBD

---

### Phase 4: Batch Processing
**Goal:** System can process 50+ images without freezing UI, with per-file progress reporting

**Depends on:** Phase 3

**Requirements:** Infrastructure support for EXPT-04, EXPT-06

**Success Criteria** (what must be TRUE):
1. Batch of 50+ images processes without freezing the browser UI
2. Per-file progress is reported during batch export (e.g., "12/50 processed")
3. Worker pool uses navigator.hardwareConcurrency for parallel encoding
4. Canvas elements are pooled and reused across batch operations (no accumulation)
5. ImageBitmap objects are properly closed after transfer to workers (memory stable)

**Plans:** TBD

---

### Phase 5: Export Polish
**Goal:** Users can export cropped images with format/quality options, bundled in streaming ZIP

**Depends on:** Phase 4

**Requirements:** EXPT-01, EXPT-02, EXPT-03, EXPT-04, EXPT-05, EXPT-06, EXPT-07

**Success Criteria** (what must be TRUE):
1. "Export" button opens format/quality options modal before downloading
2. Modal offers format selection: JPG, PNG, WebP with quality slider (1-100) for lossy formats
3. Export applies current crop settings to all images in the list
4. Original filenames are preserved with optional "_cropped" suffix
5. Multiple images are bundled into single ZIP download
6. ZIP generation uses streaming to avoid memory exhaustion on large batches

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Core Cropping | 0/8 | Not started | - |
| 3. AI Detection | 0/5 | Not started | - |
| 4. Batch Processing | 0/5 | Not started | - |
| 5. Export Polish | 0/6 | Not started | - |

---

## Coverage

All 29 v1 requirements mapped to phases:

| Requirement | Phase | Requirement | Phase |
|-------------|-------|-------------|-------|
| IMPT-01 | Phase 2 | RATIO-02 | Phase 2 |
| IMPT-02 | Phase 2 | RATIO-03 | Phase 2 |
| IMPT-03 | Phase 2 | RATIO-04 | Phase 2 |
| IMPT-04 | Phase 2 | RATIO-05 | Phase 2 |
| PRVW-01 | Phase 2 | AIDT-01 | Phase 3 |
| PRVW-02 | Phase 2 | AIDT-02 | Phase 3 |
| PRVW-03 | Phase 2 | AIDT-03 | Phase 3 |
| CROP-01 | Phase 2 | AIDT-04 | Phase 3 |
| CROP-02 | Phase 2 | AIDT-05 | Phase 3 |
| CROP-03 | Phase 2 | EXPT-01 | Phase 5 |
| CROP-04 | Phase 2 | EXPT-02 | Phase 5 |
| CROP-05 | Phase 2 | EXPT-03 | Phase 5 |
| CROP-06 | Phase 2 | EXPT-04 | Phase 5 |
| RATIO-01 | Phase 2 | EXPT-05 | Phase 5 |
| UIUX-01 | Phase 2 | EXPT-06 | Phase 5 |
| UIUX-02 | Phase 2 | EXPT-07 | Phase 5 |

**Coverage:** 29/29 requirements mapped ✓

---

*Roadmap created: 2026-06-29*
