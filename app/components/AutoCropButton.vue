<template>
  <button
    type="button"
    class="auto-crop-button"
    :class="[`auto-crop-button--${size}`]"
    :disabled="disabled || isProcessing"
    :aria-label="isProcessing ? 'Detecting subject...' : 'Auto crop'"
    :title="isProcessing ? 'Detecting subject...' : 'Auto crop'"
    @click="$emit('click', $event)"
  >
    <!-- Spinner during processing -->
    <svg
      v-if="isProcessing"
      class="auto-crop-button__spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
    </svg>

    <!-- Sparkles icon when not processing -->
    <svg
      v-else
      class="auto-crop-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" />
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" />
    </svg>

    <!-- Button text -->
    <span class="auto-crop-button__label">
      {{ isProcessing ? 'Detecting subject...' : 'Auto crop' }}
    </span>
  </button>
</template>

<script setup lang="ts">
export interface AutoCropButtonProps {
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  isProcessing?: boolean
}

withDefaults(defineProps<AutoCropButtonProps>(), {
  size: 'lg',
  disabled: false,
  isProcessing: false,
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<style lang="scss" scoped>
.auto-crop-button {
  --acb-accent: var(--accent, #3b82f6);
  --acb-accent-hover: var(--accent-hover, #2563eb);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--acb-accent);
  border-radius: 6px;
  background: var(--acb-accent);
  color: white;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: background 150ms ease, border-color 150ms ease, transform 100ms ease;

  &:focus-visible {
    outline: 2px solid var(--acb-accent);
    outline-offset: 2px;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  // Size variants
  &--sm {
    padding: 6px 12px;
    font-size: 12px;

    .auto-crop-button__icon,
    .auto-crop-button__spinner {
      width: 14px;
      height: 14px;
    }
  }

  &--md {
    padding: 8px 16px;
    font-size: 13px;

    .auto-crop-button__icon,
    .auto-crop-button__spinner {
      width: 16px;
      height: 16px;
    }
  }

  &--lg {
    padding: 10px 20px;
    font-size: 14px;

    .auto-crop-button__icon,
    .auto-crop-button__spinner {
      width: 18px;
      height: 18px;
    }
  }

  &__icon {
    flex-shrink: 0;
  }

  &__spinner {
    flex-shrink: 0;
    animation: spin 800ms ease-in-out infinite;
  }

  &__label {
    white-space: nowrap;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .auto-crop-button {
    --acb-accent: var(--accent, #60a5fa);
    --acb-accent-hover: var(--accent-hover, #3b82f6);
  }
}
</style>
