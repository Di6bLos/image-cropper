<script setup lang="ts">
import { useSettingsStore, RATIO_PRESETS } from '../stores/useSettingsStore'
import { useImageStore } from '../stores/useImageStore'
import { getCenteredCropRect } from '../composables/useCropEngine'
import { useToast } from '../composables/useToast'

const settingsStore = useSettingsStore()
const imageStore = useImageStore()
const { show } = useToast()

function selectPreset(index: number) {
  settingsStore.mode = 'preset'
  settingsStore.presetIndex = index
}

function resetCropCenter() {
  const ratio = settingsStore.ratio
  imageStore.clearFocalPoints()
  imageStore.applyToAll((image) => getCenteredCropRect(image.naturalWidth, image.naturalHeight, ratio))
  show('Crop reset to center on all images', 'success')
}
</script>

<template>
  <section class="ratio-controls">
    <h2 class="ratio-controls__heading">Crop ratio</h2>

    <div class="ratio-controls__presets">
      <button
        v-for="(preset, index) in RATIO_PRESETS"
        :key="preset.label"
        type="button"
        class="ratio-controls__preset"
        :class="{ 'ratio-controls__preset--active': settingsStore.mode === 'preset' && settingsStore.presetIndex === index }"
        @click="selectPreset(index)"
      >
        {{ preset.label }}
      </button>
    </div>

    <label class="ratio-controls__option">
      <input
        type="radio"
        name="ratio-mode"
        :checked="settingsStore.mode === 'custom-ratio'"
        @change="settingsStore.mode = 'custom-ratio'"
      />
      Custom ratio
      <span class="ratio-controls__pair">
        <input
          type="number"
          min="1"
          v-model.number="settingsStore.customRatioWidth"
          @focus="settingsStore.mode = 'custom-ratio'"
        />
        <span>:</span>
        <input
          type="number"
          min="1"
          v-model.number="settingsStore.customRatioHeight"
          @focus="settingsStore.mode = 'custom-ratio'"
        />
      </span>
    </label>

    <label class="ratio-controls__option">
      <input
        type="radio"
        name="ratio-mode"
        :checked="settingsStore.mode === 'custom-px'"
        @change="settingsStore.mode = 'custom-px'"
      />
      Custom size (px)
      <span class="ratio-controls__pair">
        <input
          type="number"
          min="1"
          v-model.number="settingsStore.customPxWidth"
          @focus="settingsStore.mode = 'custom-px'"
        />
        <span>×</span>
        <input
          type="number"
          min="1"
          v-model.number="settingsStore.customPxHeight"
          @focus="settingsStore.mode = 'custom-px'"
        />
      </span>
    </label>

    <button
      type="button"
      class="ratio-controls__apply"
      :disabled="!imageStore.images.length"
      @click="resetCropCenter"
    >
      Reset all image crops
    </button>
  </section>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.ratio-controls {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
}

.ratio-controls__heading {
  margin: 0;
  font-size: 1rem;
}

.ratio-controls__presets {
  display: flex;
  flex-wrap: wrap;
  gap: $space-xs;
}

.ratio-controls__preset {
  padding: $space-xs $space-sm;
  margin-bottom: $space-sm;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-surface;
  cursor: pointer;

  &:hover {
    background: $color-surface-hover;
  }

  &--active {
    border-color: $color-primary;
    background: $color-primary;
    color: #fff;
  }
}

.ratio-controls__option {
  display: flex;
  align-items: center;
  gap: $space-xs;
  font-size: 0.9rem;
}

.ratio-controls__pair {
  display: flex;
  align-items: center;
  gap: $space-xs;

  input {
    width: 64px;
    padding: $space-xs;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
  }
}

.ratio-controls__apply {
  margin-top: $space-xs;
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
</style>
