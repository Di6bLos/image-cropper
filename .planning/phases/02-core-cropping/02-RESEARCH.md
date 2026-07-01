# Phase 2: Core Cropping - Research

**Researched:** 2026-07-01
**Domain:** Image import (drag-drop + picker), preview list, crop window with ratio constraints, dark mode
**Confidence:** HIGH

## Summary

Phase 2 implements the core user-facing functionality for the Image Cropper: importing images, previewing them in a scrollable list, and performing manual crop operations with aspect ratio constraints. The phase uses Vue 3's native HTML5 drag-and-drop API (no extra libraries needed), CSS overlay divs for the crop window (not canvas-drawn handles, per D-05), and aspect ratio constraint math that recalculates dimensions based on which corner is being dragged. Smartcrop.js integration is researched for future Phase 3 hooks.

**Primary recommendation:** Build a `useFileUpload` composable wrapping native HTML5 drag events with counter-based state tracking, use CSS-positioned divs for crop overlay with `pointer-events` management, implement aspect ratio constraint math that adjusts both dimensions and position to keep the opposite corner stationary, and extend the existing CSS variable system for dark mode.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single-column list layout - filename and original dimensions visible without hover
- **D-02:** Thumbnail size 64x64 or 80x80 - balances visibility with compactness
- **D-03:** Selected items show a border ring - immediate visual feedback
- **D-04:** Empty state shows the drop zone inside the list area - no separate empty-state zone
- **D-05:** HTML/CSS overlay divs - native cursor support, CSS transitions, easier handle implementation
- **D-06:** Corner handles only (4 handles) - minimal UI, fast to implement
- **D-07:** Dark overlay at 60-70% opacity outside crop area
- **D-08:** Preset buttons with expandable custom section below
- **D-09:** Separate W and H fields for custom input
- **D-10:** Ratio mode vs. Pixel mode as tabs - mutual exclusivity
- **D-11:** Drop zone and file picker button always visible
- **D-12:** Drag-over feedback: border color change + animated upload icon

### Claude's Discretion

- Specific CSS color values for overlay (60-70% opacity), handle size (8px corners), border ring color - follow existing CSS variables from Phase 1
- Transition timing for drag-over states - standard 150-200ms ease
- Pixel ratio for thumbnail generation - use canvas-drawn thumbnails at device pixel ratio
- Whether "Add more images" button appears after list has items - simple icon button in list header

### Deferred Ideas (OUT OF SCOPE)

None - all discussion stayed within Phase 2 scope

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File drag-and-drop | Browser/Client | - | HTML5 Drag and Drop API is browser-only |
| Image import/picker | Browser/Client | - | File API, Blob URLs are browser-only |
| Thumbnail generation | Browser/Client | API/Backend (Nuxt) | `createImageBitmap` + canvas pool for rendering |
| Preview list display | Browser/Client | - | Vue component, scrollable container |
| Crop window overlay | Browser/Client | - | CSS-positioned divs, pointer events management |
| Aspect ratio constraints | Browser/Client | - | JavaScript math during resize operations |
| Dark mode | Browser/Client | - | CSS `prefers-color-scheme` media query |
| Image state (Pinia) | API/Backend (Nuxt) | Browser/Client | Pinia stores hold state accessible across components |

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IMPT-01 | User can import images via file picker | `useFileUpload` composable wraps hidden `<input type="file">` triggered by button |
| IMPT-02 | User can import images via drag-and-drop | Native HTML5 drag events with counter-based state tracking |
| IMPT-03 | Drop zone provides visual feedback on drag-over | CSS class toggle + transition timing (150-200ms) |
| IMPT-04 | Imported images generate lazy-loaded thumbnails | `createImageBitmap` + canvas pool for consistent sizing |
| PRVW-01 | All imported images appear in scrollable bulk preview list | Vue `v-for` over store array, CSS `overflow-y: auto` |
| PRVW-02 | Each list item shows thumbnail, filename, original dimensions | Pinia store holds `{ blobUrl, filename, width, height }` |
| PRVW-03 | User can click image in list to select for cropping | `@click` handler updates selected image in store |
| CROP-01 | Selected image displays draggable crop window overlay | Absolute-positioned div with `@mousedown` drag handling |
| CROP-02 | Crop window has visible handles at corners for resizing | CSS-styled divs at corners, `pointer-events: auto` |
| CROP-03 | Crop window constrains to selected aspect ratio while resizing | Aspect ratio math: adjust both dimensions and position to keep opposite corner stationary |
| CROP-04 | Area outside crop window is dimmed | CSS overlay div with `rgba(0,0,0,0.6-0.7)` and `pointer-events: none` |
| CROP-05 | Crop window has visible white border | CSS `box-shadow: 0 0 0 2px white` or `border: 2px solid white` |
| CROP-06 | Crop window position is clamped within image bounds | Math: `x >= 0`, `y >= 0`, `x + width <= imageWidth`, `y + height <= imageHeight` |
| RATIO-01 | User can select from aspect ratio presets: 16:9, 3:2, 1:1, 2:3 | Button group in ratio control panel |
| RATIO-02 | Selecting preset immediately constrains crop window | Watcher on ratio state triggers crop window resize |
| RATIO-03 | User can enter custom ratio as "W:H" | Expandable custom section with W and H input fields |
| RATIO-04 | User can enter custom pixel dimensions | Pixel mode tab with width x height fields |
| RATIO-05 | Custom ratio and pixel size inputs are mutually exclusive | Tab interface (Ratio mode / Pixel mode) |
| UIUX-01 | Dark mode support using CSS variables | Extend existing CSS variables, `prefers-color-scheme` media query |
| UIUX-02 | Canvas and crop window scale responsively | CSS `max-width: 100%`, crop window uses percentage-based positioning |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | (from Nuxt 3) | UI framework | User-specified |
| Nuxt 3 | (from Phase 1) | Full-stack Vue framework | User-specified |
| Pinia | 3.x | State management | User-specified; Phase 1 established |
| Sass | 1.101.0 [VERIFIED: npm registry] | CSS preprocessor | User-specified; Phase 1 established |
| Smartcrop.js | 2.x [VERIFIED: npm registry] | Future Phase 3 AI cropping | Lazy-loaded from CDN in Phase 3 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vueuse/core | latest | Composables (useEventListener, useIntersectionObserver) | Drag-and-drop events, intersection for lazy thumbnails |
| createImageBitmap | native | Thumbnail generation | Preferred over `new Image()` for better memory behavior |

