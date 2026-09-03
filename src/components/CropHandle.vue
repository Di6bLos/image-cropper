<script setup lang="ts">
import type { CropHandlePosition } from '../composables/useCropEngine'

defineProps<{ position: CropHandlePosition }>()
</script>

<template>
  <div class="crop-handle" :class="`crop-handle--${position}`" />
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.crop-handle {
  position: absolute;
  background: $color-primary;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  touch-action: none;
}

// Corners — dots
.crop-handle--nw,
.crop-handle--ne,
.crop-handle--se,
.crop-handle--sw {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.crop-handle--nw {
  top: -7px;
  left: -7px;
  cursor: nwse-resize;
}

.crop-handle--ne {
  top: -7px;
  right: -7px;
  cursor: nesw-resize;
}

.crop-handle--se {
  bottom: -7px;
  right: -7px;
  cursor: nwse-resize;
}

.crop-handle--sw {
  bottom: -7px;
  left: -7px;
  cursor: nesw-resize;
}

// Edges — bars centered on each side
.crop-handle--n,
.crop-handle--s {
  left: 50%;
  width: 24px;
  height: 8px;
  border-radius: 4px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.crop-handle--n {
  top: -5px;
}

.crop-handle--s {
  bottom: -5px;
}

.crop-handle--e,
.crop-handle--w {
  top: 50%;
  width: 8px;
  height: 24px;
  border-radius: 4px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.crop-handle--e {
  right: -5px;
}

.crop-handle--w {
  left: -5px;
}
</style>
