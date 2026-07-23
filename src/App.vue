<script setup lang="ts">
import { watch } from 'vue'
import { useImageStore } from './stores/useImageStore'
import { useSettingsStore } from './stores/useSettingsStore'
import { getCenteredCropRect, getFocalCropRect } from './composables/useCropEngine'
import DropZone from './components/DropZone.vue'
import ImageGrid from './components/ImageGrid.vue'
import CropWorkspace from './components/CropWorkspace.vue'
import RatioControls from './components/RatioControls.vue'
import AiCropPanel from './components/AiCropPanel.vue'
import ExportPanel from './components/ExportPanel.vue'
import ToastNotification from './components/ToastNotification.vue'

const imageStore = useImageStore()
const settingsStore = useSettingsStore()

// Selecting a ratio applies it to the whole batch by default; per-image pan/zoom
// adjustments are then layered on top until the ratio changes again. Images with an
// AI-detected focal point stay centered on that point instead of the geometric center.
watch(
  () => settingsStore.ratio,
  (ratio) => {
    imageStore.applyToAll((image) =>
      image.focalPoint
        ? getFocalCropRect(image.naturalWidth, image.naturalHeight, ratio, image.focalPoint.x, image.focalPoint.y)
        : getCenteredCropRect(image.naturalWidth, image.naturalHeight, ratio),
    )
  },
)
</script>

<template>
  <div class="app">
    <header class="app__header">
      <h1 class="app__title">Bulk Image Cropper</h1>
    </header>

    <main class="app__main">
      <template v-if="imageStore.images.length">
        <ImageGrid class="app__sidebar" />
        <CropWorkspace class="app__workspace" />
        <div class="app__panel">
          <RatioControls />
          <AiCropPanel />
          <ExportPanel />
        </div>
      </template>
      <div v-else class="app__empty">
        <DropZone />
      </div>
    </main>

    <ToastNotification />
  </div>
</template>

<style lang="scss">
@use './assets/styles/variables' as *;

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app__header {
  padding: $space-md $space-lg;
  border-bottom: 1px solid $color-border;
  background: $color-surface;
  flex-shrink: 0;
}

.app__title {
  margin: 0;
  font-size: 1.25rem;
}

.app__main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.app__sidebar {
  width: $sidebar-width;
  border-right: 1px solid $color-border;
  flex-shrink: 0;
}

.app__workspace {
  flex: 1;
  min-width: 0;
}

.app__panel {
  width: $panel-width;
  flex-shrink: 0;
  border-left: 1px solid $color-border;
  padding: $space-lg;
  display: flex;
  flex-direction: column;
  gap: $space-lg;
  overflow-y: auto;
  background: $color-surface;
}

.app__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-xl;
}
</style>
