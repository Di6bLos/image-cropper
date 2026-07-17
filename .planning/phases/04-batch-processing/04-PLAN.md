---
phase: 04
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - app/composables/useBatchProcessor.ts
  - app/composables/useExportPipeline.ts
  - workers/image-processor.worker.ts
autonomous: true
requirements:
  - EXPT-04
  - EXPT-06
must_haves:
  truths:
    - 'Batch of 50+ images processes without freezing browser UI'
    - 'Per-file progress reported during batch export (e.g., "12/50 processed")'
    - 'Worker pool uses navigator.hardwareConcurrency for parallel encoding'
    - 'Canvas elements pooled and reused across batch operations'
    - 'ImageBitmap objects properly closed after transfer to workers'
  artifacts:
    - path: app/composables/useBatchProcessor.ts
      provides: Worker pool orchestration, progress tracking, per-file callbacks
    - path: app/composables/useExportPipeline.ts
      provides: JSZip streaming ZIP generation with progress
    - path: workers/image-processor.worker.ts
      provides: batchProcess message handler with ImageBitmap close
  key_links:
    - from: useBatchProcessor.ts
      to: workers/image-processor.worker.ts
      via: Worker pool with hardwareConcurrency sizing
    - from: useBatchProcessor.ts
      to: useExportPipeline.ts
      via: Per-file crop results to ZIP entries
---

<objective>
Create batch processing infrastructure: worker pool composable, export pipeline, and extend worker protocol with batchEncode message handler.
</objective>

<context>
@app/composables/useImageWorker.ts
@app/composables/useCanvasPool.ts
@app/composables/useBlobRegistry.ts
@workers/image-processor.worker.ts
@.planning/phases/04-batch-processing/04-RESEARCH.md
</context>

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From app/composables/useImageWorker.ts:
```typescript
export interface WorkerMessage {
  type: string
  payload: any
  transferables?: Transferable[]
}
```

From app/composables/useCanvasPool.ts:
```typescript
interface CanvasPool {
  acquire: () => OffscreenCanvas | HTMLCanvasElement
  release: (canvas: OffscreenCanvas | HTMLCanvasElement) => void
  dispose: () => void
}
```

From app/composables/useBlobRegistry.ts:
```typescript
export interface BlobRegistry {
  create: (blob: Blob) => string
  revoke: (url: string) => void
  revokeAll: () => void
  urls: Readonly<Set<string>>
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create useBatchProcessor.ts worker pool composable</name>
  <files>app/composables/useBatchProcessor.ts</files>
  <action>
Create `app/composables/useBatchProcessor.ts` with:

1. Worker pool sized to `navigator.hardwareConcurrency ?? 2` using the existing worker file at `../workers/image-processor.worker.ts`

2. Worker pool interface:
```typescript
interface BatchProcessorOptions {
  onProgress?: (current: number, total: number, filename: string) => void
  onComplete?: (results: ProcessedResult[]) => void
  onError?: (error: Error, imageId: string) => void
}

