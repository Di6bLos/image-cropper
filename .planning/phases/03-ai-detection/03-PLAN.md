---
phase: 3
slug: 03-ai-detection
status: draft
type: execute
plan: '03'
wave: 1
depends_on: []
autonomous: false
created: 2026-07-17
requirements:
  - AIDT-01
  - AIDT-02
  - AIDT-03
  - AIDT-04
  - AIDT-05
files_modified:
  - app/composables/useSmartcrop.ts
  - app/composables/useToast.ts
  - workers/image-processor.worker.ts
  - app/components/AutoCropButton.vue
  - app/components/ToastNotification.vue
  - app/components/CropWorkspace.vue
must_haves:
  truths:
    - Auto crop button triggers AI subject detection on selected image
    - Smartcrop.js is lazy-loaded from CDN on first use (not bundled)
    - Detected focal point automatically positions the crop window
    - If AI detection fails or is unavailable, center-crop is used as fallback
    - AI processing runs in Web Worker (off main thread) with no UI freeze
  artifacts:
    - app/composables/useSmartcrop.ts
    - app/composables/useToast.ts
    - app/components/AutoCropButton.vue
    - app/components/ToastNotification.vue
  key_links:
    - from: app/composables/useSmartcrop.ts
      to: workers/image-processor.worker.ts
      via: worker.postMessage({type:'aiDetect', payload:{bitmap,targetWidth,targetHeight}, transferables:[bitmap]})
    - from: workers/image-processor.worker.ts
      to: app/composables/useSmartcrop.ts
      via: self.postMessage({type:'aiDetectResult', payload:{success, crop, error}})
---

# Phase 3: AI Detection - Plan

## Overview

Integrates Smartcrop.js for AI-powered subject detection that automatically positions the crop window. Smartcrop.js runs content-aware cropping analysis (edge detection, skin-tone, saturation) to find optimal focal points. The library is lazy-loaded from CDN on first use, not bundled. AI processing runs in a dedicated Web Worker to prevent UI freezes. If AI fails, center-crop is used as fallback.

## Success Criteria

1. "Auto crop" button triggers AI subject detection on selected image
2. Smartcrop.js is lazy-loaded from CDN on first use (not bundled)
3. Detected focal point automatically positions the crop window
4. If AI detection fails or is unavailable, center-crop is used as fallback
5. AI processing runs in Web Worker (off main thread) with no UI freeze

## Waves

### Wave 1: Foundation (Composables + Worker Protocol)
Parallel creation of: `useSmartcrop.ts`, `useToast.ts`, worker message protocol

### Wave 2: UI Components
After Wave 1: `AutoCropButton.vue`, `ToastNotification.vue`

### Wave 3: Integration
After Wave 2: `CropWorkspace.vue` integration, worker `aiDetect` case

---

## Wave 1 Tasks

<task type="auto">
<name>useSmartcrop.ts - AI Detection Composable</name>
<read_first>
- app/composables/useImageWorker.ts (worker lifecycle pattern)
- app/composables/useCropWindow.ts (setCrop, centerCrop methods)
- app/stores/useImageStore.ts (selectedImage with blobUrl, originalWidth, originalHeight)
- .planning/phases/03-ai-detection/03-RESEARCH.md (Pattern 1, 2, 4 from research)
</read_first>
<action>
Create `app/composables/useSmartcrop.ts` with:
- Smartcrop.js type declaration for `Window.smartcrop`
- `loadSmartcropFromCDN()` singleton loader using `document.createElement('script')` pattern
- CDN URL: `https://cdn.jsdelivr.net/npm/smartcropjs@2.0.5/smartcrop.min.js` (pinned version)
- `calculateCenterCrop(imageWidth, imageHeight, targetWidth, targetHeight)` function
- `detectCrop(imageUrl, targetWidth, targetHeight)` async function that:
  1. Loads Smartcrop.js from CDN if not already loaded
  2. Creates ImageBitmap from imageUrl
  3. Transfers to worker for AI detection
  4. Falls back to center-crop on error
  5. Returns `{ x, y, width, height }`
