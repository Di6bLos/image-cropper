<template>
  <div
    v-if="process.client"
    class="crop-overlay"
    :style="overlayStyle"
  >
    <!-- Image display -->
    <img
      v-if="imageUrl"
      :src="imageUrl"
      class="crop-overlay__image"
      :style="imageStyle"
      alt="Crop preview"
      draggable="false"
    >

    <!-- Dark mask outside crop area -->
    <div class="crop-overlay__mask" :style="maskStyle" />

    <!-- Crop window with border and handles -->
    <div
      class="crop-overlay__window"
      :style="windowStyle"
      @mousedown="onWindowMouseDown"
    >
      <!-- White border -->
      <div class="crop-overlay__border" />

      <!-- Corner handles -->
      <CropHandle
        position="nw"
        @drag-start="onHandleDragStart"
      />
      <CropHandle
        position="ne"
        @drag-start="onHandleDragStart"
      />
      <CropHandle
        position="sw"
        @drag-start="onHandleDragStart"
      />
      <CropHandle
        position="se"
        @drag-start="onHandleDragStart"
      />
    </div>
  </div>

  <!-- SSR placeholder -->
  <div v-else class="crop-overlay crop-overlay--ssr">
    <div class="crop-overlay__placeholder">
      <svg
        class="crop-overlay__placeholder-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 2v4" />
        <path d="M18 22v-4" />
        <path d="M2 6h4" />
        <path d="M22 18h-4" />
        <rect x="6" y="6" width="12" height="12" rx="1" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import CropHandle from './CropHandle.vue'

export interface CropOverlayProps {
  /** Image URL to display */
  imageUrl: string
  /** Original image width */
  imageWidth: number
  /** Original image height */
  imageHeight: number
  /** Crop window X position */
  cropX: number
  /** Crop window Y position */
  cropY: number
  /** Crop window width */
  cropWidth: number
  /** Crop window height */
  cropHeight: number
  /** Overlay opacity outside crop area (0-1) */
  overlayOpacity?: number
}

const props = withDefaults(defineProps<CropOverlayProps>(), {
  overlayOpacity: 0.65,
})

const emit = defineEmits<{
  (e: 'drag-start'): void
  (e: 'resize-start', handle: 'nw' | 'ne' | 'sw' | 'se'): void
}>()

// Overlay wrapper style
const overlayStyle = computed(() => ({
  position: 'relative' as const,
  width: `${props.imageWidth}px`,
  height: `${props.imageHeight}px`,
  maxWidth: '100%',
}))

// Image style - display at natural size within container
const imageStyle = computed(() => ({
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  userSelect: 'none' as const,
  pointerEvents: 'none' as const,
}))

// Calculate clip-path polygon for dark mask
// The mask covers everything OUTSIDE the crop window
const maskStyle = computed(() => {
  // Clip-path polygon points go around the outside of the crop area
  // Starting from top-left corner, going clockwise
  // Points: top-left, top-right, bottom-right, bottom-left, back to top-left
  const clipPath = `polygon(
    0% 0%,
    0% 100%,
    ${props.cropX}px 100%,
    ${props.cropX}px ${props.cropY}px,
    ${props.cropX + props.cropWidth}px ${props.cropY}px,
    ${props.cropX + props.cropWidth}px ${props.cropY + props.cropHeight}px,
    ${props.cropX}px ${props.cropY + props.cropHeight}px,
    ${props.cropX}px 100%,
    100% 100%,
    100% 0%
  )`

  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: `rgba(0, 0, 0, ${props.overlayOpacity})`,
    clipPath,
    pointerEvents: 'none' as const,
  }
})

// Crop window style
const windowStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.cropX}px`,
  top: `${props.cropY}px`,
  width: `${props.cropWidth}px`,
  height: `${props.cropHeight}px`,
  pointerEvents: 'auto' as const,
  cursor: 'move' as const,
}))

// Window drag - emit for parent to handle via useCropWindow
function onWindowMouseDown(e: MouseEvent) {
  e.preventDefault()
  emit('drag-start')
}

// Handle drag - emit with handle position
function onHandleDragStart(e: MouseEvent, position: string) {
  e.preventDefault()
  emit('resize-start', position as 'nw' | 'ne' | 'sw' | 'se')
}
</script>

<style lang="scss" scoped>
.crop-overlay {
  --co-bg: var(--bg-primary, #ffffff);
  --co-border: white;

  position: relative;
  display: inline-block;
  background: var(--co-bg);

  &--ssr {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 8px;
  }

  &__image {
    display: block;
    max-width: 100%;
    height: auto;
    user-select: none;
    pointer-events: none;
  }

  &__mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__window {
    position: absolute;
    cursor: move;

    &:hover .crop-overlay__border {
      border-color: var(--accent, #3b82f6);
    }
  }

  &__border {
    position: absolute;
    inset: 0;
    border: 2px solid var(--co-border);
    pointer-events: none;
    transition: border-color 150ms ease;
    box-shadow: 0 0 0 2px white; // Ensure visibility on any background
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
  }

  &__placeholder-icon {
    width: 48px;
    height: 48px;
    color: var(--text-secondary, #666666);
    opacity: 0.5;
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .crop-overlay {
    --co-bg: var(--bg-primary, #1a1a1a);
  }
}
</style>
