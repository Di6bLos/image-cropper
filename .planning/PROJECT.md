# Image Cropper

## What This Is

A browser-based bulk image cropping tool for small teams. Drop in a batch of images, pick an aspect ratio or custom dimensions, preview crops with a draggable positioning window, use AI-assisted subject detection (with center-crop fallback), and export as JPG/PNG/WebP zipped to your machine. No auth required for v1, but infrastructure supports adding it later.

## Core Value

Small teams can batch-crop dozens of images to consistent dimensions in minutes, not hours — with smart defaults that eliminate repetitive manual work.

## Requirements

### Active

- [ ] Team can import images via file picker or drag-and-drop
- [ ] Bulk preview list showing all imported images with crop window overlay
- [ ] Draggable crop window over each image for manual positioning
- [ ] Aspect ratio presets: 16:9, 3:2, 1:1, 2:3
- [ ] Custom ratio input field (e.g., `7:4`)
- [ ] Custom pixel size input (e.g., `1200×800`)
- [ ] AI-powered subject detection (client-side, with center-crop fallback if unavailable or exhausted)
- [ ] Export as JPG, PNG, or WebP with quality control
- [ ] Original filename preservation in zip export
- [ ] Format/quality options modal before export

### Out of Scope

- Server-side image processing — all client-side
- User accounts / authentication in v1
- Advanced batch operations (watermarks, filters, batch rename)
- Mobile optimization — desktop-first

## Context

- **Stack:** Nuxt 3 (Vue 3) + Sass
- **AI:** Client-side subject detection (e.g., Transformers.js / TensorFlow.js)
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
| Vue/Nuxt + Sass | User-specified; good DX for team | — Pending |
| Client-side AI subject detection | No server costs, works offline, team privacy | — Pending |
| Lightweight backend | Future auth + API key infra, not v1 scope | — Pending |
| Center-crop fallback | Always gives user a usable result even if AI fails | — Pending |
| Local-only processing | Privacy-first, no server costs for image bytes | — Pending |

---

*Last updated: 2026-06-24 after initialization*
