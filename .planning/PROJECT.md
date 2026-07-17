# Image Cropper

## What This Is

A browser-based bulk image cropping tool for small teams. Drop in a batch of images, pick an aspect ratio or custom dimensions, preview crops with a draggable positioning window, use AI-assisted subject detection (with center-crop fallback), and export as JPG/PNG/WebP zipped to your machine. No auth required for v1, but infrastructure supports adding it later.

## Core Value

Small teams can batch-crop dozens of images to consistent dimensions in minutes, not hours — with smart defaults that eliminate repetitive manual work.

---

## Current State

**v1.0 MVP — SHIPPED 2026-07-17**

All 29 v1 requirements implemented and verified. Full milestone complete with drag-drop import, crop overlay, ratio presets, AI subject detection, batch processing, and ZIP export.

### What's Working

- Drag-and-drop image import with thumbnails
- Draggable crop window with ratio constraints (16:9, 3:2, 1:1, 2:3, custom)
- AI subject detection via Smartcrop.js (CDN lazy-loaded)
- Batch processing with progress reporting
- Export modal with format/quality selection
- Streaming ZIP generation
- Dark mode support

### Tech Stack

- **Framework:** Nuxt 3 (Vue 3) + Sass + Pinia
- **AI:** Smartcrop.js (lazy-loaded from CDN)
- **Export:** JSZip with streaming
- **Workers:** Web Workers for off-thread processing

---

## Next Milestone Goals

- [ ] User accounts / authentication infrastructure
- [ ] Cloud storage integration (Google Drive, Dropbox export)
- [ ] Undo/redo for crop adjustment history
- [ ] Batch progress indicator with per-file status and ETA

---

## Requirements

### Validated

- ✓ Import images via file picker — v1.0
- ✓ Import images via drag-and-drop — v1.0
- ✓ Drag-over visual feedback — v1.0
- ✓ Lazy-loaded thumbnails — v1.0
- ✓ Scrollable bulk preview list — v1.0
- ✓ Thumbnail shows filename + dimensions — v1.0
- ✓ Click to select for cropping — v1.0
- ✓ Draggable crop window overlay — v1.0
- ✓ Corner/edge handles for resizing — v1.0
- ✓ Ratio constraint during resize — v1.0
- ✓ Dimmed overlay outside crop window — v1.0
- ✓ White border on crop window — v1.0
- ✓ Crop position clamped to bounds — v1.0
- ✓ Ratio presets: 16:9, 3:2, 1:1, 2:3 — v1.0
- ✓ Preset immediately constrains crop — v1.0
- ✓ Custom W:H ratio input — v1.0
- ✓ Custom pixel dimensions — v1.0
- ✓ Ratio/pixel mode toggle — v1.0
- ✓ Auto crop button — v1.0
- ✓ Smartcrop.js CDN lazy-load — v1.0
- ✓ Focal point auto-positions crop — v1.0
- ✓ Center-crop fallback — v1.0
- ✓ AI in Web Worker — v1.0
- ✓ Export modal with options — v1.0
- ✓ Format selection (JPG/PNG/WebP) — v1.0
- ✓ Quality slider — v1.0
- ✓ Apply crop to all images — v1.0
- ✓ Original filename preservation — v1.0
- ✓ ZIP bundle download — v1.0
- ✓ Streaming ZIP — v1.0
- ✓ Dark mode support — v1.0
- ✓ Responsive scaling — v1.0

### Active

(None yet — v1 shipped, next milestone TBD)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side image processing | Privacy-first; all client-side |
| User accounts / authentication in v1 | No-auth was explicitly requested |
| RAW format support (CR2, NEF, DNG) | Client-side RAW decoding is heavy; browser support poor |
| Cloud storage integration (Google Drive, Dropbox) | Auth complexity, token refresh, API rate limits; out of v1 scope |
| Lossless WebP/AVIF export | Browser Canvas API quality setting is lossy-only |
| Collaborative editing / team features | Real-time sync infrastructure out of scope for v1 |
| Batch rename with tokens | Suffix-only ("_cropped") is sufficient; complex token UI adds edge cases |
| Real-time AI auto-crop while dragging | AI inference on every drag event creates UI lag |

## Context

- **Stack:** Nuxt 3 (Vue 3) + Sass + Pinia
- **AI:** Client-side subject detection via Smartcrop.js (CDN lazy-loaded)
- **Backend:** Lightweight — for future auth, API key management, and token billing tracking
- **Team:** 3 developers sharing via browser — no auth initially
- **Scale:** Dozens of images per batch, processed locally in browser

## Constraints

- **Browser Support:** Modern desktop browsers (Chrome, Firefox, Safari, Edge)
- **Performance:** Must handle 50+ images without freezing the UI
- **Bundle Size:** AI model(s) must be lazy-loaded to keep initial load fast
- **Privacy:** No images leave the browser unless user explicitly exports (no telemetry, no upload)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vue/Nuxt + Sass | User-specified; good DX for team | ✅ Working |
| Client-side AI subject detection | No server costs, works offline, team privacy | ✅ Smartcrop.js CDN lazy-load |
| Lightweight backend | Future auth + API key infra, not v1 scope | ✅ All client-side |
| Center-crop fallback | Always gives user a usable result even if AI fails | ✅ Implemented |
| Local-only processing | Privacy-first, no server costs for image bytes | ✅ All client-side |
| Horizontal Layers architecture | Composables/stores/components/workers separation | ✅ Clean separation |

---

*Last updated: 2026-07-17 after v1.0 milestone*
