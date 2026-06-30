# Architecture Research

**Domain:** Browser-based image cropping tool with AI subject detection
**Researched:** 2026-06-24
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ ImageList   │  │ CropEditor  │  │ ExportPanel         │   │
│  │ Component   │  │ Component   │  │ Component           │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │
│         │                │                    │              │
├─────────┼────────────────┼────────────────────┼──────────────┤
│                      APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Pinia Image Store                  │    │
│  │  - Image registry    - Crop state      - Export queue│    │
│  └──────────────────────────┬──────────────────────────┘    │
│                              │                               │
├──────────────────────────────┼──────────────────────────────┤
│                      SERVICE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ImageProcessor│ │SubjectDetector│ │ EncoderService     │ │
│  │  (Canvas)    │ │  (AI Models)  │ │  (Web Workers)      │ │
│  └──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘ │
│         │                │                     │             │
├─────────┼────────────────┼─────────────────────┼────────────┤
│                      INFRASTRUCTURE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ FileImport   │ │ ModelLoader  │ │ ZipGenerator         │ │
│  │ Service      │ │ (Lazy/WASM)  │ │ (Web Worker)         │ │
│  └──────────────┘ └──────────────┘ └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `ImageList` | Display imported images as thumbnails, handle selection | Virtual scrolling for dozens of images, `shallowRef` for thumbnail data |
| `CropEditor` | Interactive crop area manipulation, preview | Canvas or PixiJS for rendering, pointer event handlers |
| `ExportPanel` | Format selection, quality settings, batch export trigger | Reactive form, progress tracking |
| `ImageStore` (Pinia) | Central state for all images, selected image, crop params | Modular store with `$patch` for batch updates |
| `ImageProcessor` | Canvas-based crop application, resize, composite | `OffscreenCanvas` for heavy ops |
| `SubjectDetector` | AI model orchestration, focal point detection | TensorFlow.js or ONNX Runtime Web, lazy-loaded |
| `EncoderService` | Image encoding to JPEG/PNG/WebP | Web Worker + jSquash WASM codecs |
| `ZipGenerator` | Collect encoded images, create downloadable zip | JSZip with streaming for large batches |

## Recommended Project Structure

```
src/
├── components/
│   ├── image/
│   │   ├── ImageList.vue          # Thumbnail grid with selection
│   │   ├── ImageListItem.vue      # Individual thumbnail + status
│   │   ├── CropEditor.vue         # Main crop canvas + controls
│   │   ├── CropOverlay.vue        # Draggable crop handles
│   │   └── ExportPanel.vue        # Format, quality, download
│   ├── ai/
│   │   ├── ModelLoader.vue        # Lazy-load trigger UI
│   │   └── DetectionOverlay.vue  # Visualize detected subjects
│   └── common/
│       ├── ProgressBar.vue
│       └── FormatSelect.vue
├── composables/
│   ├── useImageImport.ts          # File input → ImageBitmap
│   ├── useCropTransform.ts        # Crop geometry math
│   ├── useAiDetection.ts          # Model loading + inference
│   └── useExport.ts               # Encode + zip pipeline
├── stores/
│   └── image.ts                   # Pinia store for image state
├── workers/
│   ├── encoder.worker.ts          # Image encoding off main thread
│   └── detection.worker.ts        # AI inference off main thread
├── services/
│   ├── imageProcessor.ts          # Canvas operations
│   ├── subjectDetector.ts         # AI detection abstraction
│   ├── encoderService.ts          # WASM codec orchestration
│   └── zipService.ts              # JSZip wrapper
├── types/
│   └── image.ts                   # TypeScript interfaces
├── utils/
│   ├── cropGeometry.ts            # Aspect ratio, positioning math
│   └── imageUtils.ts              # Format detection, size checks
├── App.vue
└── main.ts
```

### Structure Rationale

- **`components/image/`:** Co-located image editing components with clear ownership
- **`composables/`:** Reusable logic extracted from components (import, crop, export) for testability
- **`workers/`:** Web Workers keep UI responsive during heavy processing
- **`services/`:** Pure business logic separated from Vue reactivity
- **`types/`:** Centralized TypeScript interfaces prevent drift

## Architectural Patterns

### Pattern 1: Virtual Thumbnail Grid with Lazy Loading

**What:** Images are stored as `ImageBitmap` references; thumbnails are downsampled versions rendered only when visible.
**When to use:** Displaying dozens of images without freezing the UI.
**Trade-offs:** Memory efficient but requires careful cleanup to avoid leaks.

```typescript
// composables/useThumbnail.ts
export function useThumbnail(imageBitmap: ImageBitmap, maxSize = 200) {
  const bitmap = shallowRef<ImageBitmap | null>(null)

  async function generateThumbnail() {
    const scale = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height)
    const canvas = new OffscreenCanvas(
      imageBitmap.width * scale,
      imageBitmap.height * scale
    )
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
    bitmap.value = await createImageBitmap(canvas)
  }

  onMounted(() => generateThumbnail())
  onUnmounted(() => bitmap.value?.close())

  return { bitmap }
}
```

### Pattern 2: OffscreenCanvas + Web Worker for Heavy Operations

