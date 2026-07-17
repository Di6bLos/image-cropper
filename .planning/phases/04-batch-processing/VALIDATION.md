---
phase: 4
slug: 04-batch-processing
plans_validated: [04]
---

# Phase 4: Batch Processing - Validation

## Truth Statements

The following statements are the success criteria from ROADMAP.md that must be validated:

### SC-1: Batch of 50+ images processes without freezing

**Truth:** Batch of 50+ images can be processed without freezing the browser UI.

**Verification method:**
- Open browser DevTools Performance panel
- Start recording
- Trigger batch processing of 50+ images
- Observe that main thread remains responsive (no "long task" warnings >50ms)
- UI interactions (hover, click) remain smooth during processing

**Test type:** Manual smoke test
**Command:** N/A (manual verification)

---

### SC-2: Per-file progress is reported during batch export

**Truth:** Per-file progress is reported during batch export (e.g., "12/50 processed").

**Verification method:**
- Import 50+ images
- Trigger batch export
- Observe progress indicator showing current/total count
- Verify count increments with each completed file

**Test type:** Manual smoke test
**Command:** N/A (manual verification)

---

### SC-3: Worker pool uses navigator.hardwareConcurrency for parallel encoding

**Truth:** Worker pool size is determined by `navigator.hardwareConcurrency`, not a hardcoded value.

**Verification method:**
- Open browser DevTools Console
- During batch processing, run: `navigator.hardwareConcurrency`
- Verify number of active workers matches this value (or is close, accounting for pool reuse)
- Check code: `useBatchProcessor.ts` should use `navigator.hardwareConcurrency ?? 2` for pool size

**Test type:** Code inspection + manual verification
**Command:** N/A (manual verification)

---

### SC-4: Canvas elements are pooled and reused across batch operations

**Truth:** Canvas elements are acquired from and released to a pool, not created/destroyed per operation.

**Verification method:**
- Verify `useCanvasPool.ts` is used in batch processor
- Verify `acquire()` is called before processing and `release()` is called after (even on error)
- Verify pool size is bounded (not unlimited growth)
- Check that no new canvas elements are created during steady-state batch processing

**Test type:** Code inspection
**Command:** N/A (manual verification)

---

### SC-5: ImageBitmap objects are properly closed after transfer to workers

**Truth:** ImageBitmap objects have `.close()` called after `drawImage()` in worker to release GPU memory.

**Verification method:**
- Inspect `image-processor.worker.ts`
- Verify `bitmap.close()` is called after `ctx.drawImage(bitmap, ...)` in all code paths
- Memory profiling: verify memory does not grow linearly with processed image count
- Browser DevTools Memory tab: take heap snapshots before/after processing 50 images

**Test type:** Code inspection + memory profiling
**Command:** N/A (manual verification)

---

## Verification Approach

### Phase Gate Criteria
All 5 success criteria must be verified as TRUE before `/gsd:verify-work` passes.

### Manual Verification Checklist

| Criterion | Verified | Notes |
|-----------|----------|-------|
| SC-1: No UI freezing with 50+ images | [ ] | DevTools Performance panel |
| SC-2: Progress reporting (e.g., "12/50") | [ ] | Visual inspection during export |
| SC-3: navigator.hardwareConcurrency used | [ ] | Code + console verification |
| SC-4: Canvas pool reuse | [ ] | Code inspection |
| SC-5: ImageBitmap.close() called | [ ] | Code inspection + memory profiling |

### Automated Test Gaps

| Test | Gap | Wave |
|------|-----|------|
| Worker pool size matches hardwareConcurrency | Cannot mock `navigator` in Vitest without JSDOM | Wave 0 |
| ImageBitmap memory stable over 50 images | Requires browser environment, not unit-testable | Manual |
| UI remains responsive during batch | Requires real browser, not unit-testable | Manual |

---

## Notes

- Validation is primarily manual due to the nature of the requirements (UI responsiveness, memory stability)
- Code inspection can verify SC-3, SC-4, SC-5 implementation
- SC-1 and SC-2 require real browser testing with DevTools
- Memory profiling (SC-5) requires DevTools Memory tab snapshots