<template>
  <div class="ratio-controls">
    <!-- Mode tabs -->
    <div class="ratio-controls__tabs">
      <button
        type="button"
        class="ratio-controls__tab"
        :class="{ 'ratio-controls__tab--active': currentMode === 'ratio' }"
        @click="setMode('ratio')"
      >
        Ratio
      </button>
      <button
        type="button"
        class="ratio-controls__tab"
        :class="{ 'ratio-controls__tab--active': currentMode === 'pixel' }"
        @click="setMode('pixel')"
      >
        Pixel
      </button>
    </div>

    <!-- Ratio mode content -->
    <div v-if="currentMode === 'ratio'" class="ratio-controls__content">
      <!-- Preset buttons -->
      <div class="ratio-controls__presets">
        <button
          v-for="preset in ratioPresets"
          :key="preset.value"
          type="button"
          class="ratio-controls__preset"
          :class="{ 'ratio-controls__preset--active': currentPreset === preset.value }"
          @click="selectPreset(preset.value)"
        >
          {{ preset.label }}
        </button>
        <button
          type="button"
          class="ratio-controls__preset"
          :class="{ 'ratio-controls__preset--active': currentPreset === 'custom' }"
          @click="selectPreset('custom')"
        >
          Custom
        </button>
      </div>

      <!-- Custom ratio input section -->
      <div v-if="showCustom" class="ratio-controls__custom">
        <div class="ratio-controls__custom-row">
          <div class="ratio-controls__field">
            <label class="ratio-controls__label" for="custom-width">W</label>
            <input
              id="custom-width"
              v-model.number="customWidth"
              type="number"
              min="1"
              max="10000"
              class="ratio-controls__input"
              :class="{ 'ratio-controls__input--error': customWidthError }"
              @input="validateCustomRatio"
            >
          </div>
          <span class="ratio-controls__separator">:</span>
          <div class="ratio-controls__field">
            <label class="ratio-controls__label" for="custom-height">H</label>
            <input
              id="custom-height"
              v-model.number="customHeight"
              type="number"
              min="1"
              max="10000"
              class="ratio-controls__input"
              :class="{ 'ratio-controls__input--error': customHeightError }"
              @input="validateCustomRatio"
            >
          </div>
        </div>
        <p v-if="customWidthError || customHeightError" class="ratio-controls__error">
          {{ customWidthError || customHeightError }}
        </p>
        <button
          type="button"
          class="ratio-controls__apply"
          :disabled="!customRatioValid"
          @click="applyCustomRatio"
        >
          Apply
        </button>
      </div>
    </div>

    <!-- Pixel mode content -->
    <div v-else class="ratio-controls__content">
      <div class="ratio-controls__pixel-row">
        <div class="ratio-controls__field">
          <label class="ratio-controls__label" for="pixel-width">Width</label>
          <input
            id="pixel-width"
            v-model.number="pixelWidth"
            type="number"
            min="1"
            max="10000"
            class="ratio-controls__input"
            :class="{ 'ratio-controls__input--error': pixelWidthError }"
            @input="validatePixelDimensions"
          >
        </div>
        <span class="ratio-controls__separator">x</span>
        <div class="ratio-controls__field">
          <label class="ratio-controls__label" for="pixel-height">Height</label>
          <input
            id="pixel-height"
            v-model.number="pixelHeight"
            type="number"
            min="1"
            max="10000"
            class="ratio-controls__input"
            :class="{ 'ratio-controls__input--error': pixelHeightError }"
            @input="validatePixelDimensions"
          >
        </div>
      </div>
      <p v-if="pixelWidthError || pixelHeightError" class="ratio-controls__error">
        {{ pixelWidthError || pixelHeightError }}
      </p>
      <button
        type="button"
        class="ratio-controls__apply"
        :disabled="!pixelDimensionsValid"
        @click="applyPixelDimensions"
      >
        Apply
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCropStore, type RatioPreset } from '~/stores/useCropStore'

const cropStore = useCropStore()

// Preset definitions
const ratioPresets = [
  { label: '16:9', value: '16:9' as const },
  { label: '3:2', value: '3:2' as const },
  { label: '1:1', value: '1:1' as const },
  { label: '2:3', value: '2:3' as const },
]

// Local state synced from store
const currentMode = computed(() => cropStore.ratioState.mode)
const currentPreset = computed(() => cropStore.ratioState.preset)
const showCustom = computed(() => currentPreset.value === 'custom')

// Custom ratio inputs
const customWidth = ref(cropStore.ratioState.customWidth)
const customHeight = ref(cropStore.ratioState.customHeight)
const customWidthError = ref('')
const customHeightError = ref('')
const customRatioValid = computed(() => {
  return customWidth.value > 0 && customHeight.value > 0 && !customWidthError.value && !customHeightError.value
})

// Pixel dimension inputs
const pixelWidth = ref(cropStore.ratioState.pixelWidth)
const pixelHeight = ref(cropStore.ratioState.pixelHeight)
const pixelWidthError = ref('')
const pixelHeightError = ref('')
const pixelDimensionsValid = computed(() => {
  return pixelWidth.value > 0 && pixelHeight.value > 0 && !pixelWidthError.value && !pixelHeightError.value
})