**What:** Move canvas operations and encoding to a worker thread using `OffscreenCanvas` and transferable `ImageBitmap` objects.
**When to use:** Image encoding, AI inference, batch processing that would otherwise block the main thread.
**Trade-offs:** Requires message passing overhead; not all canvas APIs are supported in workers.

```typescript
// workers/encoder.worker.ts
self.onmessage = async ({ data: { bitmap, crop, format, quality } }) => {
  const canvas = new OffscreenCanvas(crop.width, crop.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  const blob = await canvas.convertToBlob({ type: format, quality })
  bitmap.close() // Release memory immediately

  self.postMessage({ blob }, [blob])
}
```

### Pattern 3: Pinia Store with Batch State Updates

**What:** Use Pinia's `$patch` for efficient bulk state updates when processing multiple images.
**When to use:** Batch import, batch export, updating multiple image statuses.
**Trade-offs:** Simpler than manual mutation but requires understanding reactive boundaries.

```typescript
// stores/image.ts
export const useImageStore = defineStore('images', () => {
  const images = shallowRef<ProcessedImage[]>([])
  const selectedId = ref<string | null>(null)
  const isProcessing = ref(false)

  async function importImages(files: File[]) {
    isProcessing.value = true
    const newImages = await Promise.all(files.map(processImageFile))
    // Batch update without triggering multiple reactivity updates
    images.value = [...images.value, ...newImages]
    isProcessing.value = false
  }

  function updateImageStatus(id: string, status: ImageStatus) {
    images.value = images.value.map(img =>
      img.id === id ? { ...img, status } : img
    )
  }

  return { images, selectedId, isProcessing, importImages, updateImageStatus }
})
```

### Pattern 4: Lazy AI Model Loading with Caching

**What:** Defer loading of AI models until first use, then cache in IndexedDB for subsequent sessions.
**When to use:** TensorFlow.js or ONNX models that are 10-50MB.
**Trade-offs:** Faster initial page load but delayed first detection.

```typescript
// services/subjectDetector.ts
const MODEL_CACHE = 'indexeddb://subject-detection-v1'

export async function loadModel(): Promise<SubjectDetectionModel> {
  // Check cache first
  const cached = await loadModelFromCache(MODEL_CACHE)
  if (cached) return cached

  // Load and cache for next time
  const model = await tf.loadGraphModel(MODEL_URL, { quantizationBytes: 2 })
  await model.save(MODEL_CACHE)
  return model
}

export async function detectSubject(bitmap: ImageBitmap, model: SubjectDetectionModel) {
  const tensor = tf.browser.fromImageBitmap(bitmap)
  const prediction = model.predict(tensor) as TfTensor
  tensor.dispose()
  return extractFocalPoint(prediction)
}
```

### Pattern 5: Command Pattern for Undo/Redo

**What:** Each crop operation is encapsulated as a command object with `execute()` and `undo()` methods stored in a history stack.
**When to use:** Interactive editing where users need to revert changes.
**Trade-offs:** Memory overhead for storing history; complex for concurrent operations.

```typescript
interface CropCommand {
  imageId: string
  cropParams: CropParams
  previousCrop: CropParams
  execute(): void
  undo(): void
}

class HistoryManager {
  private history: CropCommand[] = []
  private pointer = -1

  execute(cmd: CropCommand) {
    cmd.execute()
    this.history = this.history.slice(0, ++this.pointer)
    this.history.push(cmd)
  }

  undo() {
    this.history[this.pointer--]?.undo()
  }

  redo() {
    this.history[++this.pointer]?.execute()
  }
}
```

## Data Flow

### Image Import Flow

```
[User drops/selects files]
    ↓
[FileImport Service] → [Validate type/size] → [Create ImageBitmap]
    ↓
[Thumbnail Generator] → [OffscreenCanvas downsample] → [shallowRef bitmap]
    ↓
[Pinia ImageStore] → $patch({ images: [...newImages] })
    ↓
[ImageList renders thumbnails reactively]
```

### AI Subject Detection Flow

```
[User clicks "Auto-Detect" or enables on import]
    ↓
[ModelLoader checks cache] → [Load if missing (show progress)]
    ↓
[Detection Worker] → [Transfer ImageBitmap] → [Run inference]
    ↓
[Focal point extraction] → [Center crop with padding]
    ↓
[CropStore / ImageStore] → [CropOverlay updates position]
```

### Export Flow

```
[User selects format + quality, clicks "Export All"]
    ↓
[Pinia ExportQueue] → [For each image: EncoderWorker.run(crop)]
    ↓
[Worker: OffscreenCanvas apply crop] → [Encode to blob]
    ↓
[Main thread receives blob] → [ZipService.add(blob)]
    ↓
[JSZip.generateAsync] → [Stream to download via URL.createObjectURL]
```

### State Management

