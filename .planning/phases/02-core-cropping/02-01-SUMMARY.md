---
phase: 02-core-cropping
plan: "01"
subsystem: ui
tags: [vue, pinia, composables, vitest, typescript]

# Dependency graph
requires:
  - phase: "01-foundation"
    provides: useBlobRegistry, useCanvasPool composables
provides:
  - app/composables/useFileUpload.ts - Counter-based drag tracking, file validation, SSR-safe guards
  - app/composables/useThumbnail.ts - Async thumbnail generation using createImageBitmap + canvas pool
  - app/composables/useCropWindow.ts - Drag/resize state machine with aspect ratio constraint math
  - app/stores/useImageStore.ts - Image list state, selection, blob URL lifecycle
  - app/stores/useCropStore.ts - Ratio/pixel mode state and effectiveRatio computation
  - vitest.config.ts - Vitest configuration with Vue plugin and jsdom environment
  - tests/setup.ts - Test infrastructure with Pinia reset per test
affects:
  - Phase 2 UI components (DropZone, ImageList, CropOverlay, RatioControls)
  - Phase 3 AI Detection
  - Phase 4 Batch Processing

# Tech tracking
tech-stack:
  added: [vitest, @vue/test-utils, @vitejs/plugin-vue, jsdom]
  patterns:
    - SSR-safe composables with process.client guards
    - Counter-based drag tracking for nested elements
    - Canvas pool + createImageBitmap for thumbnail generation
    - Pinia setup stores with readonly() wrappers

key-files:
  created:
    - app/composables/useFileUpload.ts
    - app/composables/useThumbnail.ts
    - app/composables/useCropWindow.ts
    - app/stores/useImageStore.ts
    - app/stores/useCropStore.ts
    - tests/composables/useFileUpload.test.ts
    - tests/composables/useThumbnail.test.ts
    - tests/composables/useCropWindow.test.ts
    - tests/stores/useImageStore.test.ts
    - tests/stores/useCropStore.test.ts
    - tests/setup.ts
    - vitest.config.ts

key-decisions:
  - "useFileUpload uses counter-based drag tracking (dragCounter ref) to handle nested drag events correctly"
  - "useThumbnail uses createImageBitmap for memory-efficient decoding + canvas pool for rendering"
  - "useCropWindow handles all 4 corner handles with aspect ratio constraint that adjusts both dimensions AND position"
  - "useCropStore computed effectiveRatio derives value from mode and preset for crop window constraint"

patterns-established:
  - "SSR-safe pattern: process.client guards + early returns"
  - "Pinia setup stores with readonly() wrappers on returned state"
  - "Composables return readonly() refs for exposed state"

requirements-completed:
  - IMPT-01
  - IMPT-02
  - IMPT-03
  - IMPT-04
  - CROP-01
  - CROP-02
  - CROP-03
  - CROP-06
  - RATIO-01
  - RATIO-02
  - RATIO-05

# Metrics
duration: 17min
completed: 2026-07-01
---

# Phase 2 Plan 1 Summary

**Core cropping infrastructure: useFileUpload, useThumbnail, useCropWindow composables plus useImageStore and useCropStore Pinia stores**

## Performance

- **Duration:** 17 min (1024s)
- **Started:** 2026-07-01T21:12:32Z
- **Completed:** 2026-07-01T21:29:36Z
- **Tasks:** 6
- **Files modified:** 13

## Accomplishments
- Created SSR-safe file upload composable with counter-based drag tracking
- Created thumbnail generation composable using createImageBitmap + canvas pool
- Created crop window composable with drag/resize and aspect ratio constraint math for all 4 handles
- Created image store with blob URL lifecycle management
- Created crop store with ratio/pixel modes and effectiveRatio computation
- Established test infrastructure with Vitest, jsdom, and Pinia setup

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test infrastructure (Vitest config + setup)** - `2394881` (test)
2. **Task 2: Create useFileUpload composable** - `9f32328` (feat)
3. **Task 3: Create useThumbnail composable** - `ceb3798` (feat)
4. **Task 4: Create useCropWindow composable** - `af6f6be` (feat)
5. **Task 5: Create useImageStore** - `dd333c9` (feat)
6. **Task 6: Create useCropStore** - `031d8a0` (feat)

## Files Created/Modified

- `app/composables/useFileUpload.ts` - File drag-drop and picker with counter-based drag tracking
- `app/composables/useThumbnail.ts` - Async thumbnail generation with createImageBitmap + canvas pool
- `app/composables/useCropWindow.ts` - Drag/resize crop window with aspect ratio constraint math
- `app/stores/useImageStore.ts` - Image list state with selection and blob URL cleanup
- `app/stores/useCropStore.ts` - Ratio/pixel mode state with effectiveRatio computation
- `vitest.config.ts` - Vitest with Vue plugin, jsdom, and ~ alias
- `tests/setup.ts` - Vue Test Utils + Pinia reset per test
- `tests/composables/useFileUpload.test.ts` - Tests for drag counter logic and validation
- `tests/composables/useThumbnail.test.ts` - Tests for aspect ratio preservation
- `tests/composables/useCropWindow.test.ts` - Tests for ratio constraint and bounds clamping
- `tests/stores/useImageStore.test.ts` - Tests for selection and cleanup logic
- `tests/stores/useCropStore.test.ts` - Tests for effectiveRatio computation

## Decisions Made

- Counter-based drag tracking (not boolean) to handle nested drag events correctly
- createImageBitmap over new Image() for better memory behavior
- All 4 corner handles maintain aspect ratio by adjusting BOTH dimensions AND position
- useCropWindow uses plain toRef() instead of toRefs() on plain options object

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Test file setup.ts was being treated as a test file (beforeEach not defined) - fixed by importing beforeEach from vitest
- Test for process.client guard tried to redefine non-configurable property - rewrote test to use simpler approach
- toRefs() called on plain options object (not reactive) - fixed by using toRef(options, 'prop') for each property
- Two tests had tolerance too tight for 16:9 ratio (1.777 vs 1.7778) - adjusted expected value

## Test Results

All 56 tests pass across 5 test files:
- tests/composables/useFileUpload.test.ts: 10 passed
- tests/composables/useThumbnail.test.ts: 9 passed
- tests/composables/useCropWindow.test.ts: 16 passed
- tests/stores/useImageStore.test.ts: 8 passed
- tests/stores/useCropStore.test.ts: 13 passed

## Next Phase Readiness

- Phase 2 core infrastructure complete and tested
- Ready for Plan 2: UI components (DropZone, ImageList, CropOverlay, RatioControls)
- All composables and stores follow SSR-safe patterns established in Phase 1

---
*Phase: 02-core-cropping*
*Completed: 2026-07-01*