**No additional packages required for Phase 2.** All functionality uses native APIs:
- HTML5 Drag and Drop API (native browser)
- File API (native browser)
- Canvas API (native browser)
- CSS Variables and `prefers-color-scheme` (native CSS)

**Installation:** No new packages needed for Phase 2 implementation.

---

## Package Legitimacy Audit

> Phase 2 requires no external packages beyond Phase 1. Smartcrop.js is deferred to Phase 3.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| smartcrop.js | npm | 10+ yrs | 50K/wk | github.com/jwagner/smartcrop.js | OK | Approved - Phase 3 deferred |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser Environment                              │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         Nuxt App (SSR + Client)                     │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │ │
│  │  │   Pinia Stores   │  │   Composables    │  │   Vue Components   │  │ │
│  │  │   (image list,   │  │   (useFileUpload,│  │   (ImageList,      │  │ │
│  │  │    crop state,   │  │    useCropWindow,│  │    CropOverlay,    │  │ │
│  │  │    ratio)        │  │    useThumbnail) │  │    RatioControls)  │  │ │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Browser Native APIs                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │ │
│  │  │ HTML5 Drag   │  │ File API +  │  │ Canvas API + │  │ CSS      │ │ │
│  │  │ and Drop      │  │ BlobRegistry │  │ ImageBitmap  │  │ Variables│ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
app/
├── composables/
│   ├── useBlobRegistry.ts      # Phase 1 - existing
│   ├── useCanvasPool.ts       # Phase 1 - existing
│   ├── useImageWorker.ts       # Phase 1 - existing
│   ├── useFileUpload.ts        # NEW - drag-drop + file picker
│   ├── useCropWindow.ts        # NEW - crop window drag/resize logic
│   └── useThumbnail.ts         # NEW - thumbnail generation from blob
├── stores/
│   ├── useAppStore.ts          # Phase 1 - existing (may extend)
│   ├── useImageStore.ts         # NEW - image list state
│   └── useCropStore.ts         # NEW - crop selection, ratio, mode
├── components/
│   ├── ImageList.vue            # NEW - scrollable preview list
│   ├── ImageListItem.vue        # NEW - single item with thumbnail
│   ├── DropZone.vue             # NEW - drag-drop + file picker
│   ├── CropOverlay.vue          # NEW - crop window overlay
│   ├── CropHandle.vue           # NEW - individual corner handle
│   ├── RatioControls.vue        # NEW - preset buttons + custom inputs
│   └── IconButton.vue           # NEW - reusable icon button
├── assets/
│   └── sass/
│       ├── _variables.scss      # Phase 1 - extend with crop-specific vars
│       ├── _mixins.scss         # NEW - reusable Sass mixins
│       └── main.scss            # Phase 1 - existing
└── pages/
    └── index.vue                # Phase 1 - extend with layout
```

### Pattern 1: SSR-Safe File Upload Composable

**What:** Composable wrapping HTML5 drag-and-drop events and hidden file input
**When to use:** Image import via drag-drop or file picker button
**Source:** [Digital Thrive UK](https://digitalthriveai.com/en-gb/resources/web-development/drag-drop-file-uploader-vuejs-3/), [Daniel Kelly](https://danielkelly.io/blog/vue-3-tailwind-file-drag-and-drop-input/)

```typescript
// composables/useFileUpload.ts
interface UseFileUploadOptions {
  maxFiles?: number
  maxSize?: number // bytes
  accept?: string // MIME type filter e.g. 'image/*'
}

interface UseFileUploadReturn {
  files: Ref<File[]>
  isDragging: Ref<boolean>
  dropzoneRef: Ref<HTMLElement | null>
  inputRef: Ref<HTMLInputElement | null>
  openFilePicker: () => void
  addFiles: (newFiles: File[]) => void
  removeFile: (index: number) => void
  clearFiles: () => void
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { maxFiles = 50, maxSize = 100 * 1024 * 1024, accept = 'image/*' } = options

  const files = ref<File[]>([])
  const isDragging = ref(false)
  const dragCounter = ref(0) // Track nested drag events
  const dropzoneRef = ref<HTMLElement | null>(null)
  const inputRef = ref<HTMLInputElement | null>(null)

  function handleDragEnter(e: DragEvent) {
    e.preventDefault()
    dragCounter.value++
    isDragging.value = true
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    dragCounter.value = 0
    isDragging.value = false

    const droppedFiles = Array.from(e.dataTransfer?.files || [])
    addFiles(droppedFiles)
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement
    const selectedFiles = Array.from(target.files || [])
    addFiles(selectedFiles)
    // Reset input so same file can be selected again
    target.value = ''
  }