```
[ImageStore (Pinia)]
    ↓ (subscribes via storeToRefs)
[ImageList] ←→ [CropEditor] ←→ [ExportPanel]
    ↓              ↓              ↓
[Actions] → [$patch / mutations] → [ImageStore]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-50 images | Single Pinia store, main thread encoding OK |
| 50-200 images | Virtual scrolling, Web Worker encoding, lazy thumbnails |
| 200-1000 images | OffscreenCanvas everywhere, IndexedDB persistence, chunked processing |

### Scaling Priorities

1. **First bottleneck:** Main thread blocking during batch encoding
   - **Fix:** Move all `canvas.convertToBlob()` to Web Worker with transferable ImageBitmaps

2. **Second bottleneck:** Memory from keeping all ImageBitmaps in store
   - **Fix:** Use `shallowRef`, close bitmaps when thumbnails suffice, reload on demand

3. **Third bottleneck:** AI model loading blocking UI
   - **Fix:** Lazy load with progress indicator, cache in IndexedDB

## Anti-Patterns

### Anti-Pattern 1: Storing Large Image Data in Reactive State

**What people do:** Put `ImageBitmap` or large base64 strings directly in Pinia state.
**Why it's wrong:** Vue's reactivity system copies data, causing massive memory bloat and slow updates.
**Do this instead:** Use `shallowRef` for ImageBitmap references, store only IDs and metadata in reactive state.

### Anti-Pattern 2: Processing Images Synchronously in a Loop

**What people do:** `for (const file of files) { await process(file) }`
**Why it's wrong:** Serial processing is slow; doesn't utilize parallelism; if one fails, all fail.
**Do this instead:** `Promise.all(files.map(file => processInWorker(file)))` with error handling per image.

### Anti-Pattern 3: Not Releasing ImageBitmap Memory

**What people do:** Create ImageBitmaps but never call `.close()`.
**Why it's wrong:** ImageBitmap memory is not garbage collected until explicitly released, causing memory leaks.
**Do this instead:** Always call `bitmap.close()` when done, use try/finally to ensure cleanup.

### Anti-Pattern 4: Blocking UI During AI Model Load

**What people do:** `const model = await loadModel()` at app startup.
**Why it's wrong:** 20-50MB download blocks initial render; users may leave before AI is needed.
**Do this instead:** Lazy load on first use, show lightweight placeholder UI immediately.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| TensorFlow.js | Lazy-loaded WASM/WebGL models | Use `quantizationBytes: 2` to reduce size; cache in IndexedDB |
| ONNX Runtime Web | Alternative to TF.js for SAM models | Good for Segment-Anything variants like SlimSAM-77 |
| jSquash | WASM codecs for AVIF/WebP encoding | Use Web Worker to avoid blocking; fallback to canvas encoding |
| JSZip | Client-side zip generation | Use `streamFiles: true` for large batches; handle memory limits |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Vue Components ↔ Pinia Store | Reactive bindings via `storeToRefs()` | Use `shallowRef` for large data |
| Main Thread ↔ Workers | `postMessage` with transferable objects | Pass `ImageBitmap` in transferable array |
| Services ↔ Canvas | Direct canvas API calls | Move to OffscreenCanvas in workers for heavy ops |
| Backend (future) | Nuxt server routes (`server/api/`) | Add auth middleware later; v1 is client-only |

## Backend API Structure (Future)

```
server/
├── api/
│   ├── keys/                    # API key management
│   │   ├── index.get.ts         # List user's keys
│   │   ├── index.post.ts        # Create new key
│   │   └── [id].delete.ts       # Revoke key
│   ├── usage/                   # Usage tracking
│   │   └── index.post.ts        # Log export event
│   └── settings/                # User settings
│       └── index.get.ts
├── middleware/
│   └── auth.ts                  # Session verification → event.context.user
└── utils/
    └── db.ts                    # Database client (Prisma/Drizzle)
```

Auth middleware pattern:
```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session')
  if (!token) return
  try {
    event.context.user = await verifySession(token)
  } catch {
    // Invalid/expired — context.user stays undefined
  }
})
```

---

## Sources

- [The Architecture of Web-Based Graphic Editors (DEV Community)](https://dev.to/feconf/the-architecture-of-web-based-graphic-editors-and-7-design-patterns-part-2-4kfb)
- [EzRen - GPU-powered image editing engine with PixiJS](https://github.com/MateoRNV/ez-ren)
- [Fabric Image Editor - Web Worker integration](https://github.com/Anu3ev/image-editor)
- [jSquash - WASM image codecs](https://github.com/jamsinclair/jSquash)
- [Smartcrop.js - Content-aware cropping](https://github.com/jwagner/smartcrop.js/)
- [Universal Auto-Cropper - FaceDetector API + fallback](https://autocropperphoto.blogspot.com/2025/06/universal-auto-cropper.html)
- [SlimSAM via ONNX Runtime Web](https://github.com/vegidio/react-canvas-masker-auto-selection)
- [JSZip large file handling](https://github.com/Stuk/jszip/issues/308)
- [Nuxt server directory structure](https://nuxt.com/docs/3.x/directory-structure/server)
- [Nuxt server middleware for auth](https://www.nazarboyko.com/articles/authentication-in-nuxt-applications)
- [Pinia batch processing patterns](https://github.com/vuejs/pinia)

---

*Architecture research for: Browser-based image cropping tool with AI subject detection*
*Researched: 2026-06-24*
