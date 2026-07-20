<script setup lang="ts">
import type { ImportedImage } from '../types/image'
import IconButton from './IconButton.vue'

defineProps<{ image: ImportedImage; active: boolean }>()
defineEmits<{ select: []; remove: [] }>()
</script>

<template>
  <li
    class="image-grid-item"
    :class="{ 'image-grid-item--active': active }"
    @click="$emit('select')"
  >
    <img :src="image.url" :alt="image.name" class="image-grid-item__thumb" />
    <span class="image-grid-item__name">{{ image.name }}</span>
    <span
      v-if="image.status !== 'ready'"
      class="image-grid-item__status"
      :class="`image-grid-item__status--${image.status}`"
      :title="image.status"
    />
    <IconButton label="Remove" @click.stop="$emit('remove')">✕</IconButton>
  </li>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.image-grid-item {
  display: flex;
  align-items: center;
  gap: $space-xs;
  padding: $space-xs $space-sm;
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover {
    background: $color-surface-hover;
  }

  &--active {
    background: $color-surface-hover;
    outline: 2px solid $color-primary;
    outline-offset: -2px;
  }
}

.image-grid-item__thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.image-grid-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85rem;
}

.image-grid-item__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &--exporting {
    background: $color-warning;
  }

  &--done {
    background: $color-success;
  }

  &--error {
    background: $color-danger;
  }
}
</style>