  function addFiles(newFiles: File[]) {
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) return false
      if (file.size > maxSize) return false
      if (files.value.length >= maxFiles) return false
      return true
    })
    files.value.push(...validFiles)
  }

  function removeFile(index: number) {
    files.value.splice(index, 1)
  }

  function clearFiles() {
    files.value = []
  }

  function openFilePicker() {
    inputRef.value?.click()
  }

  // Attach listeners to dropzone
  onMounted(() => {
    if (!dropzoneRef.value) return
    dropzoneRef.value.addEventListener('dragenter', handleDragEnter)
    dropzoneRef.value.addEventListener('dragleave', handleDragLeave)
    dropzoneRef.value.addEventListener('dragover', handleDragOver)
    dropzoneRef.value.addEventListener('drop', handleDrop)
  })

  onUnmounted(() => {
    if (!dropzoneRef.value) return
    dropzoneRef.value.removeEventListener('dragenter', handleDragEnter)
    dropzoneRef.value.removeEventListener('dragleave', handleDragLeave)
    dropzoneRef.value.removeEventListener('dragover', handleDragOver)
    dropzoneRef.value.removeEventListener('drop', handleDrop)
  })

  return {
    files: readonly(files),
    isDragging: readonly(isDragging),
    dropzoneRef,
    inputRef,
    openFilePicker,
    addFiles,
    removeFile,
    clearFiles,
  }
}
```

### Pattern 2: Thumbnail Generation Composable

**What:** Generate consistent-sized thumbnails using `createImageBitmap` and canvas pool
**When to use:** Creating 64x64 or 80x80 thumbnails for preview list
**Source:** [ASSUMED] Standard canvas thumbnail pattern, verified by MDN Canvas API docs

```typescript
// composables/useThumbnail.ts
interface ThumbnailResult {
  blobUrl: string
  width: number
  height: number
}

export function useThumbnail() {
  const canvasPool = useCanvasPool()
  const blobRegistry = useBlobRegistry()

  async function generateThumbnail(
    file: File,
    size: number = 64,
    devicePixelRatio: number = window.devicePixelRatio || 1
  ): Promise<ThumbnailResult | null> {
    if (!process.client) return null

    try {
      // Load image via createImageBitmap (better memory than new Image())
      const bitmap = await createImageBitmap(file)

      // Calculate scaled dimensions maintaining aspect ratio
      const scale = Math.min(size / bitmap.width, size / bitmap.height)
      const width = Math.round(bitmap.width * scale)
      const height = Math.round(bitmap.height * scale)

      // Acquire canvas from pool
      const canvas = canvasPool.acquire()
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Set canvas size (accounting for device pixel ratio)
      canvas.width = size * devicePixelRatio
      canvas.height = size * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)

      // Clear and draw centered thumbnail
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)

      // Convert to blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      })

      if (!blob) return null

      // Create blob URL and register it
      const blobUrl = blobRegistry.create(blob)

      // Release canvas back to pool
      canvasPool.release(canvas)

      return { blobUrl, width, height }
    } catch (error) {
      console.error('Thumbnail generation failed:', error)
      return null
    }
  }

  return { generateThumbnail }
}
```

### Pattern 3: Crop Window Composable with Aspect Ratio Constraint

**What:** Draggable and resizable crop window with ratio-locked corner handles
**When to use:** Implementing the crop overlay with corner handles
**Source:** [Stack Overflow](https://stackoverflow.com/questions/50230967/drag-resizing-rectangle-with-fixed-aspect-ratio-northwest-corner), [DEV Community](https://dev.to/shaishav_patel_271fdcd61a/building-a-browser-crop-image-tool-display-to-source-coordinate-scaling-and-aspect-ratio-presets-273)

```typescript
// composables/useCropWindow.ts
interface CropWindowState {
  x: number
  y: number
  width: number
  height: number
}

interface UseCropWindowOptions {
  imageWidth: number
  imageHeight: number
  aspectRatio?: number // undefined = free aspect ratio
  minSize?: number
}