// Validation functions
function validateCustomRatio() {
  // Validate width
  if (customWidth.value <= 0) {
    customWidthError.value = 'Must be positive'
  } else if (customWidth.value > 10000) {
    customWidthError.value = 'Max 10000'
  } else {
    customWidthError.value = ''
  }

  // Validate height
  if (customHeight.value <= 0) {
    customHeightError.value = 'Must be positive'
  } else if (customHeight.value > 10000) {
    customHeightError.value = 'Max 10000'
  } else {
    customHeightError.value = ''
  }
}

function validatePixelDimensions() {
  // Validate width
  if (pixelWidth.value <= 0) {
    pixelWidthError.value = 'Must be positive'
  } else if (pixelWidth.value > 10000) {
    pixelWidthError.value = 'Max 10000'
  } else {
    pixelWidthError.value = ''
  }

  // Validate height
  if (pixelHeight.value <= 0) {
    pixelHeightError.value = 'Must be positive'
  } else if (pixelHeight.value > 10000) {
    pixelHeightError.value = 'Max 10000'
  } else {
    pixelHeightError.value = ''
  }
}

// Actions
function setMode(mode: 'ratio' | 'pixel') {
  cropStore.setMode(mode)
}

function selectPreset(preset: RatioPreset) {
  cropStore.setPreset(preset)
}

function applyCustomRatio() {
  if (customRatioValid.value) {
    cropStore.setCustomRatio(customWidth.value, customHeight.value)
  }
}

function applyPixelDimensions() {
  if (pixelDimensionsValid.value) {
    cropStore.setPixelSize(pixelWidth.value, pixelHeight.value)
  }
}
</script>

<style lang="scss" scoped>
.ratio-controls {
  --rc-bg: var(--bg-primary, #ffffff);
  --rc-bg-secondary: var(--bg-secondary, #f5f5f5);
  --rc-bg-tab: var(--bg-tertiary, #ebebeb);
  --rc-text: var(--text-primary, #1a1a1a);
  --rc-text-secondary: var(--text-secondary, #666666);
  --rc-accent: var(--accent, #3b82f6);
  --rc-accent-hover: var(--accent-hover, #2563eb);
  --rc-border: var(--border, #e0e0e0);
  --rc-error: #ef4444;

  background: var(--rc-bg);
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  padding: 16px;

  &__tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--rc-bg-secondary);
    border-radius: 6px;
    margin-bottom: 16px;
  }

  &__tab {
    flex: 1;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--rc-text-secondary);
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 150ms ease, color 150ms ease;

    &:hover {
      color: var(--rc-text);
    }

    &--active {
      color: var(--rc-text);
      background: var(--rc-bg);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    &:focus-visible {
      outline: 2px solid var(--rc-accent);
      outline-offset: 2px;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__preset {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--rc-text);
    background: var(--rc-bg-tab);
    border: 1px solid var(--rc-border);
    border-radius: 6px;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease, color 150ms ease;

    &:hover {
      background: var(--rc-bg-secondary);
      border-color: var(--rc-text-secondary);
    }

    &--active {
      color: white;
      background: var(--rc-accent);
      border-color: var(--rc-accent);

      &:hover {
        background: var(--rc-accent-hover);
        border-color: var(--rc-accent-hover);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--rc-accent);
      outline-offset: 2px;
    }
  }

  &__custom,
  &__pixel-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__custom-row,
  &__pixel-row {
    flex-direction: row;
    align-items: center;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  &__label {
    font-size: 11px;
    font-weight: 500;
    color: var(--rc-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__input {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    color: var(--rc-text);
    background: var(--rc-bg);
    border: 1px solid var(--rc-border);
    border-radius: 6px;
    transition: border-color 150ms ease, box-shadow 150ms ease;

    &:hover {
      border-color: var(--rc-text-secondary);
    }

    &:focus {
      outline: none;
      border-color: var(--rc-accent);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &--error {
      border-color: var(--rc-error);

      &:focus {
        border-color: var(--rc-error);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }

    // Hide number input spinners
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &[type='number'] {
      -moz-appearance: textfield;
    }
  }

  &__separator {
    padding: 0 8px;
    font-size: 14px;
    color: var(--rc-text-secondary);
    align-self: flex-end;
    margin-bottom: 8px;
  }

  &__error {
    margin: 0;
    font-size: 12px;
    color: var(--rc-error);
  }

  &__apply {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: white;
    background: var(--rc-accent);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 150ms ease, transform 100ms ease;

    &:hover:not(:disabled) {
      background: var(--rc-accent-hover);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid var(--rc-accent);
      outline-offset: 2px;
    }
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .ratio-controls {
    --rc-bg: var(--bg-primary, #1a1a1a);
    --rc-bg-secondary: var(--bg-secondary, #2d2d2d);
    --rc-bg-tab: var(--bg-tertiary, #3d3d3d);
    --rc-text: var(--text-primary, #f5f5f5);
    --rc-text-secondary: var(--text-secondary, #a0a0a0);
    --rc-accent: var(--accent, #60a5fa);
    --rc-accent-hover: var(--accent-hover, #3b82f6);
    --rc-border: var(--border, #404040);
    --rc-error: #f87171;
  }
}
</style>
