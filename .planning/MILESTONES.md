# Milestones

## v1.0 MVP — Image Cropper

**Shipped:** 2026-07-17
**Status:** ✅ Complete

### Stats
- **Phases:** 5 (Foundation, Core Cropping, AI Detection, Batch Processing, Export Polish)
- **Plans:** 9 total
- **Requirements:** 29/29 v1 requirements verified
- **Timeline:** 23 days (2026-06-24 → 2026-07-17)

### Accomplishments

1. Foundation — Initialize Nuxt 3 project with Pinia, Sass, COOP/COEP headers, and memory management composables (blob registry, canvas pool, image worker)
2. Core Cropping — Full crop UI: drag-drop import, preview list, crop overlay with handles, ratio presets (16:9, 3:2, 1:1, 2:3), custom ratio/pixel modes, dark mode
3. AI Detection — Smartcrop.js lazy-loaded from CDN, Web Worker off-thread processing, center-crop fallback, keyboard shortcut 'A'
4. Batch Processing — Worker pool with hardwareConcurrency sizing, canvas pooling, ImageBitmap memory safety, streaming ZIP generation
5. Export Polish — Export modal with format/quality selection, filename sanitization, `_cropped` suffix, batch crop application

### Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vue/Nuxt + Sass | User-specified; good DX for team | ✅ Working |
| Client-side AI subject detection | No server costs, works offline, team privacy | ✅ Smartcrop.js CDN lazy-load |
| Lightweight backend | Future auth + API key infra, not v1 scope | ✅ All client-side |
| Center-crop fallback | Always gives user a usable result even if AI fails | ✅ Implemented |
| Local-only processing | Privacy-first, no server costs for image bytes | ✅ All client-side |

### Known Tech Debt

- Phase 2 human verification checkpoint (11 manual visual UX tests)
- Phase 4 no VERIFICATION.md (VALIDATION.md used instead)
- useCropWindow composable unused (logic inlined in CropWorkspace)
- useImageWorker not effectively used (Smartcrop creates own worker)

### Archives

- [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)
- [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)
- [v1.0-MILESTONE-AUDIT.md](./milestones/v1.0-MILESTONE-AUDIT.md)

---

*Last updated: 2026-07-17*
