---
phase: 05
plan: 05
type: execute
wave: 1
depends_on: []
files_modified:
  - app/composables/useExportModal.ts
  - app/composables/useFilenameSanitize.ts
autonomous: true
requirements:
  - EXPT-01
  - EXPT-02
  - EXPT-03
  - EXPT-04
  - EXPT-05
  - EXPT-06
  - EXPT-07
must_haves:
  truths:
    - '"Export" button opens format/quality modal'
    - 'Modal offers JPG/PNG/WebP format selection'
    - 'Quality slider (1-100) shown for lossy formats (JPG/WebP), hidden for PNG'
    - 'Download applies current crop settings to all images'
    - 'Filenames sanitized and "_cropped" suffix added'
    - 'Multiple images bundled into single streaming ZIP'
  artifacts:
    - path: app/composables/useExportModal.ts
      provides: Modal state, export options (format/quality/suffix), show/hide/getOptions
    - path: app/composables/useFilenameSanitize.ts
      provides: sanitizeFilename and buildExportFilename utilities
---

<objective>
Build the export modal UI and format/quality selection, wire to existing batch processor (Phase 4), apply crop settings, and generate streaming ZIP.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/composables/useBatchProcessor.ts
@app/composables/useExportPipeline.ts
@app/composables/useCropStore.ts
@app/stores/useImageStore.ts
@app/components/CropWorkspace.vue
@workers/image-processor.worker.ts
@.planning/phases/05-export-polish/05-RESEARCH.md
</context>

<interfaces>
From useBatchProcessor.ts:
```typescript
export interface ProcessedResult {
  id: string
  blob: Blob
  filename: string
}
interface BatchProcessorOptions {
  onProgress?: (current: number, total: number, filename: string) => void
  onComplete?: (results: ProcessedResult[]) => void
  onError?: (error: Error, imageId: string) => void
}
// processBatch(items, options): Promise<ProcessedResult[]>
// items: { id, blobUrl, filename }
```

From useCropStore.ts:
```typescript
// effectiveRatio: computed<number | undefined>
// ratioState: { mode: 'ratio'|'pixel', pixelWidth, pixelHeight, ... }
```

Worker message for batchEncode (current):
```typescript
// payload: { id, filename }, transferables: [bitmap]
// Worker: draws full bitmap, closes, encodes
```

Worker message for batchEncode (Phase 5 extension needed):
```typescript
// payload: { id, filename, crop?: { x, y, width, height }, format, quality }
```
</interfaces>

<tasks>

<task type="auto">
<name>Task 1: Create useFilenameSanitize.ts</name>
<files>app/composables/useFilenameSanitize.ts</files>
<action>
Create `app/composables/useFilenameSanitize.ts` with:

1. `sanitizeFilename(name: string): string` — strips path separators, null bytes, reserved Windows chars (`<>:"/|?*`), control chars, leading dots; limits to 200 chars

2. `buildExportFilename(originalName: string, extension: string, addSuffix: boolean): string` — strips original extension, applies sanitization, appends `_cropped` suffix if addSuffix=true, adds new extension
</action>
<verify>
<automated>grep -c "sanitizeFilename\|buildExportFilename" app/composables/useFilenameSanitize.ts</automated>
<done>useFilenameSanitize.ts exports sanitizeFilename() and buildExportFilename(); handles path traversal, null bytes, reserved chars, length limit</done>
</task>

<task type="auto">
<name>Task 2: Create useExportModal.ts composable</name>
<files>app/composables/useExportModal.ts</files>
<action>
Create `app/composables/useExportModal.ts` with:

1. ExportFormat type: `'jpeg' | 'png' | 'webp'`

2. ExportOptions interface: `{ format: ExportFormat, quality: number, addSuffix: boolean }`

3. Modal state:
   - `isOpen` ref (SSR-safe: false on server)
   - `options` ref initialized to `{ format: 'jpeg', quality: 90, addSuffix: true }`
   - `isExporting` ref for progress state

4. `show()`, `hide()`, `getOptions()` functions

