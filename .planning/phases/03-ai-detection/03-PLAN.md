---
phase: 3
plan: 03
type: execute
wave: 1
depends_on: []
autonomous: false
requirements:
  - AIDT-01
  - AIDT-02
  - AIDT-03
  - AIDT-04
  - AIDT-05
files_modified:
  - app/composables/useSmartcrop.ts
  - app/composables/useToast.ts
  - app/workers/image-processor.worker.ts
  - app/components/AutoCropButton.vue
  - app/components/ToastNotification.vue
  - app/components/CropWorkspace.vue
must_haves:
  truths:
    - '"Auto crop" button triggers Smartcrop.js subject detection'
    - 'Smartcrop.js lazy-loaded from CDN on first use (not bundled)'
    - 'Detected focal point positions crop window automatically'
    - 'Center-crop used as fallback when AI fails or is unavailable'
    - 'AI processing runs in Web Worker off main thread'
  artifacts:
    - path: app/composables/useSmartcrop.ts
      provides: Smartcrop CDN loader and detectCrop function
    - path: app/composables/useToast.ts
      provides: Toast state and show functions
    - path: app/workers/image-processor.worker.ts
      provides: aiDetect message handler
    - path: app/components/AutoCropButton.vue
      provides: Auto crop button with sparkles icon and loading state
    - path: app/components/ToastNotification.vue
      provides: Bottom-center toast display
  key_links:
    - from: app/composables/useSmartcrop.ts
      to: app/workers/image-processor.worker.ts
      via: worker.postMessage with aiDetect type and ImageBitmap transferable
    - from: app/workers/image-processor.worker.ts
      to: app/composables/useSmartcrop.ts
      via: postMessage with aiDetectResult type
    - from: app/components/CropWorkspace.vue
      to: app/composables/useSmartcrop.ts
      via: detectCrop() call on button click
---

<objective>
Integrate Smartcrop.js for AI-powered subject detection that automatically positions the crop window. Smartcrop.js runs content-aware cropping analysis (edge detection, skin-tone, saturation) to find optimal focal points. The library is lazy-loaded from CDN on first use, not bundled. AI processing runs in a Web Worker to prevent UI freezes. If AI fails, center-crop is used as fallback.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/composables/useImageWorker.ts
@app/composables/useCropWindow.ts
@app/composables/useToast.ts
@app/workers/image-processor.worker.ts
@app/components/CropWorkspace.vue
@app/components/IconButton.vue
@.planning/phases/03-ai-detection/03-UI-SPEC.md
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
export function useImageWorker(): UseImageWorkerReturn
// Returns: { isProcessing, postMessage, terminate }
```

From app/composables/useCropWindow.ts:
```typescript
export function useCropWindow(): {
  cropX: Ref<number>
  cropY: Ref<number>
  cropWidth: Ref<number>
  cropHeight: Ref<number>
  centerCrop: () => void  // fallback when AI fails
  // Also has setCrop(x, y, w, h) implicitly via the refs
}
```

Worker message protocol for aiDetect:
```typescript
// Main → Worker
{ type: 'aiDetect', payload: { bitmap: ImageBitmap, targetWidth: number, targetHeight: number }, transferables: [bitmap] }