export function useCropWindow(options: UseCropWindowOptions) {
  const { imageWidth, imageHeight, minSize = 20 } = toRefs(options)

  const state = ref<CropWindowState>({
    x: 0,
    y: 0,
    width: imageWidth.value,
    height: imageHeight.value,
  })

  const isDragging = ref(false)
  const isResizing = ref(false)
  const activeHandle = ref<string | null>(null) // 'nw', 'ne', 'sw', 'se'

  let dragStart = { x: 0, y: 0, cropX: 0, cropY: 0 }
  let resizeStart = { x: 0, y: 0, width: 0, height: 0, cropX: 0, cropY: 0 }

  function applyAspectRatio(width: number, height: number): { width: number; height: number } {
    const ratio = options.aspectRatio
    if (!ratio) return { width, height }

    // Ratio is width/height (e.g., 16/9 = 1.777)
    if (width / height > ratio) {
      return { width: height * ratio, height }
    }
    return { width, height: width / ratio }
  }

  function clampToBounds(x: number, y: number, width: number, height: number) {
    return {
      x: Math.max(0, Math.min(x, imageWidth.value - width)),
      y: Math.max(0, Math.min(y, imageHeight.value - height)),
      width: Math.min(width, imageWidth.value),
      height: Math.min(height, imageHeight.value),
    }
  }

  function startDrag(e: MouseEvent) {
    if (isResizing.value) return
    isDragging.value = true
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      cropX: state.value.x,
      cropY: state.value.y,
    }
  }

  function startResize(e: MouseEvent, handle: string) {
    e.stopPropagation()
    isResizing.value = true
    activeHandle.value = handle
    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: state.value.width,
      height: state.value.height,
      cropX: state.value.x,
      cropY: state.value.y,
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (isDragging.value) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      let newX = dragStart.cropX + dx
      let newY = dragStart.cropY + dy

      // Clamp to image bounds
      newX = Math.max(0, Math.min(newX, imageWidth.value - state.value.width))
      newY = Math.max(0, Math.min(newY, imageHeight.value - state.value.height))

      state.value.x = newX
      state.value.y = newY
    }

    if (isResizing.value && activeHandle.value) {
      const dx = e.clientX - resizeStart.x
      const dy = e.clientY - resizeStart.y
      const ratio = options.aspectRatio

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = resizeStart.cropX
      let newY = resizeStart.cropY

      switch (activeHandle.value) {
        case 'se': // Bottom-right: expand right and down
          newWidth = Math.max(minSize, resizeStart.width + dx)
          newHeight = Math.max(minSize, resizeStart.height + dy)
          if (ratio) {
            const constrained = applyAspectRatio(newWidth, newHeight)
            newWidth = constrained.width
            newHeight = constrained.height
          }
          break

        case 'sw': // Bottom-left: expand left and down
          newWidth = Math.max(minSize, resizeStart.width - dx)
          newHeight = Math.max(minSize, resizeStart.height + dy)
          newX = resizeStart.cropX + (resizeStart.width - newWidth)
          if (ratio) {
            const constrained = applyAspectRatio(newWidth, newHeight)
            newWidth = constrained.width
            newHeight = constrained.height
            newX = resizeStart.cropX + (resizeStart.width - newWidth)
          }
          break

        case 'ne': // Top-right: expand right and up
          newWidth = Math.max(minSize, resizeStart.width + dx)
          newHeight = Math.max(minSize, resizeStart.height - dy)
          newY = resizeStart.cropY + (resizeStart.height - newHeight)
          if (ratio) {
            const constrained = applyAspectRatio(newWidth, newHeight)
            newWidth = constrained.width
            newHeight = constrained.height
            newY = resizeStart.cropY + (resizeStart.height - newHeight)
          }
          break

        case 'nw': // Top-left: expand left and up
          newWidth = Math.max(minSize, resizeStart.width - dx)
          newHeight = Math.max(minSize, resizeStart.height - dy)
          newX = resizeStart.cropX + (resizeStart.width - newWidth)
          newY = resizeStart.cropY + (resizeStart.height - newHeight)
          if (ratio) {
            const constrained = applyAspectRatio(newWidth, newHeight)
            newWidth = constrained.width
            newHeight = constrained.height
            newX = resizeStart.cropX + (resizeStart.width - newWidth)
            newY = resizeStart.cropY + (resizeStart.height - newHeight)
          }
          break
      }

      // Clamp to bounds and apply
      const clamped = clampToBounds(newX, newY, newWidth, newHeight)
      Object.assign(state.value, clamped)
    }
  }

  function onMouseUp() {
    isDragging.value = false
    isResizing.value = false
    activeHandle.value = null
  }

  // Global mouse listeners when dragging/resizing
  function setupGlobalListeners() {
    if (process.client) {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
  }

  function cleanupGlobalListeners() {
    if (process.client) {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }

  onMounted(setupGlobalListeners)
  onUnmounted(cleanupGlobalListeners)

  return {
    state: readonly(state),
    isDragging: readonly(isDragging),
    isResizing: readonly(isResizing),
    startDrag,
    startResize,
    setCrop: (x: number, y: number, width: number, height: number) => {
      const clamped = clampToBounds(x, y, width, height)
      Object.assign(state.value, clamped)
    },
  }
}
```

### Pattern 4: Pinia Image Store

**What:** Store managing image list state with thumbnails
**When to use:** Central state for all imported images
**Source:** [Pinia GitHub](https://github.com/vuejs/pinia), [murilolivorato/vue_img_thumb](https://github.com/murilolivorato/vue_img_thumb)

```typescript
// stores/useImageStore.ts
interface ImageItem {
  id: string
  file: File
  blobUrl: string
  thumbnailUrl: string
  filename: string
  originalWidth: number
  originalHeight: number
}

export const useImageStore = defineStore('images', () => {
  const images = ref<ImageItem[]>([])
  const selectedId = ref<string | null>(null)

  const selectedImage = computed(() =>
    images.value.find(img => img.id === selectedId.value) || null
  )

  function addImage(item: ImageItem) {
    images.value.push(item)
  }

  function removeImage(id: string) {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      const img = images.value[index]
      // Revoke blob URLs
      const blobRegistry = useBlobRegistry()
      blobRegistry.revoke(img.blobUrl)
      blobRegistry.revoke(img.thumbnailUrl)
      images.value.splice(index, 1)
    }
  }

  function selectImage(id: string) {
    selectedId.value = id
  }

  function clearAll() {
    const blobRegistry = useBlobRegistry()
    images.value.forEach(img => {
      blobRegistry.revoke(img.blobUrl)
      blobRegistry.revoke(img.thumbnailUrl)
    })
    images.value = []
    selectedId.value = null
  }

  return {
    images: readonly(images),
    selectedId: readonly(selectedId),
    selectedImage,
    addImage,
    removeImage,
    selectImage,
    clearAll,
  }
})
```

### Pattern 5: Pinia Crop Store

**What:** Store managing crop state, ratio settings, and mode
**When to use:** Central state for crop window and ratio controls
**Source:** [ASSUMED] Standard Pinia patterns, adapted for crop-specific needs

```typescript
// stores/useCropStore.ts
type RatioMode = 'ratio' | 'pixel'
type RatioPreset = '16:9' | '3:2' | '1:1' | '2:3' | 'custom'