interface ProcessedResult {
  id: string
  blob: Blob
  filename: string
}
```

3. Round-robin task distribution to workers with load tracking

4. Message handler that routes worker responses to callbacks

5. SSR safety check (early return with noop methods)

6. Pool termination on onUnmounted

Do NOT create canvases directly in this composable. The worker handles canvas acquisition internally via useCanvasPool pattern.
  </action>
  <verify>
    <automated>grep -c "navigator.hardwareConcurrency" app/composables/useBatchProcessor.ts && grep -c "processBatch" app/composables/useBatchProcessor.ts</automated>
  </verify>
  <done>Worker pool composable creates hardwareConcurrency-sized pool, distributes tasks round-robin, and reports progress via callbacks</done>
</task>

<task type="auto">
  <name>Task 2: Create useExportPipeline.ts ZIP generation composable</name>
  <files>app/composables/useExportPipeline.ts</files>
  <action>
Create `app/composables/useExportPipeline.ts` with:

1. Import JSZip (installed as dependency, import from 'jszip')

2. Export pipeline interface:
```typescript
interface ExportPipelineOptions {
  format: 'jpeg' | 'png' | 'webp'
  quality: number  // 1-100
  onProgress?: (current: number, total: number) => void
  onComplete?: (zipBlob: Blob) => void
  onError?: (error: Error, filename: string) => void
}
```

3. Function `generateZip(results: ProcessedResult[], options: ExportPipelineOptions): void` that:
   - Creates JSZip instance
   - Adds each result blob with original filename using `zip.file(filename, blob)`
   - Calls onProgress after each file added
   - Generates async ZIP blob via `zip.generateAsync({ type: 'blob' })`
   - Calls onComplete with resulting Blob

4. SSR safety check (early return for server-side)

5. Filename collision handling: if filename already exists in zip, append `-1`, `-2`, etc.
  </action>
  <verify>
    <automated>grep -c "JSZip\|jszip" app/composables/useExportPipeline.ts && grep -c "generateAsync" app/composables/useExportPipeline.ts</automated>
  </verify>
  <done>Export pipeline composable generates ZIP from processed results with per-file progress and filename collision handling</done>
</task>

<task type="auto">
  <name>Task 3: Extend image-processor.worker.ts with batchEncode handler</name>
  <files>workers/image-processor.worker.ts</files>
  <action>
Extend `workers/image-processor.worker.ts` to add `batchEncode` message handler:

1. In the existing `self.addEventListener('message', ...)` switch, add a new case:

```typescript
case 'batchEncode':
  // payload: { id: string, bitmap: ImageBitmap, format: string, quality: number }
  // transferables: [bitmap]
  if (event.data.bitmap) {
    const bitmap: ImageBitmap = event.data.bitmap
    const { id, format, quality } = event.data.payload

    try {
      // Use OffscreenCanvas for encoding
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bitmap, 0, 0)

      // CRITICAL: Close bitmap to release GPU memory
      bitmap.close()

      // Encode to blob based on format
      const blob = await canvas.convertToBlob({
        type: format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp',
        quality: quality / 100
      })

      self.postMessage({ type: 'encoded', payload: { id, blob } }, [blob])
    } catch (error) {
      self.postMessage({ type: 'encoded', payload: { id, error: error.message } })
    }
  }
  break
```

2. Keep existing `processImage` case for single-image processing (Phase 2-3 compatibility)

3. Keep `ping`/`pong` for worker health checks
</action>
  <verify>
    <automated>grep -c "batchEncode" workers/image-processor.worker.ts && grep -c "bitmap.close" workers/image-processor.worker.ts</automated>
  </verify>
  <done>Worker handles batchEncode messages, properly closes ImageBitmap after drawImage, and returns encoded Blob</done>
</task>

</tasks>

<verification>
- `grep -c "navigator.hardwareConcurrency" app/composables/useBatchProcessor.ts` returns 1+
- `grep -c "batchEncode" workers/image-processor.worker.ts` returns 1+
- `grep -c "bitmap.close" workers/image-processor.worker.ts` returns 1+
- `grep -c "generateAsync" app/composables/useExportPipeline.ts` returns 1+
- All files compile without TypeScript errors
</verification>

<success_criteria>
- useBatchProcessor.ts exports a composable that manages a worker pool sized to hardwareConcurrency
- useExportPipeline.ts exports a composable that generates ZIP files with JSZip
- image-processor.worker.ts handles batchEncode messages with proper ImageBitmap closure
- Progress callbacks are wired for per-file reporting
</success_criteria>

<output>
Create `.planning/phases/04-batch-processing/04-01-SUMMARY.md` when done
</output>

---

## Wave 2: UI Integration

<objective>
Add batch export button and progress UI to the main page.
</objective>

<tasks>

<task type="auto">
  <name>Task 4: Add batch export progress UI to index.vue</name>
  <files>app/pages/index.vue</files>
  <action>
Extend `app/pages/index.vue` to add batch export UI:

1. Add reactive state for batch progress:
```typescript
const batchProgress = ref({
  isProcessing: false,
  current: 0,
  total: 0,
  currentFilename: ''
})
```

2. Add batch export button in the header area (after the title):
```html
<button 
  v-if="imageStore.imageCount > 0"
  class="batch-export-btn"
  :disabled="batchProgress.isProcessing"
  @click="triggerBatchExport"
