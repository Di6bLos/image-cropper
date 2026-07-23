<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useImageStore } from '../stores/useImageStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { getCenteredCropRect, panCropRect, resizeCropRect } from '../composables/useCropEngine'
import { runAiCrop } from '../composables/useAiCrop'
import { exportImages } from '../composables/useImageExport'
import { downloadBlob } from '../composables/useZipExport'
import { useToast } from '../composables/useToast'
import type { CropRect } from '../types/image'
import CropHandle from './CropHandle.vue'

const imageStore = useImageStore()
const settingsStore = useSettingsStore()
const { show } = useToast()

const imageRef = ref<HTMLImageElement | null>(null)
const displayScale = ref(1)
const imageOffset = ref({ left: 0, top: 0 })

const activeImage = computed(() => imageStore.activeImage)
const isAiCropping = computed(() => activeImage.value?.aiCropStatus === 'analyzing')
const isExporting = ref(false)

async function aiCropActive() {
  const image = activeImage.value
  if (!image || isAiCropping.value) return

  const { failed } = await runAiCrop([image], settingsStore.ratio)
  if (failed === 0) {
    show('AI-cropped image', 'success')
  } else {
    show('AI crop failed', 'error')
  }
}

async function exportActive() {
  const image = activeImage.value
  if (!image || isExporting.value) return

  isExporting.value = true
  imageStore.setStatus(image.id, 'exporting')
  try {
    const [file] = await exportImages([image], {
      format: settingsStore.outputFormat,
      quality: settingsStore.quality,
      outputSize: settingsStore.outputSize,
    })

    if (file) {
      downloadBlob(file.blob, file.name)
      imageStore.setStatus(image.id, 'done')
      show('Exported image', 'success')
    } else {
      imageStore.setStatus(image.id, 'error')
      show('Export failed', 'error')
    }
  } finally {
    isExporting.value = false
  }
}

function updateScale() {
  const img = imageRef.value
  if (!img || !activeImage.value) return
  displayScale.value = img.clientWidth / activeImage.value.naturalWidth
  // The <img> is centered (letterboxed) inside the stage by flexbox, so its rendered
  // box isn't necessarily flush with the stage's top-left corner — account for that
  // offset or the crop overlay drifts away from the image whenever aspect ratios differ.
  imageOffset.value = { left: img.offsetLeft, top: img.offsetTop }
}

const overlayStyle = computed(() => {
  const image = activeImage.value
  if (!image?.cropRect) return {}
  const scale = displayScale.value
  const offset = imageOffset.value
  return {
    left: `${offset.left + image.cropRect.x * scale}px`,
    top: `${offset.top + image.cropRect.y * scale}px`,
    width: `${image.cropRect.width * scale}px`,
    height: `${image.cropRect.height * scale}px`,
  }
})

let panState: { startX: number; startY: number; originX: number; originY: number } | null = null

function onOverlayPointerDown(event: PointerEvent) {
  const image = activeImage.value
  if (!image?.cropRect) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  panState = {
    startX: event.clientX,
    startY: event.clientY,
    originX: image.cropRect.x,
    originY: image.cropRect.y,
  }
}

function onOverlayPointerMove(event: PointerEvent) {
  const image = activeImage.value
  if (!panState || !image?.cropRect) return
  const scale = displayScale.value
  const dx = (event.clientX - panState.startX) / scale
  const dy = (event.clientY - panState.startY) / scale
  const nextRect = panCropRect(
    { ...image.cropRect, x: panState.originX, y: panState.originY },
    dx,
    dy,
    image.naturalWidth,
    image.naturalHeight,
  )
  imageStore.setCropRect(image.id, nextRect)
}

function onOverlayPointerUp() {
  panState = null
}

let resizeState: { startX: number; rect: CropRect } | null = null

function onHandlePointerDown(event: PointerEvent) {
  const image = activeImage.value
  if (!image?.cropRect) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  resizeState = { startX: event.clientX, rect: { ...image.cropRect } }
}

function onHandlePointerMove(event: PointerEvent) {
  const image = activeImage.value
  if (!resizeState || !image) return
  const scale = displayScale.value
  const delta = (event.clientX - resizeState.startX) / scale
  const nextRect = resizeCropRect(resizeState.rect, delta, settingsStore.ratio, image.naturalWidth, image.naturalHeight)
  imageStore.setCropRect(image.id, nextRect)
}

function onHandlePointerUp() {
  resizeState = null
}

function resetCrop() {
  const image = activeImage.value
  if (!image) return
  imageStore.setCropRect(image.id, getCenteredCropRect(image.naturalWidth, image.naturalHeight, settingsStore.ratio))
}

onMounted(() => window.addEventListener('resize', updateScale))
onBeforeUnmount(() => window.removeEventListener('resize', updateScale))
watch(activeImage, () => requestAnimationFrame(updateScale))
</script>

<template>
  <div class="crop-workspace">
    <template v-if="activeImage">
      <div class="crop-workspace__toolbar">
        <span class="crop-workspace__filename">{{ activeImage.name }}</span>
        <div class="crop-workspace__actions">
          <button
            type="button"
            class="crop-workspace__ai-crop"
            :disabled="isAiCropping"
            @click="aiCropActive"
          >
            {{ isAiCropping ? 'Analyzing…' : 'AI Crop' }}
          </button>
          <button type="button" class="crop-workspace__reset" @click="resetCrop">Reset Crop</button>
          <button
            type="button"
            class="crop-workspace__export"
            :disabled="isExporting"
            @click="exportActive"
          >
            {{ isExporting ? 'Exporting…' : 'Export' }}
          </button>
        </div>
      </div>
      <div class="crop-workspace__stage">
        <img
          ref="imageRef"
          :src="activeImage.url"
          :alt="activeImage.name"
          class="crop-workspace__image"
          @load="updateScale"
        />
        <div
          v-if="activeImage.cropRect"
          class="crop-workspace__overlay"
          :style="overlayStyle"
          @pointerdown="onOverlayPointerDown"
          @pointermove="onOverlayPointerMove"
          @pointerup="onOverlayPointerUp"
          @pointercancel="onOverlayPointerUp"
        >
          <CropHandle
            @pointerdown.stop="onHandlePointerDown"
            @pointermove.stop="onHandlePointerMove"
            @pointerup.stop="onHandlePointerUp"
            @pointercancel.stop="onHandlePointerUp"
          />
        </div>
      </div>
    </template>
    <p v-else class="crop-workspace__empty">Import images to start cropping.</p>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.crop-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $space-lg;
}

.crop-workspace__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-md;
}

.crop-workspace__filename {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crop-workspace__actions {
  display: flex;
  gap: $space-xs;
}

.crop-workspace__reset {
  padding: $space-xs $space-sm;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-surface;
  cursor: pointer;

  &:hover {
    background: $color-surface-hover;
  }
}

.crop-workspace__export {
  padding: $space-xs $space-sm;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-surface;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: $color-surface-hover;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.crop-workspace__ai-crop {
  padding: $space-xs $space-sm;
	border: 1px solid $color-border;
	border-radius: $radius-sm;
	background: $color-surface;
	cursor: pointer;

  &:hover:not(:disabled) {
	background: $color-surface-hover;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.crop-workspace__stage {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}

.crop-workspace__image {
  max-width: 100%;
  max-height: 100%;
  display: block;
  user-select: none;
}

.crop-workspace__overlay {
  position: absolute;
  border: 2px solid $color-primary;
  background: rgba(52, 87, 213, 0.12);
  cursor: move;
  touch-action: none;
}

.crop-workspace__empty {
  margin: auto;
  color: $color-text-muted;
}
</style>