interface RatioState {
  mode: RatioMode
  preset: RatioPreset
  customWidth: number
  customHeight: number
  pixelWidth: number
  pixelHeight: number
}

export const useCropStore = defineStore('crop', () => {
  const ratioState = ref<RatioState>({
    mode: 'ratio',
    preset: '1:1',
    customWidth: 4,
    customHeight: 3,
    pixelWidth: 1200,
    pixelHeight: 800,
  })

  const effectiveRatio = computed<number | undefined>(() => {
    if (ratioState.value.mode === 'pixel') {
      return ratioState.value.pixelWidth / ratioState.value.pixelHeight
    }
    if (ratioState.value.preset === 'custom') {
      return ratioState.value.customWidth / ratioState.value.customHeight
    }
    // Preset ratios
    const presets: Record<string, number> = {
      '16:9': 16 / 9,
      '3:2': 3 / 2,
      '1:1': 1,
      '2:3': 2 / 3,
    }
    return presets[ratioState.value.preset]
  })

  function setMode(mode: RatioMode) {
    ratioState.value.mode = mode
  }

  function setPreset(preset: RatioPreset) {
    ratioState.value.preset = preset
  }

  function setCustomRatio(w: number, h: number) {
    ratioState.value.customWidth = w
    ratioState.value.customHeight = h
  }

  function setPixelSize(w: number, h: number) {
    ratioState.value.pixelWidth = w
    ratioState.value.pixelHeight = h
  }

  return {
    ratioState: readonly(ratioState),
    effectiveRatio,
    setMode,
    setPreset,
    setCustomRatio,
    setPixelSize,
  }
})
```

### Pattern 6: CSS Crop Overlay with Handles

**What:** CSS-based crop window overlay with corner handles
**When to use:** Rendering the crop overlay on top of the image
**Source:** [ASSUMED] Standard CSS overlay pattern per D-05, D-06, D-07

```vue
<!-- components/CropOverlay.vue -->
<template>
  <div class="crop-overlay" :style="overlayStyle">
    <!-- Dark overlay outside crop area -->
    <div class="crop-overlay__mask" :style="maskStyle" />

    <!-- Crop window -->
    <div
      class="crop-overlay__window"
      :style="windowStyle"
      @mousedown="onWindowMouseDown"
    >
      <!-- White border -->
      <div class="crop-overlay__border" />

      <!-- Corner handles -->
      <div class="crop-overlay__handle crop-overlay__handle--nw" @mousedown.stop="onHandleMouseDown('nw')" />
      <div class="crop-overlay__handle crop-overlay__handle--ne" @mousedown.stop="onHandleMouseDown('ne')" />
      <div class="crop-overlay__handle crop-overlay__handle--sw" @mousedown.stop="onHandleMouseDown('sw')" />
      <div class="crop-overlay__handle crop-overlay__handle--se" @mousedown.stop="onHandleMouseDown('se')" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  imageWidth: number
  imageHeight: number
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
  overlayOpacity: number // 0.6-0.7 per D-07
}>()

const emit = defineEmits<{
  (e: 'update:cropX', value: number): void
  (e: 'update:cropY', value: number): void
  (e: 'update:cropWidth', value: number): void
  (e: 'update:cropHeight', value: number): void
  (e: 'drag-start'): void
}>()

// Styles calculated based on image dimensions and crop position
const overlayStyle = computed(() => ({
  width: `${props.imageWidth}px`,
  height: `${props.imageHeight}px`,
}))

const maskStyle = computed(() => ({
  backgroundColor: `rgba(0, 0, 0, ${props.overlayOpacity})`,
  clipPath: `polygon(
    0 0,
    0 100%,
    ${props.cropX}px 100%,
    ${props.cropX}px ${props.cropY}px,
    ${props.cropX + props.cropWidth}px ${props.cropY}px,
    ${props.cropX + props.cropWidth}px ${props.cropY + props.cropHeight}px,
    ${props.cropX}px ${props.cropY + props.cropHeight}px,
    ${props.cropX}px 100%,
    100% 100%,
    100% 0
  )`,
}))

const windowStyle = computed(() => ({
  left: `${props.cropX}px`,
  top: `${props.cropY}px`,
  width: `${props.cropWidth}px`,
  height: `${props.cropHeight}px`,
}))

function onWindowMouseDown(e: MouseEvent) {
  emit('drag-start')
  // Hand off to useCropWindow composable
}

function onHandleMouseDown(handle: string) {
  emit('drag-start')
  // Hand off to useCropWindow composable with handle info
}
</script>

<style lang="scss" scoped>
.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;

  &__mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__window {
    position: absolute;
    cursor: move;

    &:hover .crop-overlay__border {
      border-color: var(--accent);
    }
  }

  &__border {
    position: absolute;
    inset: 0;
    border: 2px solid white;
    pointer-events: none;
    transition: border-color 150ms ease;
  }

  &__handle {
    position: absolute;
    width: 8px; // D-06: 8px corners
    height: 8px;
    background: white;
    border: 1px solid var(--text-secondary);

    &--nw { top: -4px; left: -4px; cursor: nw-resize; }
    &--ne { top: -4px; right: -4px; cursor: ne-resize; }
    &--sw { bottom: -4px; left: -4px; cursor: sw-resize; }
    &--se { bottom: -4px; right: -4px; cursor: se-resize; }
  }
}
</style>
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag state tracking | Simple `isDragging` boolean | Counter-based tracking | Nested drag events (dragenter on child) cause incorrect state |
| Blob URL management | Ad-hoc `URL.createObjectURL` | `useBlobRegistry` composable | Phase 1 established; prevents memory leaks |
| Canvas thumbnail generation | Per-image canvas creation | `useCanvasPool` + `createImageBitmap` | Phase 1 established; prevents GC pressure |
| Aspect ratio math | Ad-hoc width/height only | Full coordinate adjustment | NW/NE/SW handles need X+Y adjustment to keep opposite corner stationary |