5. SSR-safe with early return pattern
</action>
<verify>
<automated>grep -l "show\|hide\|getOptions\|isOpen" app/composables/useExportModal.ts && grep -c "ExportFormat\|ExportOptions" app/composables/useExportModal.ts</automated>
<done>useExportModal.ts exports show/hide/getOptions/isOpen; format options are jpeg/png/webp with quality slider and suffix toggle</done>
</task>

</tasks>

<tasks>

<task type="auto">
<name>Task 3: Create ExportModal.vue component</name>
<files>app/components/ExportModal.vue</files>
<action>
Create `app/components/ExportModal.vue`:

1. Use `<ClientOnly>` wrapper (Nuxt) for SSR safety

2. Template:
   - `<Teleport to="body">` with modal backdrop (fixed overlay, z-index 9998, semi-transparent black)
   - Modal panel: white/dark bg, rounded corners, shadow, max-width 420px
   - Header: "Export Settings" title + close button
   - Body:
     - Format radio group: JPG / PNG / WebP (styled buttons, not native radio)
     - Quality slider: `v-if="options.format !== 'png'"` — range input 1-100, live label showing current value
     - Suffix toggle: checkbox "Add _cropped suffix"
   - Footer: "Cancel" (secondary) + "Download ZIP" (primary accent) buttons
   - Progress state: when isExporting=true, show progress bar and current filename

3. Script setup:
   - Import `useExportModal` to get isOpen, options, isExporting, hide, getOptions
   - Import `useImageStore`, `useCropStore`, `useBatchProcessor`, `useExportPipeline`
   - Import `useFilenameSanitize` utilities
   - `handleExport()` async function:
     1. Get options from modal
     2. For each image, compute scaled crop rect: cropX/Y/Width/Height scaled to image's original dimensions
     3. Call batchProcessor.processBatch() with crop info per image
     4. Generate ZIP with exportPipeline.generateZip()
     5. Call exportPipeline.downloadBlob()
     6. hide() on completion

4. Style: dark mode via CSS variables, smooth transitions
</action>
<verify>
<automated>grep -l "Teleport\|ClientOnly" app/components/ExportModal.vue && grep -l "handleExport" app/components/ExportModal.vue && grep -l "v-if.*png" app/components/ExportModal.vue</automated>
<done>ExportModal.vue renders via Teleport to body; ClientOnly wraps for SSR; Quality slider hidden for PNG; Export flow wires to batch processor and generates ZIP</done>
</task>

</tasks>

<tasks>

<task type="auto">
<name>Task 4: Wire Export button in CropWorkspace to open modal</name>
<files>app/components/CropWorkspace.vue</files>
<action>
Read `app/components/CropWorkspace.vue` first. Then modify:

1. Import `useExportModal` composable
2. Replace the placeholder `onExport()` function (which has `alert('Export coming in Phase 5')`) with:
   ```typescript
   function onExport() {
     const { show } = useExportModal()
     show()
   }
   ```
3. Change Export button from `type="button"` to use the new onExport
4. Remove the placeholder alert
</action>
<verify>
<automated>grep -l "useExportModal\|onExport" app/components/CropWorkspace.vue && grep -c "alert.*Phase 5" app/components/CropWorkspace.vue</automated>
<done>CropWorkspace Export button calls useExportModal().show(); placeholder alert removed</done>
</task>

<task type="auto">
<name>Task 5: Extend worker batchEncode to support crop parameters</name>
<files>workers/image-processor.worker.ts</files>
<action>
Read `workers/image-processor.worker.ts` first. Extend the `batchEncode` handler to support optional crop parameters:

