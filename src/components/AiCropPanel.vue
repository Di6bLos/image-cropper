<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImageStore } from '../stores/useImageStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { runAiCrop } from '../composables/useAiCrop'
import { useToast } from '../composables/useToast'

const imageStore = useImageStore()
const settingsStore = useSettingsStore()
const { show } = useToast()

const isRunning = ref(false)
const progress = ref({ completed: 0, total: 0 })

const canRun = computed(() => imageStore.images.length > 0 && !isRunning.value)

async function runAll() {
  if (!imageStore.images.length) return
  isRunning.value = true
  progress.value = { completed: 0, total: imageStore.images.length }

  try {
    const { succeeded, failed } = await runAiCrop(imageStore.images, settingsStore.ratio, {
      onProgress: (completed, total) => {
        progress.value = { completed, total }
      },
    })

    if (failed === 0) {
      show(`AI-cropped ${succeeded} of ${succeeded} image${succeeded === 1 ? '' : 's'}`, 'success')
    } else {
      show(`AI cropping finished with ${failed} failure${failed === 1 ? '' : 's'}`, 'error')
    }
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <section class="ai-crop-panel">
    <h2 class="ai-crop-panel__heading">AI crop</h2>

    <button type="button" class="ai-crop-panel__button" :disabled="!canRun" @click="runAll">
      {{ isRunning ? `Analyzing ${progress.completed}/${progress.total}…` : 'AI Crop all images' }}
    </button>

    <p class="ai-crop-panel__hint">
      Have Gemini find the best view.
    </p>

    <div v-if="isRunning" class="ai-crop-panel__progress">
      <div
        class="ai-crop-panel__progress-bar"
        :style="{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.ai-crop-panel {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
}

.ai-crop-panel__heading {
  margin: 0;
  font-size: 1rem;
}

.ai-crop-panel__button {
  padding: $space-sm;
  border: none;
  border-radius: $radius-sm;
  background: $color-primary;
  color: #fff;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: $color-primary-hover;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ai-crop-panel__hint {
  margin: 0;
  font-size: 0.8rem;
  color: $color-text-muted;
}

.ai-crop-panel__progress {
  height: 6px;
  border-radius: 3px;
  background: $color-surface-hover;
  overflow: hidden;
}

.ai-crop-panel__progress-bar {
  height: 100%;
  background: $color-primary;
  transition: width 0.15s ease;
}
</style>