---

## Common Pitfalls

### Pitfall 1: Drag State Incorrect with Nested Elements
**What goes wrong:** `isDragging` stays true when dropping on child elements
**Why it happens:** `dragleave` fires when entering child elements, even though still over drop zone
**How to avoid:** Use a counter (`dragCounter`) that increments on `dragenter`, decrements on `dragleave`, and only sets `isDragging = false` when counter reaches 0
**Warning signs:** File drop doesn't work when dropping directly on an image inside the drop zone

### Pitfall 2: Crop Window Drags Outside Image Bounds
**What goes wrong:** Crop window can be partially or fully positioned outside image
**Why it happens:** No bounds checking on drag/resize operations
**How to avoid:** Clamp X to `[0, imageWidth - cropWidth]`, Y to `[0, imageHeight - cropHeight]`, and dimensions to `[minSize, imageWidth/imageHeight]`
**Warning signs:** White border of crop window disappears or shows on wrong side

### Pitfall 3: Aspect Ratio Not Maintained During Drag
**What goes wrong:** Crop window distorts when resizing with ratio constraint
**Why it happens:** Only adjusting one dimension instead of both
**How to avoid:** Apply ratio to BOTH width and height after calculating delta; adjust X/Y for NW/NE/SW handles
**Warning signs:** Resize feels "jumpy" or inconsistent

### Pitfall 4: Memory Leak from Blob URLs Not Revoked
**What goes wrong:** Each imported image creates Blob URLs that persist indefinitely
**Why it happens:** Forgetting to call `URL.revokeObjectURL` when removing images
**How to avoid:** Use `useBlobRegistry` (Phase 1) and always call `revoke()` in store's `removeImage()` action
**Warning signs:** `DOMException: Failed to execute 'createObjectURL' on 'URL'` after importing many images

### Pitfall 5: Thumbnail Generation Blocks Main Thread
**What goes wrong:** Large images cause UI freeze during thumbnail generation
**Why it happens:** `createImageBitmap` and canvas operations run synchronously on main thread
**How to avoid:** Generate thumbnails lazily (on intersection) or offload to worker (Phase 4 infrastructure)
**Warning signs:** UI freezes for 1+ seconds when importing large images (e.g., 20MB DSLR photos)

### Pitfall 6: Dark Mode Flash on Load
**What goes wrong:** White background flashes before dark mode applies
**Why it happens:** CSS `prefers-color-scheme` applies after initial render
**How to avoid:** Add inline script in `<head>` to set `data-theme` attribute before first paint, or accept minor flash as acceptable
**Warning signs:** Visible white flash when loading app in dark mode system preference

---

## Code Examples

### CSS Dark Mode with CSS Variables

```scss
// assets/sass/_variables.scss

// Light mode defaults
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #ebebeb;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --border: #e0e0e0;
  --overlay-opacity: 0.65; // D-07: 60-70% range

  // Crop-specific
  --crop-handle-size: 8px;
  --crop-border-width: 2px;
  --crop-border-color: white;
}

// Dark mode overrides
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #3d3d3d;
    --text-primary: #f5f5f5;
    --text-secondary: #a0a0a0;
    --accent: #60a5fa;
    --accent-hover: #3b82f6;
    --border: #404040;
  }
}
```

### Ratio Preset Buttons

```vue
<!-- components/RatioPresets.vue -->
<template>
  <div class="ratio-presets">
    <button
      v-for="preset in presets"
      :key="preset.label"
      :class="['ratio-presets__btn', { 'is-active': modelValue === preset.value }]"
      @click="$emit('update:modelValue', preset.value)"
    >
      {{ preset.label }}
    </button>
    <button
      :class="['ratio-presets__btn', { 'is-active': modelValue === 'custom' }]"
      @click="$emit('update:modelValue', 'custom')"
    >
      Custom
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const presets = [
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '1:1', value: '1:1' },
  { label: '2:3', value: '2:3' },
]
</script>
```

### Smartcrop.js Integration (Phase 3 Hook)

