<template>
  <div
    class="crop-handle"
    :class="`crop-handle--${position}`"
    :style="handleStyle"
    @mousedown.stop="onMouseDown"
  />
</template>

<script setup lang="ts">
export interface CropHandleProps {
  /** Handle position */
  position: 'nw' | 'ne' | 'sw' | 'se'
  /** Handle size in pixels (including border) */
  size?: number
  /** Whether handle is visible (for potential future use) */
  visible?: boolean
}

const props = withDefaults(defineProps<CropHandleProps>(), {
  size: 12,
  visible: true,
})

const emit = defineEmits<{
  (e: 'drag-start', event: MouseEvent, position: string): void
}>()

// Calculate the visual offset to center the handle on the corner
// Handle size includes 1px border, visible area is 8px (4px offset from center)
const VISIBLE_SIZE = 8
const OFFSET = (props.size - VISIBLE_SIZE) / 2

const handleStyle = computed(() => {
  const base: Record<string, string | number> = {
    width: `${props.size}px`,
    height: `${props.size}px`,
  }

  // Position the handle at the correct corner with offset for centering
  switch (props.position) {
    case 'nw':
      base.top = `-${OFFSET}px`
      base.left = `-${OFFSET}px`
      break
    case 'ne':
      base.top = `-${OFFSET}px`
      base.right = `-${OFFSET}px`
      break
    case 'sw':
      base.bottom = `-${OFFSET}px`
      base.left = `-${OFFSET}px`
      break
    case 'se':
      base.bottom = `-${OFFSET}px`
      base.right = `-${OFFSET}px`
      break
  }

  return base
})

// Cursor style based on position
const cursorMap = {
  nw: 'nw-resize',
  ne: 'ne-resize',
  sw: 'sw-resize',
  se: 'se-resize',
} as const

function onMouseDown(e: MouseEvent) {
  emit('drag-start', e, props.position)
}
</script>

<style lang="scss" scoped>
.crop-handle {
  --ch-bg: white;
  --ch-border: var(--text-secondary, #666666);

  position: absolute;
  background: var(--ch-bg);
  border: 1px solid var(--ch-border);
  pointer-events: auto;
  z-index: 10;

  // Ensure the handle is always on top
  &--nw {
    top: 0;
    left: 0;
    cursor: nw-resize;
  }

  &--ne {
    top: 0;
    right: 0;
    cursor: ne-resize;
  }

  &--sw {
    bottom: 0;
    left: 0;
    cursor: sw-resize;
  }

  &--se {
    bottom: 0;
    right: 0;
    cursor: se-resize;
  }

  // Hover state - slight scale
  &:hover {
    transform: scale(1.1);
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .crop-handle {
    --ch-bg: white;
    --ch-border: var(--text-secondary, #a0a0a0);
  }
}
</style>