- SSR-safe with early return pattern

key_links:
- to: workers/image-processor.worker.ts (via postMessage with aiDetect type)
</action>
<acceptance_criteria>
- `useSmartcrop.ts` exports `detectCrop(imageUrl, targetWidth, targetHeight)` async function
- `loadSmartcropFromCDN()` function uses dynamic script injection with singleton caching
- CDN URL: `https://cdn.jsdelivr.net/npm/smartcropjs@2.0.5/smartcrop.min.js` (pinned for stability)
- Falls back to center-crop calculation when AI fails
- Returns `{ x, y, width, height }` in image pixel coordinates
- SSR-safe with early return pattern
- Posts `aiDetect` message to worker with ImageBitmap transferable
</acceptance_criteria>
<verify>
<automated>
- grep -l "loadSmartcropFromCDN" app/composables/useSmartcrop.ts
- grep -l "aiDetect" app/composables/useSmartcrop.ts
- grep -l "transferables" app/composables/useSmartcrop.ts
</automated>
</verify>
</task>

<task type="auto">
<name>useToast.ts - Toast Notification Composable</name>
<read_first>
- app/assets/sass/_variables.scss (design tokens)
- .planning/phases/03-ai-detection/03-UI-SPEC.md (toast position: bottom-center, duration: 3000ms)
</read_first>
<action>
Create `app/composables/useToast.ts` with:
- `Toast` interface with `{ message: string, type: 'info' | 'success' | 'error', id: number }`
- `toasts` ref array (SSR-safe: initialized as empty array)
- `showToast(message, type?)` function that:
  - Generates unique id
  - Appends to toasts array
  - Sets timeout to remove after duration (default 3000ms)
- `showFallbackToast()` convenience function
- `showFailureToast()` convenience function
</action>
<acceptance_criteria>
- `useToast.ts` exports toast state array and helper functions
- `showToast(message, type?)` function adds toast with auto-dismiss
- `showFallbackToast()` shows "Center crop applied"
- `showFailureToast()` shows "Detection unavailable"
- Toast duration defaults to 3000ms
- SSR-safe with early return pattern
</acceptance_criteria>
<verify>
<automated>
- grep -l "showFallbackToast" app/composables/useToast.ts
- grep -l "showFailureToast" app/composables/useToast.ts
- grep -l "toasts" app/composables/useToast.ts
</automated>
</verify>
</task>

<task type="auto">
<name>Worker Message Protocol Extension</name>
<read_first>
- workers/image-processor.worker.ts (existing worker pattern)
- app/composables/useImageWorker.ts (postMessage signature)
- .planning/phases/03-ai-detection/03-RESEARCH.md (Pattern 2: AIDetectMessage interface)
</read_first>
<action>
Add to `workers/image-processor.worker.ts`:
- Case `'aiDetect'` in switch statement
- Extract `bitmap`, `targetWidth`, `targetHeight` from `event.data.payload`
- Load Smartcrop.js via `importScripts('https://cdn.jsdelivr.net/npm/smartcropjs@2.0.5/smartcrop.min.js')`
- Create OffscreenCanvas, drawImage bitmap, call bitmap.close()
- Run Smartcrop analysis: `smartcrop.crop(canvas, { width: targetWidth, height: targetHeight, ruleOfThirds: true })`
- Return `aiDetectResult` with `{ success: true, crop: result.topCrop }`
- Catch errors and return `{ success: false, error: String(err) }`

key_links:
- from: workers/image-processor.worker.ts
  to: app/composables/useSmartcrop.ts
  via: self.postMessage({type:'aiDetectResult', payload:{success, crop, error}})
</action>
<acceptance_criteria>
- Worker accepts `aiDetect` message type
- Worker responds with `aiDetectResult` message type
- AIDetectResult payload: `{ success: boolean, crop?: { x, y, width, height }, error?: string }`
- ImageBitmap is transferred via transferables array (not cloned)
- Worker calls `bitmap.close()` after drawImage to release GPU memory
- Smartcrop.js loaded via importScripts in worker
</acceptance_criteria>
<verify>
<automated>
- grep -l "aiDetect" workers/image-processor.worker.ts
- grep -l "aiDetectResult" workers/image-processor.worker.ts
- grep -l "importScripts" workers/image-processor.worker.ts
- grep -l "bitmap.close" workers/image-processor.worker.ts
</automated>
</verify>
</task>