```typescript
// composables/useSmartcrop.ts
// Phase 3 will use this pattern for AI auto-crop

interface SmartcropResult {
  x: number
  y: number
  width: number
  height: number
}

export async function detectCrop(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<SmartcropResult | null> {
  // Lazy-load smartcrop.js from CDN on first use
  if (typeof (window as any).smartcrop === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/smartcrop@2.1.1/smartcrop.min.js')
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const result = (window as any).smartcrop.crop(img, {
        width: targetWidth,
        height: targetHeight,
      })
      resolve(result.topCrop)
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `new Image()` for thumbnails | `createImageBitmap()` + canvas | Phase 2 decision | Better memory handling, off-main-thread decode where supported |
| Simple boolean for drag state | Counter-based drag tracking | Phase 2 discovery | Correct handling of nested drag events |
| Single-dimension ratio constraint | Full coordinate adjustment | Phase 2 discovery | NW/NE/SW handles maintain correct opposite corner position |
| CSS transitions on overlay | `clip-path` polygon for mask | Phase 2 decision | Smooth overlay that follows crop window exactly |

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Counter-based drag tracking is necessary | Pattern 1 | May work with simpler boolean on some browsers; test thoroughly |
| A2 | `createImageBitmap` + canvas pool is the right thumbnail approach | Pattern 2 | OffscreenCanvas could work better in worker (Phase 4); acceptable for Phase 2 |
| A3 | 8px corner handles (D-06) is sufficient for usability | Common Pitfalls | Touch devices may need larger handles; defer to Phase 2 verification |
| A4 | Overlay opacity 60-70% (D-07) provides adequate contrast | Code Examples | May need adjustment based on actual image brightness; user validation |
| A5 | Smartcrop.js will be lazy-loaded from CDN in Phase 3 | Smartcrop Integration | CDN availability, version changes, or CORS issues may require alternative approach |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Thumbnail lazy loading strategy**
   - What we know: Intersection Observer can detect when thumbnails enter viewport
   - What's unclear: Whether to generate all thumbnails upfront or on-demand; memory vs. responsiveness tradeoff
   - Recommendation: Generate thumbnails eagerly for first ~20 images, lazy-load rest

2. **"Add more images" button behavior**
   - What we know: D-11 says drop zone and file picker always visible
   - What's unclear: Whether file picker button stays visible when list has items, or only shows after first import
   - Recommendation: Keep button visible at all times; use icon-only button when list has items

3. **Initial crop window size when selecting an image**
   - What we know: User selects image, crop window should appear
   - What's unclear: Start with center-crop at full image size, or last-used ratio at maximum size?
   - Recommendation: Start with center-crop at 80% of image dimensions with current ratio preset

4. **Custom ratio input validation**
   - What we know: Separate W and H fields (D-09), real-time validation needed
   - What's unclear: What constitutes valid ratio values? Zero/negative prevention, max values
   - Recommendation: Positive integers only, max 10000 for each dimension

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified — all Phase 2 features use native browser APIs)

All required tools are available:
- Node.js v22.18.0 (runtime via Nuxt 3)
- npm 10.9.3 (package manager)
- Native browser APIs: HTML5 Drag and Drop, File API, Canvas API, CSS Variables

No external services, databases, or additional CLI utilities required for Phase 2.

---

## Validation Architecture

> Phase 2 implements UI and UX requirements. Test infrastructure should be established in this phase.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest [VERIFIED: npm registry] |
| Config file | `vitest.config.ts` (to be created) |
| Quick run command | `vitest run --reporter=dot` |
| Full suite command | `vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| IMPT-01 | File picker imports images | Unit | `vitest run --reporter=dot composables/useFileUpload.test.ts` | ??? |
| IMPT-02 | Drag-drop imports images | Unit | `vitest run composables/useFileUpload.test.ts -t "drag"` | ??? |
| IMPT-03 | Drag-over shows feedback | Unit | `vitest run composables/useFileUpload.test.ts -t "feedback"` | ??? |
| IMPT-04 | Thumbnails generated | Unit | `vitest run composables/useThumbnail.test.ts` | ??? |
| PRVW-01 | List shows all images | Unit | `vitest run stores/useImageStore.test.ts -t "addImage"` | ??? |
| PRVW-02 | List item shows metadata | Unit | `vitest run components/ImageListItem.test.ts` | ??? |
| PRVW-03 | Click selects for cropping | Unit | `vitest run stores/useImageStore.test.ts -t "selectImage"` | ??? |
| CROP-01 | Crop window is draggable | Unit | `vitest run composables/useCropWindow.test.ts -t "drag"` | ??? |
| CROP-02 | Handles resize window | Unit | `vitest run composables/useCropWindow.test.ts -t "resize"` | ??? |
| CROP-03 | Ratio constraint maintained | Unit | `vitest run composables/useCropWindow.test.ts -t "ratio"` | ??? |
| RATIO-01 | Presets available | Unit | `vitest run stores/useCropStore.test.ts -t "preset"` | ??? |
| RATIO-02 | Preset immediately constrains | Unit | `vitest run composables/useCropWindow.test.ts -t "preset constraint"` | ??? |
| UIUX-01 | Dark mode via CSS vars | Smoke | Manual: toggle system dark mode, verify colors | N/A |
| UIUX-02 | Responsive scaling | Smoke | Manual: resize browser window | N/A |

