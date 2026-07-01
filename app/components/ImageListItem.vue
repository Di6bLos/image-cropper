<template>
  <div
    v-if="isMounted"
    class="image-list-item"
    :class="{
      'image-list-item--selected': isSelected,
    }"
    role="button"
    tabindex="0"
    :aria-selected="isSelected"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Thumbnail -->
    <div class="image-list-item__thumbnail">
      <img
        v-if="image.thumbnailUrl"
        :src="image.thumbnailUrl"
        :alt="image.filename"
        class="image-list-item__img"
        loading="lazy"
      >
      <div v-else class="image-list-item__placeholder">
        <svg
          class="image-list-item__placeholder-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    </div>

    <!-- Info -->
    <div class="image-list-item__info">
      <p class="image-list-item__filename" :title="image.filename">
        {{ image.filename }}
      </p>
      <p class="image-list-item__dimensions">
        {{ image.originalWidth }} x {{ image.originalHeight }}
      </p>
    </div>

    <!-- Selection ring indicator -->
    <div v-if="isSelected" class="image-list-item__ring" />
  </div>

  <!-- SSR placeholder -->
  <div v-else class="image-list-item image-list-item--ssr">
    <div class="image-list-item__thumbnail">
      <div class="image-list-item__placeholder">
        <svg
          class="image-list-item__placeholder-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    </div>
    <div class="image-list-item__info">
      <p class="image-list-item__filename">{{ image.filename }}</p>
      <p class="image-list-item__dimensions">{{ image.originalWidth }} x {{ image.originalHeight }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImageItem } from '~/stores/useImageStore'

export interface ImageListItemProps {
  image: ImageItem
  isSelected?: boolean
}

// SSR-safe: only render after mount
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const props = withDefaults(defineProps<ImageListItemProps>(), {
  isSelected: false,
})

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

function handleClick() {
  emit('select', props.image.id)
}
</script>

<style lang="scss" scoped>
.image-list-item {
  --ili-bg: var(--bg-secondary, #f5f5f5);
  --ili-bg-hover: var(--bg-tertiary, #ebebeb);
  --ili-bg-selected: var(--bg-tertiary, #ebebeb);
  --ili-text: var(--text-primary, #1a1a1a);
  --ili-text-secondary: var(--text-secondary, #666666);
  --ili-accent: var(--accent, #3b82f6);
  --ili-border: var(--border, #e0e0e0);

  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--ili-bg);
  border: 1px solid var(--ili-border);
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;

  &:hover {
    background: var(--ili-bg-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--ili-accent);
    outline-offset: 2px;
  }

  &--selected {
    background: var(--ili-bg-selected);
    border-color: var(--ili-accent);
    border-width: 2px;
    padding: 7px; // Compensate for thicker border
  }

  &--ssr {
    cursor: default;
  }

  &__thumbnail {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary, #ffffff);
    border-radius: 4px;
    overflow: hidden;
  }

  &__img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  &__placeholder-icon {
    width: 32px;
    height: 32px;
    color: var(--ili-text-secondary);
    opacity: 0.5;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__filename {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--ili-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__dimensions {
    margin: 0;
    font-size: 12px;
    color: var(--ili-text-secondary);
  }

  &__ring {
    position: absolute;
    inset: -3px;
    border: 2px solid var(--ili-accent);
    border-radius: 10px;
    pointer-events: none;
    animation: ring-appear 150ms ease;
  }
}

@keyframes ring-appear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .image-list-item {
    --ili-bg: var(--bg-secondary, #2d2d2d);
    --ili-bg-hover: var(--bg-tertiary, #3d3d3d);
    --ili-bg-selected: var(--bg-tertiary, #3d3d3d);
    --ili-text: var(--text-primary, #f5f5f5);
    --ili-text-secondary: var(--text-secondary, #a0a0a0);
    --ili-accent: var(--accent, #60a5fa);
    --ili-border: var(--border, #404040);
  }
}
</style>
