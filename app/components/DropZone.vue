<template>
  <div
    v-if="isMounted"
    ref="dropzoneRef"
    class="dropzone"
    :class="{
      'dropzone--dragging': isDragging,
      'dropzone--empty': showEmptyState,
    }"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- Hidden file input -->
    <input
      ref="inputRef"
      type="file"
      multiple
      accept="image/*"
      class="dropzone__input"
      @change="handleFileInput"
    >

    <!-- Drop zone content -->
    <div class="dropzone__content">
      <!-- Upload icon with animation -->
      <div class="dropzone__icon-wrapper">
        <svg
          class="dropzone__icon"
          :class="{ 'dropzone__icon--animated': isDragging }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <!-- Text content -->
      <div class="dropzone__text">
        <p v-if="!isDragging && fileCount === 0" class="dropzone__title">
          {{ title }}
        </p>
        <p v-else-if="isDragging" class="dropzone__title dropzone__title--active">
          Drop images here
        </p>
        <p v-else class="dropzone__count">
          {{ fileCount }} {{ fileCount === 1 ? 'image' : 'images' }} ready
        </p>
      </div>

      <!-- Browse button -->
      <button
        type="button"
        class="dropzone__button"
        @click="openFilePicker"
      >
        Browse
      </button>
    </div>

    <!-- Transition overlay for drag state -->
    <div v-if="isDragging" class="dropzone__overlay" />
  </div>

  <!-- SSR placeholder -->
  <div v-else class="dropzone dropzone--ssr">
    <div class="dropzone__content">
      <div class="dropzone__icon-wrapper">
        <svg
          class="dropzone__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <p class="dropzone__title">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFileUpload } from '~/composables/useFileUpload'

export interface DropZoneProps {
  title?: string
  maxFiles?: number
  maxSize?: number
}

// SSR-safe: only render dropzone after mount
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const props = withDefaults(defineProps<DropZoneProps>(), {
  title: 'Drop images here or click to browse',
  maxFiles: 50,
  maxSize: 100 * 1024 * 1024, // 100MB
})

const emit = defineEmits<{
  (e: 'files-added', files: File[]): void
}>()

const {
  isDragging,
  dropzoneRef,
  inputRef,
  openFilePicker,
  addFiles,
  files,
} = useFileUpload({
  maxFiles: props.maxFiles,
  maxSize: props.maxSize,
})

// File count for display
const fileCount = computed(() => files.value.length)

// Whether to show the empty/prominent state
const showEmptyState = computed(() => fileCount.value === 0)

// Expose openFilePicker for imperative use
defineExpose({
  openFilePicker,
})

// Event handlers that forward to useFileUpload
function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  // Counter-based tracking is handled by useFileUpload
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  // Counter-based tracking is handled by useFileUpload
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()

  const droppedFiles = Array.from(e.dataTransfer?.files || [])
  if (droppedFiles.length > 0) {
    addFiles(droppedFiles)
    emit('files-added', droppedFiles)
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  if (selectedFiles.length > 0) {
    addFiles(selectedFiles)
    emit('files-added', selectedFiles)
  }
  // Reset input so same file can be selected again
  target.value = ''
}
</script>

<style lang="scss" scoped>
.dropzone {
  --dz-border-color: var(--border, #e0e0e0);
  --dz-border-color-active: var(--accent, #3b82f6);
  --dz-bg: var(--bg-secondary, #f5f5f5);
  --dz-bg-active: var(--bg-tertiary, #ebebeb);
  --dz-text: var(--text-primary, #1a1a1a);
  --dz-text-secondary: var(--text-secondary, #666666);
  --dz-accent: var(--accent, #3b82f6);
  --dz-transition: 150ms ease;

  position: relative;
  border: 2px dashed var(--dz-border-color);
  border-radius: 8px;
  background: var(--dz-bg);
  transition: border-color var(--dz-transition), background var(--dz-transition);
  cursor: pointer;

  &--empty {
    border-style: dashed;
  }

  &--dragging {
    border-color: var(--dz-border-color-active);
    border-style: solid;
    background: var(--dz-bg-active);
  }

  &--ssr {
    cursor: default;
  }

  &__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 24px;
    text-align: center;
  }

  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: var(--dz-text-secondary);
    transition: color var(--dz-transition), transform var(--dz-transition);
  }

  &__icon {
    width: 32px;
    height: 32px;

    &--animated {
      animation: bounce 0.5s ease infinite;
    }
  }

  &__text {
    min-height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--dz-text);
    transition: color var(--dz-transition);

    &--active {
      color: var(--dz-accent);
      font-weight: 600;
    }
  }

  &__count {
    margin: 0;
    font-size: 14px;
    color: var(--dz-text-secondary);
  }

  &__button {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    background: var(--dz-accent);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background var(--dz-transition), transform 100ms ease;

    &:hover {
      background: var(--accent-hover, #2563eb);
    }

    &:active {
      transform: scale(0.98);
    }

    &:focus-visible {
      outline: 2px solid var(--dz-accent);
      outline-offset: 2px;
    }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(59, 130, 246, 0.05);
    border-radius: 6px;
    pointer-events: none;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .dropzone {
    --dz-border-color: var(--border, #404040);
    --dz-bg: var(--bg-secondary, #2d2d2d);
    --dz-bg-active: var(--bg-tertiary, #3d3d3d);
    --dz-text: var(--text-primary, #f5f5f5);
    --dz-text-secondary: var(--text-secondary, #a0a0a0);
    --dz-accent: var(--accent, #60a5fa);
    --dz-border-color-active: var(--accent, #60a5fa);
  }
}
</style>