---

## Wave 2 Tasks

<task type="auto">
<name>AutoCropButton.vue Component</name>
<read_first>
- app/components/IconButton.vue (existing button pattern with icon SVG slots)
- app/assets/sass/_variables.scss (--accent: #3b82f6 light, #60a5fa dark)
- .planning/phases/03-ai-detection/03-UI-SPEC.md (sparkles icon, lg size 44px, "Auto crop" label)
</read_first>
<action>
Create `app/components/AutoCropButton.vue`:
- Add `sparkles` SVG icon (inline, viewBox 0 0 24 24, magic wand with stars pattern)
- Props: `size` (default 'lg'), `disabled` (default false), `isProcessing` (default false)
- Template: renders IconButton with sparkles icon when not processing, spinner when processing
- Spinner: 16px circle, 2px border, border-top-color: var(--accent), animation: spin 800ms ease-in-out infinite
- When processing: aria-label="Detecting subject...", label shows "Detecting subject..."
- Not processing: aria-label="Auto crop", label shows "Auto crop"
</action>
<acceptance_criteria>
- Extends IconButton.vue with `icon="sparkles"` SVG
- Size: lg (44px)
- Label: "Auto crop"
- Props: `isProcessing` (boolean) controls loading state
- When `isProcessing=true`: shows CSS spinner (border-top-color: var(--accent)), label shows "Detecting subject..."
- Button disabled when `isProcessing=true` or `disabled=true`
- Emits `click` event when button clicked (if not disabled/processing)
- Accent color reserved exclusively per UI-SPEC
</acceptance_criteria>
<verify>
<automated>
- grep -l "sparkles" app/components/AutoCropButton.vue
- grep -l "Detecting subject" app/components/AutoCropButton.vue
- grep -l "isProcessing" app/components/AutoCropButton.vue
</automated>
</verify>
</task>

<task type="auto">
<name>ToastNotification.vue Component</name>
<read_first>
- app/assets/sass/_variables.scss (design tokens)
- app/assets/sass/main.scss (spacing scale: xs=4px, sm=8px)
- app/composables/useToast.ts (toasts ref structure)
- .planning/phases/03-ai-detection/03-UI-SPEC.md (toast: bottom-center, 3000ms, rounded 6px)
</read_first>
<action>
Create `app/components/ToastNotification.vue`:
- Uses `useToast()` composable to get active toasts
- Position: fixed, bottom: 24px, left: 50%, transform: translateX(-50%)
- Z-index: 9999
- Each toast: flex container with message text and optional close button
- v-for over toasts with :key="toast.id"
- Type styling via CSS class: toast--info, toast--success, toast--error
- Appears with v-if="toasts.length > 0"
</action>
<acceptance_criteria>
- Fixed position at bottom-center of crop workspace
- Background: rgba(0, 0, 0, 0.75), white text
- Border-radius: 6px
- Padding: 8px 16px
- Auto-dismiss after 3000ms (handled by useToast)
- Shows all active toasts from useToast composable
- Type styling: info (blue accent), success (green), error (red)
</acceptance_criteria>
<verify>
<automated>
- grep -l "ToastNotification" app/components/ToastNotification.vue
- grep -l "useToast" app/components/ToastNotification.vue
- grep -l "toasts.length" app/components/ToastNotification.vue
</automated>
</verify>
</task>

---

## Wave 3 Tasks

<task type="auto">
<name>CropWorkspace.vue Integration</name>
<read_first>
- app/components/CropWorkspace.vue (existing workspace with onAutoCrop placeholder)
- app/components/AutoCropButton.vue (new component from Wave 2)
- app/components/ToastNotification.vue (new component from Wave 2)
- app/composables/useSmartcrop.ts (detectCrop function)
- app/composables/useToast.ts (showFallbackToast, showFailureToast)
</read_first>
<action>
Modify `CropWorkspace.vue`:
1. Import AutoCropButton, ToastNotification
2. Import useSmartcrop (detectCrop) and useToast (showFallbackToast, showFailureToast)
3. Add `isAiProcessing` ref (default false)
4. Replace `<button class="crop-workspace__action-btn">` with `<AutoCropButton :isProcessing="isAiProcessing" @click="onAutoCrop" />`
5. Update `onAutoCrop()` function to:
   - Set isAiProcessing = true
   - Call detectCrop with selectedImage.blobUrl and cropWidth/Height
   - On success: call cropX/Y/Width/Height refs with detected values
   - On failure: call showFailureToast() and apply center-crop to refs
   - Set isAiProcessing = false in finally block
6. Add keyboard shortcut listener in onMounted:
   - Listen for 'A' key (uppercase only)
   - Only trigger if no input focused
   - Call onAutoCrop()
7. Add `<ToastNotification />` to template
8. Replace alert('AI cropping coming in Phase 3') with real implementation
</action>
<acceptance_criteria>
- Auto Crop button replaced with AutoCropButton component
- Clicking AutoCropButton calls detectCrop with current image and crop dimensions
- Crop window repositions to detected focal point via setCrop
- On AI failure: shows toast and applies center-crop
- Keyboard shortcut 'A' triggers auto-crop when workspace focused
- isProcessing state passed to AutoCropButton
- ToastNotification mounted in template
</acceptance_criteria>
<verify>
<automated>
- grep -l "AutoCropButton" app/components/CropWorkspace.vue
- grep -l "ToastNotification" app/components/CropWorkspace.vue
- grep -l "onAutoCrop" app/components/CropWorkspace.vue
- grep -l "isAiProcessing" app/components/CropWorkspace.vue
</automated>
</verify>
</task>

<task type="auto">
<name>Worker aiDetect Case Implementation</name>
<read_first>
- workers/image-processor.worker.ts (structure with switch statement)
- .planning/phases/03-ai-detection/03-RESEARCH.md (Pattern 2: worker protocol)
</read_first>
<action>
Add `'aiDetect'` case to worker switch statement:
```
case 'aiDetect': {
  const { bitmap, targetWidth, targetHeight } = event.data.payload
  try {
    // Load Smartcrop.js if not already loaded in worker
    if (typeof (self as any).smartcrop === 'undefined') {
      importScripts('https://cdn.jsdelivr.net/npm/smartcropjs@2.0.5/smartcrop.min.js')
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
</action>
<acceptance_criteria>
- Worker receives `aiDetect` message with `{ bitmap: ImageBitmap, targetWidth: number, targetHeight: number }`
- Smartcrop.js loaded via importScripts in worker
- OffscreenCanvas used for drawing ImageBitmap
- bitmap.close() called after drawImage
- Result returned as `{ type: 'aiDetectResult', payload: { success: boolean, crop?: CropResult, error?: string } }`
- Handles errors gracefully with error message in payload
</acceptance_criteria>
<verify>
<automated>
- grep -l "case 'aiDetect'" workers/image-processor.worker.ts
- grep -l "OffscreenCanvas" workers/image-processor.worker.ts
- grep -l "smartcrop.crop" workers/image-processor.worker.ts
</automated>
</verify>
</task>

---

## Files Modified/Created

| File | Action | Wave |
|------|--------|------|
| app/composables/useSmartcrop.ts | CREATED | 1 |
| app/composables/useToast.ts | CREATED | 1 |
| workers/image-processor.worker.ts | MODIFIED | 1 |
| app/components/AutoCropButton.vue | CREATED | 2 |
| app/components/ToastNotification.vue | CREATED | 2 |
| app/components/CropWorkspace.vue | MODIFIED | 3 |

---

## Dependencies

- Phase 2 (Core Cropping) completed
- Uses Phase 1 worker infrastructure (useImageWorker, image-processor.worker.ts)
- Uses Phase 2 UI components (IconButton, CropOverlay)