>
  {{ batchProgress.isProcessing ? `Processing ${batchProgress.current}/${batchProgress.total}...` : 'Export All' }}
</button>
```

3. Add progress bar styling in the `<style>` section for `.batch-export-btn`

4. Add `triggerBatchExport` function that:
   - Imports `useBatchProcessor` and `useExportPipeline`
   - Uses `useImageStore` to get all images
   - Uses `useCropStore` to get current crop settings (ratio, pixel dimensions)
   - Creates ImageBitmap for each image
   - Calls batch processor with progress callback
   - On completion, generates ZIP and triggers download

5. Import required composables and stores in the script section
</action>
  <verify>
    <automated>grep -c "batch-export-btn\|Export All" app/pages/index.vue && grep -c "triggerBatchExport" app/pages/index.vue</automated>
  </verify>
  <done>Batch export button appears in header, progress shows "X/Y processed" during export</done>
</task>

</tasks>

<verification>
- Button visible when images exist
- Progress updates during batch export
- ZIP downloads on completion
</verification>

<success_criteria>
- Batch export button visible in header
- Clicking button triggers batch processing
- Progress indicator shows "current/total" count
- ZIP file downloads on completion
</success_criteria>

<output>
Create `.planning/phases/04-batch-processing/04-02-SUMMARY.md` when done
</output>

---

## Wave 3: Integration and Memory Safety

<objective>
Wire batch processor to export flow, ensure canvas pool and blob registry integration, add memory safety with proper cleanup.
</objective>

<tasks>

<task type="auto">
  <name>Task 5: Wire batch processor to canvas pool and blob registry</name>
  <files>app/composables/useBatchProcessor.ts</files>
  <action>
Extend `useBatchProcessor.ts` to integrate with existing memory management composables:

1. Import and use `useCanvasPool` for canvas acquisition in worker messages:
   - Pass canvas pool reference to workers for encoding operations

2. Import and use `useBlobRegistry` for result blob URLs:
   - Create blob URL for each result for preview/debugging
   - Revoke URLs after ZIP generation

3. Add memory safety:
   - Ensure `canvasPool.release()` is called in finally blocks
   - Ensure blob URLs are revoked after use
   - Track resource allocation to prevent leaks

4. The worker pool should reuse workers across batches (not create new pool per batch)
</action>
  <verify>
    <automated>grep -c "useCanvasPool\|useBlobRegistry" app/composables/useBatchProcessor.ts</automated>
  </verify>
  <done>Batch processor integrates with canvas pool and blob registry, proper cleanup on errors</done>
</task>

<task type="auto">
  <name>Task 6: Wire index.vue to useCropStore for export dimensions</name>
  <files>app/pages/index.vue</files>
  <action>
Extend `triggerBatchExport` in `app/pages/index.vue` to use crop settings:

1. Get effective crop dimensions from `useCropStore`:
   - Use `effectiveRatio` for ratio-based cropping
   - Use `pixelWidth`/`pixelHeight` for pixel-based cropping

2. Pass dimensions to batch processor options for encoding

3. Pass format and quality from export options modal (Phase 5) when available, default to JPEG 90 quality

4. Use original filenames from `useImageStore` items
</action>
  <verify>
  </verify>
  <done>Batch export uses current crop settings from useCropStore</done>
</task>

</tasks>

<verification>
- Canvas pool is used during batch processing (verify via code inspection)
- Blob registry tracks result URLs (verify via code inspection)
- Crop settings are applied during export
</verification>

<success_criteria>
- Canvas pool acquire/release called properly
- Blob registry used for result tracking
- Export applies crop dimensions from useCropStore
</success_criteria>

<output>
Create `.planning/phases/04-batch-processing/04-03-SUMMARY.md` when done
</output>