// Worker → Main
{ type: 'aiDetectResult', payload: { success: boolean, crop?: { x: number, y: number, width: number, height: number }, error?: string } }
```
</interfaces>

<tasks>

<task type="auto">
<name>Wave 1.1: Create useSmartcrop.ts composable</name>
<files>app/composables/useSmartcrop.ts</files>
<action>
Create `app/composables/useSmartcrop.ts` with:

- Smartcrop.js type declaration: `declare const smartcrop: { crop: (canvas: OffscreenCanvas, options: { width: number, height: number, ruleOfThirds: boolean }) => Promise<{ topCrop: { x: number, y: number, width: number, height: number } }> }`
- CDN URL (CORRECTED): `https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js` (package name is `smartcrop`, NOT `smartcropjs`)
- `loadSmartcropFromCDN()` singleton loader using `document.createElement('script')` pattern with cached flag
- `detectCrop(imageUrl: string, targetWidth: number, targetHeight: number)` async function that:
  1. Loads Smartcrop.js from CDN if not already loaded
  2. Creates ImageBitmap from imageUrl via fetch + createImageBitmap
  3. Transfers bitmap to worker via postMessage with `aiDetect` type and ImageBitmap in transferables
  4. Returns detected crop result or falls back to center-crop calculation
  5. Returns `{ x, y, width, height }` in image pixel coordinates
- SSR-safe with early return pattern (if (!process.client) return early)
- Uses existing useImageWorker pattern for worker communication
</action>
<verify>
<automated>
grep -l "loadSmartcropFromCDN" app/composables/useSmartcrop.ts
grep -l "aiDetect" app/composables/useSmartcrop.ts
grep -l "transferables" app/composables/useSmartcrop.ts
grep -c "cdn.jsdelivr.net/npm/smartcrop@" app/composables/useSmartcrop.ts
</verify>
<done>
useSmartcrop.ts exports detectCrop(imageUrl, targetWidth, targetHeight) async function; CDN URL uses `smartcrop@2.0.5` (not smartcropjs); Falls back to center-crop calculation on error; Posts aiDetect message to worker with ImageBitmap transferable</done>
</task>

<task type="auto">
<name>Wave 1.2: Create useToast.ts composable</name>
<files>app/composables/useToast.ts</files>
<action>
Create `app/composables/useToast.ts` with:

- `Toast` interface: `{ id: number, message: string, type: 'info' | 'success' | 'error' }`
- `toasts` ref array (SSR-safe: initialized as empty array)
- `showToast(message: string, type?: 'info' | 'success' | 'error', duration?: number)` function that:
  - Generates unique id (Date.now() + Math.random())
  - Appends to toasts array
  - Sets timeout to remove after duration (default 3000ms)
- `showFallbackToast()` convenience function that calls showToast('Center crop applied', 'info')
- `showFailureToast()` convenience function that calls showToast('Detection unavailable', 'error')
- SSR-safe with early return pattern
</action>
<verify>
<automated>
grep -l "showFallbackToast" app/composables/useToast.ts
grep -l "showFailureToast" app/composables/useToast.ts
grep -l "toasts" app/composables/useToast.ts
grep -c "3000" app/composables/useToast.ts
</verify>
<done>
useToast.ts exports toasts ref array and helper functions; showToast defaults to 3000ms duration; showFallbackToast shows "Center crop applied"; showFailureToast shows "Detection unavailable"; SSR-safe early return pattern</done>
</task>

<task type="auto">
<name>Wave 1.3: Extend worker with aiDetect message protocol</name>
<files>app/workers/image-processor.worker.ts</files>
<action>
Read `app/workers/image-processor.worker.ts` first. Add `'aiDetect'` case to the existing switch statement:

```
case 'aiDetect': {
  const { bitmap, targetWidth, targetHeight } = event.data.payload
  try {
    // Load Smartcrop.js if not already loaded in worker
    if (typeof (self as any).smartcrop === 'undefined') {
      importScripts('https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js')
    }
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const result = await (self as any).smartcrop.crop(canvas, {
      width: targetWidth,
      height: targetHeight,
      ruleOfThirds: true,
    })
    self.postMessage({ type: 'aiDetectResult', payload: { success: true, crop: result.topCrop } })
  } catch (err) {
    self.postMessage({ type: 'aiDetectResult', payload: { success: false, error: String(err) } })
  }
  break
}
```

CDN URL uses `smartcrop@2.0.5` (corrected from smartcropjs). Worker must call bitmap.close() after drawImage to release GPU memory. Uses OffscreenCanvas for rendering.
</action>
<verify>
<automated>
grep -l "case 'aiDetect'" app/workers/image-processor.worker.ts
grep -l "aiDetectResult" app/workers/image-processor.worker.ts
grep -l "importScripts" app/workers/image-processor.worker.ts
grep -l "bitmap.close" app/workers/image-processor.worker.ts
grep -l "OffscreenCanvas" app/workers/image-processor.worker.ts
</verify>
<done>
Worker accepts aiDetect message type; Worker responds with aiDetectResult message type; aiDetectResult payload: { success: boolean, crop?: { x, y, width, height }, error?: string }; ImageBitmap transferred via transferables (not cloned); Worker calls bitmap.close() after drawImage; Smartcrop.js loaded via importScripts with correct CDN URL (smartcrop@2.0.5)</done>
</task>

</tasks>

<tasks>

<task type="auto">
<name>Wave 2.1: Create AutoCropButton.vue component</name>
<files>app/components/AutoCropButton.vue</files>
<action>
Create `app/components/AutoCropButton.vue` based on IconButton.vue pattern:

- Add `sparkles` SVG icon (inline, viewBox 0 0 24 24, magic wand with stars pattern from UI-SPEC)
- Props interface: `{ size?: 'sm' | 'md' | 'lg', disabled?: boolean, isProcessing?: boolean }`
- Default size: 'lg' (44px)
- Template: renders IconButton with sparkles icon when not processing, CSS spinner when processing
- Spinner: 16px circle, 2px border, border-top-color: var(--accent), animation: spin 800ms ease-in-out infinite
- When isProcessing=true: aria-label="Detecting subject...", button text shows "Detecting subject...", button disabled
- When isProcessing=false: aria-label="Auto crop", button text shows "Auto crop"
- Button emits `click` event when clicked (if not disabled and not processing)
- Accent color (#3b82f6 light / #60a5fa dark) used exclusively for this button per UI-SPEC
</action>
<verify>
<automated>
grep -l "sparkles" app/components/AutoCropButton.vue
grep -l "Detecting subject" app/components/AutoCropButton.vue
grep -l "isProcessing" app/components/AutoCropButton.vue
grep -l "var(--accent)" app/components/AutoCropButton.vue
</verify>
<done>
AutoCropButton.vue extends IconButton.vue with sparkles SVG icon; Size lg (44px); Label "Auto crop"; Props: isProcessing boolean controls loading state (spinner + "Detecting subject..." label); Button disabled when isProcessing=true; Accent color reserved exclusively for this button</done>
</task>

<task type="auto">
<name>Wave 2.2: Create ToastNotification.vue component</name>
<files>app/components/ToastNotification.vue</files>
<action>
Create `app/components/ToastNotification.vue`:

- Uses `useToast()` composable to get active toasts array
- Position: fixed, bottom: 24px, left: 50%, transform: translateX(-50%), z-index: 9999
- Container: flex column with gap for multiple toasts
- Each toast: flex row, align-items: center, gap: 8px
- Toast styling: background: rgba(0, 0, 0, 0.75), color: white, border-radius: 6px, padding: 8px 16px
- Type-specific styling via CSS class: toast--info (blue accent), toast--success (green), toast--error (red accent)
- v-for over toasts with :key="toast.id"
- Transition: fade in/out with 200ms duration
- Shows only when toasts.length > 0
</action>
<verify>
<automated>
grep -l "ToastNotification" app/components/ToastNotification.vue
grep -l "useToast" app/components/ToastNotification.vue
grep -l "toasts.length" app/components/ToastNotification.vue
grep -l "bottom: 24px" app/components/ToastNotification.vue
</verify>
<done>
ToastNotification.vue fixed at bottom-center of viewport; Shows all active toasts from useToast composable; Auto-dismiss after 3000ms (handled by useToast); Type styling: info/success/error with appropriate colors; Fade transition for enter/leave</done>
</task>

</tasks>

<tasks>

<task type="auto">
<name>Wave 3.1: Integrate auto crop into CropWorkspace.vue</name>
<files>app/components/CropWorkspace.vue</files>
<action>
Read `app/components/CropWorkspace.vue` first. Then modify:

1. Import AutoCropButton and ToastNotification components
2. Import useSmartcrop (detectCrop) and useToast (showFallbackToast, showFailureToast)
3. Add `isAiProcessing` ref initialized to false
4. Replace the existing auto crop stub button with `<AutoCropButton :isProcessing="isAiProcessing" @click="onAutoCrop" />`
5. Implement `onAutoCrop()` async function:
   - Set isAiProcessing = true
   - Call detectCrop with selectedImage.blobUrl, cropWidth.value, cropHeight.value
   - On success: update cropX/Y/Width/Height refs with detected values, call showFallbackToast()
   - On failure: call showFailureToast(), call centerCrop() from useCropWindow
   - Set isAiProcessing = false in finally block
6. Add keyboard shortcut listener in onMounted/onUnmounted:
   - Listen for 'keydown' on window
   - Check event.key === 'A' (uppercase) and no input/textarea is focused
   - Call onAutoCrop()
7. Add `<ToastNotification />` to template (usually at end of template)
8. Remove any placeholder like alert('AI cropping coming in Phase 3')
</action>
<verify>
<automated>
grep -l "AutoCropButton" app/components/CropWorkspace.vue
grep -l "ToastNotification" app/components/CropWorkspace.vue
grep -l "onAutoCrop" app/components/CropWorkspace.vue
grep -l "isAiProcessing" app/components/CropWorkspace.vue
grep -l "detectCrop" app/components/CropWorkspace.vue
</verify>
<done>
AutoCropButton replaces existing stub button; Clicking AutoCropButton calls detectCrop with current image and crop dimensions; Crop window repositions to detected focal point via ref updates; On AI failure: shows toast and applies center-crop; Keyboard shortcut 'A' triggers auto-crop when workspace focused; ToastNotification mounted in template</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→CDN | Untrusted network request loads Smartcrop.js library |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Tampering | Smartcrop.js CDN | mitigate | Pin to exact version `smartcrop@2.0.5`; integrity hash check if available |
| T-03-02 | Denial of Service | AI detection | accept | Center-crop fallback ensures functionality even if AI fails |
| T-03-03 | Information Disclosure | Worker messages | accept | ImageBitmap transferred, not cloned; bitmap.close() releases memory properly |
</threat_model>

<verification>
## Phase-Level Verification

1. "Auto crop" button visible in CropWorkspace toolbar with sparkles icon
2. Clicking "Auto crop" triggers Smartcrop.js CDN load (first time) and AI detection
3. Crop window repositions to detected focal point on success
4. "Detection unavailable" toast appears when AI fails
5. "Center crop applied" toast appears when fallback is used
6. Keyboard shortcut 'A' triggers auto-crop when no input focused
7. Button shows spinner and "Detecting subject..." during processing
</verification>

<success_criteria>
1. User can click "Auto crop" button and see crop window automatically positioned
2. Smartcrop.js loads from CDN on first auto-crop use (check Network tab)
3. AI processing does not freeze UI (worker runs off-thread)
4. If AI detection fails, center-crop is applied and toast shows "Detection unavailable"
5. If AI succeeds, toast shows "Center crop applied"
6. Keyboard shortcut 'A' works when crop workspace is focused
</success_criteria>

<output>
Create `.planning/phases/03-ai-detection/03-SUMMARY.md` when done
</output>
