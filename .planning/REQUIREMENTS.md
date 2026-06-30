# Requirements: Image Cropper

**Defined:** 2026-06-24
**Core Value:** Small teams can batch-crop dozens of images to consistent dimensions in minutes, with smart defaults that eliminate repetitive manual work.

## v1 Requirements

### Import

- [ ] **IMPT-01**: User can import images via file picker (click to browse)
- [ ] **IMPT-02**: User can import images via drag-and-drop onto a visible drop zone
- [ ] **IMPT-03**: Drop zone provides visual feedback on drag-over (highlight/border change)
- [ ] **IMPT-04**: Imported images generate lazy-loaded thumbnails for the preview list

### Preview

- [ ] **PRVW-01**: All imported images appear in a scrollable bulk preview list
- [ ] **PRVW-02**: Each list item shows thumbnail, filename, and original dimensions
- [ ] **PRVW-03**: User can click an image in the list to select it for cropping

### Crop Window

- [ ] **CROP-01**: Selected image displays a draggable crop window overlay
- [ ] **CROP-02**: Crop window has visible handles at corners and edges for resizing
- [ ] **CROP-03**: Crop window constrains to selected aspect ratio while resizing from corners
- [ ] **CROP-04**: Area outside the crop window is dimmed with a semi-transparent overlay
- [ ] **CROP-05**: Crop window has a visible white border to distinguish it from the image
- [ ] **CROP-06**: Crop window position is clamped within image bounds

### Ratio & Size

- [ ] **RATIO-01**: User can select from aspect ratio presets: 16:9, 3:2, 1:1, 2:3
- [ ] **RATIO-02**: Selecting a preset immediately constrains the crop window to that ratio
- [ ] **RATIO-03**: User can enter a custom ratio as "W:H" (e.g., "7:4") and apply it
- [ ] **RATIO-04**: User can enter custom pixel dimensions (e.g., "1200x800") for export size
- [ ] **RATIO-05**: Custom ratio and pixel size inputs are mutually exclusive modes (radio/toggle)

### AI Detection

- [ ] **AIDT-01**: "Auto crop" button runs AI subject detection on the selected image
- [ ] **AIDT-02**: Smartcrop.js is lazy-loaded on first use from CDN (not bundled)
- [ ] **AIDT-03**: Detected focal point positions the crop window automatically
- [ ] **AIDT-04**: If AI detection fails or is unavailable, center-crop is used as fallback
- [ ] **AIDT-05**: AI processing runs off the main thread (Web Worker)

### Export

- [ ] **EXPT-01**: "Export" button opens a format/quality options modal before downloading
- [ ] **EXPT-02**: Modal offers format selection: JPG, PNG, WebP
- [ ] **EXPT-03**: Modal offers a quality slider (1-100) for lossy formats (JPG, WebP)
- [ ] **EXPT-04**: Export applies the current crop settings to all images in the list
- [ ] **EXPT-05**: Exported files preserve original filenames with an optional "_cropped" suffix
- [ ] **EXPT-06**: Multiple images are bundled into a single ZIP download
- [ ] **EXPT-07**: ZIP generation uses streaming to avoid memory exhaustion on large batches

### UI/UX

- [ ] **UIUX-01**: Dark mode support using CSS variables, respecting system preference
- [ ] **UIUX-02**: Canvas and crop window scale responsively to the browser window size

## v2 Requirements

Deferred. Will be added after v1 validates core value.

### AI & Smart Features

- **AIV2-01**: Rule of thirds grid overlay (toggle-able) for composition guidance
- **AIV2-02**: Crop position memory — last-used crop position applied to newly added images
- **AIV2-03**: Before/after comparison slider for selected image

### Power User

- **PWRU-01**: Batch progress indicator with per-file status and ETA
- **PWRU-02**: Undo/redo for crop adjustment history
- **PWRU-03**: Multi-format single-click export (export same crops to multiple formats at once)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Server-side image processing | Privacy-first; all client-side |
| User accounts / authentication in v1 | No-auth was explicitly requested; auth infra is scaffolded for v2 |
| RAW format support (CR2, NEF, DNG) | Client-side RAW decoding is heavy; browser support poor |
| Cloud storage integration (Google Drive, Dropbox) | Auth complexity, token refresh, API rate limits; out of v1 scope |
| Lossless WebP/AVIF export | Browser Canvas API quality setting is lossy-only for these formats |
| Collaborative editing / team features | Real-time sync infrastructure out of scope for v1 |
| Batch rename with tokens | Suffix-only ("_cropped") is sufficient; complex token UI adds edge cases |
| Real-time AI auto-crop while dragging | AI inference on every drag event creates UI lag; apply on selection instead |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMPT-01 | Phase 2 | Pending |
| IMPT-02 | Phase 2 | Pending |
| IMPT-03 | Phase 2 | Pending |
| IMPT-04 | Phase 2 | Pending |
| PRVW-01 | Phase 2 | Pending |
| PRVW-02 | Phase 2 | Pending |
| PRVW-03 | Phase 2 | Pending |
| CROP-01 | Phase 2 | Pending |
| CROP-02 | Phase 2 | Pending |
| CROP-03 | Phase 2 | Pending |
| CROP-04 | Phase 2 | Pending |
| CROP-05 | Phase 2 | Pending |
| CROP-06 | Phase 2 | Pending |
| RATIO-01 | Phase 2 | Pending |
| RATIO-02 | Phase 2 | Pending |
| RATIO-03 | Phase 2 | Pending |
| RATIO-04 | Phase 2 | Pending |
| RATIO-05 | Phase 2 | Pending |
| AIDT-01 | Phase 3 | Pending |
| AIDT-02 | Phase 3 | Pending |
| AIDT-03 | Phase 3 | Pending |
| AIDT-04 | Phase 3 | Pending |
| AIDT-05 | Phase 3 | Pending |
| EXPT-01 | Phase 5 | Pending |
| EXPT-02 | Phase 5 | Pending |
| EXPT-03 | Phase 5 | Pending |
| EXPT-04 | Phase 5 | Pending |
| EXPT-05 | Phase 5 | Pending |
| EXPT-06 | Phase 5 | Pending |
| EXPT-07 | Phase 5 | Pending |
| UIUX-01 | Phase 2 | Pending |
| UIUX-02 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-24*
*Last updated: 2026-06-29 after roadmap creation*
