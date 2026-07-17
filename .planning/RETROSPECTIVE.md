# Retrospective

## Milestone: v1.0 — Image Cropper MVP

**Shipped:** 2026-07-17
**Phases:** 5 | **Plans:** 9

### What Was Built

1. Foundation — Initialize Nuxt 3 project with Pinia, Sass, COOP/COEP headers, and memory management composables (blob registry, canvas pool, image worker)
2. Core Cropping — Full crop UI: drag-drop import, preview list, crop overlay with handles, ratio presets (16:9, 3:2, 1:1, 2:3), custom ratio/pixel modes, dark mode
3. AI Detection — Smartcrop.js lazy-loaded from CDN, Web Worker off-thread processing, center-crop fallback, keyboard shortcut 'A'
4. Batch Processing — Worker pool with hardwareConcurrency sizing, canvas pooling, ImageBitmap memory safety, streaming ZIP generation
5. Export Polish — Export modal with format/quality selection, filename sanitization, `_cropped` suffix, batch crop application

### What Worked

- SSR-safe patterns with process.client guards prevented server-side errors
- Memory management composables (blob registry, canvas pool) provided clean resource lifecycle
- CDN lazy-loading for Smartcrop.js kept initial bundle small
- Web Worker off-thread processing kept UI responsive during AI detection
- Center-crop fallback ensured users always get a usable result

### What Was Inefficient

- Phase 3 work was spread across multiple PRs with merge conflicts requiring resolution
- Phase 4 lacked a formal VERIFICATION.md (VALIDATION.md with manual checklist used instead)
- Some composables defined but not imported (useCropWindow, useImageWorker) — logic inlined where needed

### Patterns Established

- Horizontal Layers architecture: composables/stores/components/workers separation
- SSR-safe patterns: isMounted ref, process.client guards in composables
- Memory safety: Blob URL registry, canvas pooling, ImageBitmap closure
- CDN lazy-loading with pinned versions for external dependencies

### Key Lessons

- SSR safety requires careful pattern discipline (isMounted refs, process.client guards)
- CDN lazy-loading is effective for optional heavy dependencies (keeps initial load fast)
- Center-crop fallback is essential for AI features — always give users a usable result
- Phase audits should be run before milestone completion to catch tech debt early

---

## Cross-Milestone Trends

(TBD — no previous milestones to compare)