### Sampling Rate
- **Per task commit:** Unit tests via `vitest run`
- **Per wave merge:** Full suite via `vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `tests/composables/useFileUpload.test.ts` — File upload composable tests
- [ ] `tests/composables/useThumbnail.test.ts` — Thumbnail generation tests
- [ ] `tests/composables/useCropWindow.test.ts` — Crop window composable tests
- [ ] `tests/stores/useImageStore.test.ts` — Image store tests
- [ ] `tests/stores/useCropStore.test.ts` — Crop store tests
- [ ] `tests/setup.ts` — Vitest setup with Vue Test Utils

---

## Security Domain

> Phase 2 handles user-provided files (images). Basic security considerations apply.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not applicable |
| V3 Session Management | no | Not applicable |
| V4 Access Control | no | Not applicable |
| V5 Input Validation | yes | Validate MIME type on import (`image/*`), reject non-image files |
| V6 Cryptography | no | Not applicable |
| V12 Files Integrity | partial | Sanitize filenames when displaying; blob URLs are internal references only |

### Known Threat Patterns for Image Import

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious file with image extension | Information Disclosure, Tampering | Validate MIME type via `file.type.startsWith('image/')`, magic bytes if needed |
| Filename with path traversal | Tampering | Strip directory components from filename, use generated IDs internally |
| Large file DoS | Denial of Service | Enforce `maxSize` limit (e.g., 100MB) in `useFileUpload` |
| Blob URL injection | Information Disclosure | Blob URLs are internal; never exposed to user input; managed by `useBlobRegistry` |

---

## Sources

### Primary (HIGH confidence)
- [Smartcrop.js GitHub](https://github.com/jwagner/smartcrop.js) - Library API, crop function signature, options
- [Vue 3 GitHub](https://github.com/vuejs/vue) - Vue types, DragEvent definitions
- [Pinia GitHub](https://github.com/vuejs/pinia) - Store patterns, setup store syntax
- [MDN: HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) - Native drag events
- [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - Canvas 2D context, toBlob, drawImage

### Secondary (MEDIUM confidence)
- [Stack Overflow: Drag-resizing rectangle with fixed aspect ratio](https://stackoverflow.com/questions/50230967/drag-resizing-rectangle-with-fixed-aspect-ratio-northwest-corner) - NW handle algorithm
- [Stack Overflow: Resizing rectangle snapping to fixed ratio](https://stackoverflow.com/questions/15417135/resizing-a-rectangle-and-snapping-to-a-fixed-ratio) - Comparison approach
- [Digital Thrive UK: Drag-Drop File Uploader Vue 3](https://digitalthriveai.com/en-gb/resources/web-development/drag-drop-file-uploader-vuejs-3/) - Counter-based drag tracking
- [Daniel Kelly: Vue 3 Tailwind File Drag and Drop](https://danielkelly.io/blog/vue-3-tailwind-file-drag-and-drop-input/) - Simple drop zone pattern
- [DEV Community: Browser Crop Image Tool](https://dev.to/shaishav_patel_271fdcd61a/building-a-browser-crop-image-tool-display-to-source-coordinate-scaling-and-aspect-ratio-presets-273) - Aspect ratio math

### Tertiary (LOW confidence)
- [AllanBishop/ImageCropper](https://github.com/AllanBishop/ImageCropper) - Lightweight HTML5 cropper reference
- [GoogleChrome/modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/user-experience/dark-mode/guide.md) - Dark mode best practices

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All native browser APIs, no new packages needed
- Architecture: HIGH - Patterns well-established, Vue 3 composable patterns verified
- Pitfalls: MEDIUM - Cross-verified with Stack Overflow and MDN; browser-specific edge cases may vary

**Research date:** 2026-07-01
**Valid until:** 2026-07-31 (30 days — stable domain, user decisions locked in CONTEXT.md)

---

## RESEARCH COMPLETE

**Phase:** 2 - Core Cropping
**Confidence:** HIGH

### Key Findings

1. **Native HTML5 drag-and-drop** is sufficient — no extra libraries needed; use counter-based state tracking to handle nested elements
2. **CSS overlay divs** (D-05) work well for crop window with `clip-path` for the dark mask; corner handles are absolutely positioned divs with `pointer-events`
3. **Aspect ratio constraint math** requires adjusting BOTH dimensions AND position for NW/NE/SW handles to keep opposite corner stationary
4. **Thumbnail generation** uses `createImageBitmap` + canvas pool (Phase 1) for consistent sizing at device pixel ratio
5. **Smartcrop.js** (Phase 3) takes an image + target dimensions, returns `{ x, y, width, height }` — integration is straightforward via lazy-loaded CDN script
6. **Pinia stores** organized as `useImageStore` (list state) and `useCropStore` (ratio/mode state) following Phase 1 patterns

### File Created
`/Users/carlosprieto/Repos/image-cropper/.planning/phases/02-core-cropping/02-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All native browser APIs; no new packages; Phase 1 established stack |
| Architecture | HIGH | Vue 3 composable patterns verified; Pinia setup stores follow official patterns |
| Pitfalls | MEDIUM | Cross-verified with Stack Overflow, MDN, and Vue docs; may need browser testing |

### Open Questions
- Thumbnail lazy loading strategy (eager vs. on-demand)
- "Add more images" button visibility when list has items
- Initial crop window size when selecting image
- Custom ratio input validation bounds

### Ready for Planning
Research complete. Planner can now create PLAN.md files.

---

## Sources

- [Smartcrop.js GitHub](https://github.com/jwagner/smartcrop.js)
- [Vue 3 GitHub](https://github.com/vuejs/vue)
- [Pinia GitHub](https://github.com/vuejs/pinia)
- [Stack Overflow: Drag-resizing rectangle with fixed aspect ratio](https://stackoverflow.com/questions/50230967/drag-resizing-rectangle-with-fixed-aspect-ratio-northwest-corner)
- [Stack Overflow: Resizing rectangle snapping to fixed ratio](https://stackoverflow.com/questions/15417135/resizing-a-rectangle-and-snapping-to-a-fixed-ratio)
- [Digital Thrive UK: Drag-Drop File Uploader Vue 3](https://digitalthriveai.com/en-gb/resources/web-development/drag-drop-file-uploader-vuejs-3/)
- [Daniel Kelly: Vue 3 Tailwind File Drag and Drop](https://danielkelly.io/blog/vue-3-tailwind-file-drag-and-drop-input/)
- [DEV Community: Browser Crop Image Tool](https://dev.to/shaishav_patel_271fdcd61a/building-a-browser-crop-image-tool-display-to-source-coordinate-scaling-and-aspect-ratio-presets-273)
