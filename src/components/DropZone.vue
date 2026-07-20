<script setup lang="ts">
import { ref } from 'vue'
import { useFileImport } from '../composables/useFileImport'

const { importFiles } = useFileImport()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function onDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) importFiles(files)
}

function onFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) importFiles(target.files)
  target.value = ''
}

function openPicker() {
  fileInput.value?.click()
}
</script>

<template>
  <div
    class="drop-zone"
    :class="{ 'drop-zone--active': isDragging }"
    role="button"
    tabindex="0"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="openPicker"
    @keydown.enter="openPicker"
    @keydown.space.prevent="openPicker"
  >
    <p class="drop-zone__title">Drag &amp; drop images here</p>
    <p class="drop-zone__subtitle">or click to browse — you can select multiple files</p>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="drop-zone__input"
      @change="onFileInputChange"
    />
  </div>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  padding: $space-xl;
  border: 2px dashed $color-border;
  border-radius: $radius-lg;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover,
  &:focus-visible {
    border-color: $color-primary;
    background: $color-surface-hover;
  }

  &--active {
    border-color: $color-primary;
    background: $color-surface-hover;
  }
}

.drop-zone__title {
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
}

.drop-zone__subtitle {
  margin: 0;
  color: $color-text-muted;
  font-size: 0.9rem;
}

.drop-zone__input {
  display: none;
}
</style>
