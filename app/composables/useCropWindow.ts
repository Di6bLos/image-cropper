/**
 * useCropWindow - Crop window drag/resize logic
 *
 * Manages crop window position and size state, handles drag and resize
 * operations with aspect ratio constraint maintenance for all 4 corner handles.
 *
 * @see D-05, D-06: Corner handles only (4 handles)
 * @see CROP-03: Ratio constraint maintained during resize
 * @see CROP-06: All positions clamped to image bounds
 * @see RESEARCH Pattern 3: Crop Window Composable with Aspect Ratio Constraint
 */

export interface CropWindowState {
  x: number
  y: number
  width: number
  height: number
}

export interface UseCropWindowOptions {
  /** Image width in pixels */
  imageWidth: number
  /** Image height in pixels */
  imageHeight: number
  /** Target aspect ratio (width/height) - undefined means free ratio */
  aspectRatio?: number
  /** Minimum crop size in pixels (default: 20) */
  minSize?: number
  /** Initial crop state */
  initialState?: Partial<CropWindowState>
}

export interface UseCropWindowReturn {
  /** Current crop window state */
  state: Readonly<Ref<CropWindowState>>
  /** Whether user is dragging the crop window */
  isDragging: Readonly<Ref<boolean>>
  /** Whether user is resizing the crop window */
  isResizing: Readonly<Ref<boolean>>
  /** Active handle being dragged ('nw' | 'ne' | 'sw' | 'se' | null) */
  activeHandle: Readonly<Ref<string | null>>
  /** Start drag operation from crop window body */
  startDrag: (e: MouseEvent) => void
  /** Start resize operation from a corner handle */
  startResize: (e: MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se') => void
  /** Manually set crop window position/size */
  setCrop: (x: number, y: number, width: number, height: number) => void
  /** Center crop window in image */
  centerCrop: () => void
}

const DEFAULT_MIN_SIZE = 20

export function useCropWindow(options: UseCropWindowOptions): UseCropWindowReturn {
  const imageWidth = toRef(options, 'imageWidth')
  const imageHeight = toRef(options, 'imageHeight')
  const aspectRatio = toRef(options, 'aspectRatio')
  const minSize = options.minSize ?? DEFAULT_MIN_SIZE
  const initialState = options.initialState ?? {}

  // Initialize with center-crop at full image size
  const state = ref<CropWindowState>({
    x: initialState.x ?? 0,
    y: initialState.y ?? 0,
    width: initialState.width ?? imageWidth,
    height: initialState.height ?? imageHeight,
  })

  const isDragging = ref(false)
  const isResizing = ref(false)
  const activeHandle = ref<'nw' | 'ne' | 'sw' | 'se' | null>(null)

  // Drag start position and initial crop position
  let dragStart = { x: 0, y: 0, cropX: 0, cropY: 0 }

  // Resize start state
  let resizeStart = { x: 0, y: 0, width: 0, height: 0, cropX: 0, cropY: 0 }

  /**
   * Clamp values to image bounds
   */
  function clampToBounds(
    x: number,
    y: number,
    width: number,
    height: number,
  ): { x: number; y: number; width: number; height: number } {
    // Clamp dimensions to minimum size
    width = Math.max(minSize, Math.min(width, imageWidth))
    height = Math.max(minSize, Math.min(height, imageHeight))

    // Clamp position to keep crop window within image bounds
    x = Math.max(0, Math.min(x, imageWidth - width))
    y = Math.max(0, Math.min(y, imageHeight - height))

    return { x, y, width, height }
  }

  /**
   * Apply aspect ratio constraint to dimensions
   */
  function applyAspectRatio(width: number, height: number): { width: number; height: number } {
    const ratio = options.aspectRatio
    if (!ratio) return { width, height }

    // ratio is width/height (e.g., 16/9 = 1.777)
    if (width / height > ratio) {
      return { width: height * ratio, height }
    }
    return { width, height: width / ratio }
  }

  /**
   * Start drag operation
   */
  function startDrag(e: MouseEvent): void {
    if (isResizing.value) return
    if (!process.client) return

    isDragging.value = true
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      cropX: state.value.x,
      cropY: state.value.y,
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  /**
   * Start resize operation from a corner handle
   */
  function startResize(e: MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se'): void {
    if (!process.client) return

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

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  /**
   * Handle mouse move during drag or resize
   */
  function onMouseMove(e: MouseEvent): void {
    if (isDragging.value) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      let newX = dragStart.cropX + dx
      let newY = dragStart.cropY + dy

      // Clamp to image bounds
      newX = Math.max(0, Math.min(newX, imageWidth - state.value.width))
      newY = Math.max(0, Math.min(newY, imageHeight - state.value.height))

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
        case 'se': {
          // Bottom-right: expand right and down
          newWidth = Math.max(minSize, resizeStart.width + dx)
          newHeight = Math.max(minSize, resizeStart.height + dy)
          if (ratio) {
            const constrained = applyAspectRatio(newWidth, newHeight)
            newWidth = constrained.width
            newHeight = constrained.height
          }
          break
        }

        case 'sw': {
          // Bottom-left: expand left and down
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
        }

        case 'ne': {
          // Top-right: expand right and up
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
        }

        case 'nw': {
          // Top-left: expand left and up
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
      }

      // Clamp to bounds and apply
      const clamped = clampToBounds(newX, newY, newWidth, newHeight)
      Object.assign(state.value, clamped)
    }
  }

  /**
   * Handle mouse up - end drag/resize
   */
  function onMouseUp(): void {
    isDragging.value = false
    isResizing.value = false
    activeHandle.value = null

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  /**
   * Set crop window to specific values
   */
  function setCrop(x: number, y: number, width: number, height: number): void {
    const clamped = clampToBounds(x, y, width, height)
    Object.assign(state.value, clamped)
  }

  /**
   * Center the crop window in the image
   */
  function centerCrop(): void {
    const x = (imageWidth - state.value.width) / 2
    const y = (imageHeight - state.value.height) / 2
    state.value.x = Math.max(0, x)
    state.value.y = Math.max(0, y)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (process.client) {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  })

  return {
    state: readonly(state),
    isDragging: readonly(isDragging),
    isResizing: readonly(isResizing),
    activeHandle: readonly(activeHandle),
    startDrag,
    startResize,
    setCrop,
    centerCrop,
  }
}
