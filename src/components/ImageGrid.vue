<script setup lang="ts">
import { useImageStore } from '../stores/useImageStore'
import ImageGridItem from './ImageGridItem.vue'
import DropZone from './DropZone.vue'

const imageStore = useImageStore()
</script>

<template>
  <aside class="image-grid">
    <div class="image-grid__header">
      <h2 class="image-grid__heading">Images ({{ imageStore.images.length }})</h2>
      <button
        v-if="imageStore.images.length"
        type="button"
        class="image-grid__clear"
        @click="imageStore.clearAll()"
      >
        Clear all
      </button>
    </div>
    <div class="image-grid__body">
      <ul class="image-grid__list">
        <ImageGridItem
          v-for="image in imageStore.images"
          :key="image.id"
          :image="image"
          :active="image.id === imageStore.activeImageId"
          @select="imageStore.setActiveImage(image.id)"
          @remove="imageStore.removeImage(image.id)"
        />
      </ul>
      <DropZone class="image-grid__dropzone"/>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.image-grid {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.image-grid__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-md;
  border-bottom: 1px solid $color-border;
}

.image-grid__heading {
  margin: 0;
  font-size: 0.95rem;
}

.image-grid__clear {
  border: none;
  background: transparent;
  color: $color-text-muted;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: $color-danger;
  }
}

.image-grid__body {
  position: relative;
  flex: 1;
  min-height: 0;
}

.image-grid__list {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: $space-xs;
  padding-bottom: 12.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.image-grid__dropzone {
  position: absolute;
  left: $space-xs;
  right: $space-xs;
  bottom: $space-xs;
  background: $color-surface;
  box-shadow: 0 -8px 12px -4px rgba(0, 0, 0, 0.08);
}
</style>