When `event.data.crop` is present, draw only the cropped region:
```typescript
case 'batchEncode':
  if (event.data.bitmap) {
    const bitmap: ImageBitmap = event.data.bitmap
    const { id, filename, crop, format, quality } = event.data.payload
    const outFormat = format || 'jpeg'
    const outQuality = quality || 90

    try {
      // Determine output dimensions from crop or full bitmap
      const srcX = crop ? crop.x : 0
      const srcY = crop ? crop.y : 0
      const srcW = crop ? crop.width : bitmap.width
      const srcH = crop ? crop.height : bitmap.height

      const canvas = new OffscreenCanvas(srcW, srcH)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
      bitmap.close()

      const blob = await canvas.convertToBlob({
        type: outFormat === 'png' ? 'image/png' : outFormat === 'webp' ? 'image/webp' : 'image/jpeg',
        quality: outQuality / 100,
      })

      self.postMessage({ type: 'encoded', payload: { id, filename, blob } }, [blob])
    } catch (err) {
      self.postMessage({ type: 'encoded', payload: { id, filename, error: String(err) } })
    }
  }
  break
```

Note: The `format` and `quality` are now expected in `event.data.payload` (not at top level). Update the extraction accordingly.
</action>
<verify>
<automated>grep -c "crop" workers/image-processor.worker.ts && grep -c "drawImage.*srcX" workers/image-processor.worker.ts</automated>
<done>Worker batchEncode handler crops source bitmap before encoding when crop params provided; falls back to full image if no crop params</done>
</task>

<task type="auto">
<name>Task 6: Extend useBatchProcessor to pass crop params and format/quality</name>
<files>app/composables/useBatchProcessor.ts</files>
<action>
Read `app/composables/useBatchProcessor.ts` first. Extend `processBatch` to accept crop settings and format/quality:

1. Update the items type to include optional crop params:
   ```typescript
   type BatchItem = {
     id: string
     blobUrl: string
     filename: string
     cropX?: number
     cropY?: number
     cropWidth?: number
     cropHeight?: number
   }
   ```

2. Update options to include format/quality:
   ```typescript
   interface BatchProcessorOptions {
     ...
     format?: 'jpeg' | 'png' | 'webp'
     quality?: number
   }
   ```

3. In the worker.postMessage call, include crop and encoding params:
   ```typescript
   worker.postMessage(
     {
       type: 'batchEncode',
       payload: {
         id: item.id,
         filename: item.filename,
         crop: (item.cropX !== undefined) ? {
           x: item.cropX,
           y: item.cropY,
           width: item.cropWidth,
           height: item.cropHeight,
         } : undefined,
         format: options.format || 'jpeg',
         quality: options.quality || 90,
       },
       transferables: [bitmap],
     },
     [bitmap]
   )
   ```
</action>
<verify>
<automated>grep -c "cropX\|cropY" app/composables/useBatchProcessor.ts && grep -c "format.*quality" app/composables/useBatchProcessor.ts</automated>
<done>useBatchProcessor passes crop dimensions and format/quality to worker; worker draws cropped region before encoding</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user input → filename | User-provided filenames go through sanitizeFilename before ZIP |
| modal options → worker | Format/quality passed in message payload (trusted source) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-01 | Tampering | ZIP filename | mitigate | sanitizeFilename strips path separators, null bytes, reserved chars; max 200 chars |
| T-05-02 | Denial of Service | ZIP generation | mitigate | streamFiles: true in generateAsync; quality clamped to 1-100 |
| T-05-03 | Information Disclosure | Modal state | accept | Modal state is client-side only; no sensitive data |
</threat_model>

<verification>
## Phase-Level Verification

1. Clicking "Export" in CropWorkspace opens modal with format/quality options
2. Selecting PNG hides quality slider
3. JPG/WebP shows quality slider with current value label
4. "Download ZIP" button triggers batch processing with crop applied
5. ZIP downloads with `_cropped` suffix on filenames (when enabled)
6. Progress shows during batch processing
7. Modal closes after successful export
</verification>

<success_criteria>
1. Export button in CropWorkspace opens modal via useExportModal
2. Modal shows format selection (JPG/PNG/WebP) as styled radio buttons
3. Quality slider (1-100) visible for JPG and WebP, hidden for PNG
4. Batch processing applies current crop window coordinates to each image
5. All images bundled into single ZIP with sanitized filenames
6. ZIP downloads automatically on completion
</success_criteria>

<output>
Create `.planning/phases/05-export-polish/05-SUMMARY.md` when done
</output>
