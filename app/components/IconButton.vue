<template>
  <button
    type="button"
    class="icon-button"
    :class="[
      `icon-button--${size}`,
      `icon-button--${variant}`,
    ]"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    @click="$emit('click', $event)"
  >
    <!-- Inline SVG icons -->
    <svg
      v-if="icon === 'plus'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>

    <svg
      v-else-if="icon === 'trash'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>

    <svg
      v-else-if="icon === 'upload'"
      class="icon-button__icon"
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

    <svg
      v-else-if="icon === 'crop'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 2v4" />
      <path d="M18 22v-4" />
      <path d="M2 6h4" />
      <path d="M22 18h-4" />
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>

    <svg
      v-else-if="icon === 'grid'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>

    <svg
      v-else-if="icon === 'close'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>

    <svg
      v-else-if="icon === 'check'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>

    <svg
      v-else-if="icon === 'chevron-down'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>

    <svg
      v-else-if="icon === 'chevron-up'"
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>

    <!-- Default fallback circle with question mark -->
    <svg
      v-else
      class="icon-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>

    <!-- Optional tooltip slot -->
    <span v-if="$slots.default" class="icon-button__tooltip">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
export interface IconButtonProps {
  /** Icon name */
  icon: string
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Button variant */
  variant?: 'default' | 'ghost'
  /** Accessible label */
  ariaLabel: string
}

withDefaults(defineProps<IconButtonProps>(), {
  size: 'md',
  variant: 'default',
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<style lang="scss" scoped>
.icon-button {
  --ib-color: var(--text-primary, #1a1a1a);
  --ib-color-hover: var(--text-primary, #1a1a1a);
  --ib-bg: var(--bg-tertiary, #ebebeb);
  --ib-bg-hover: var(--bg-secondary, #f5f5f5);
  --ib-border: var(--border, #e0e0e0);
  --ib-accent: var(--accent, #3b82f6);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--ib-border);
  border-radius: 6px;
  background: var(--ib-bg);
  color: var(--ib-color);
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease,
    transform 100ms ease, box-shadow 150ms ease;

  &:focus-visible {
    outline: 2px solid var(--ib-accent);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.95);
  }

  // Size variants
  &--sm {
    width: 28px;
    height: 28px;

    .icon-button__icon {
      width: 14px;
      height: 14px;
    }
  }

  &--md {
    width: 36px;
    height: 36px;

    .icon-button__icon {
      width: 18px;
      height: 18px;
    }
  }

  &--lg {
    width: 44px;
    height: 44px;

    .icon-button__icon {
      width: 22px;
      height: 22px;
    }
  }

  // Variant: ghost (no background, no border)
  &--ghost {
    background: transparent;
    border-color: transparent;

    &:hover {
      background: var(--ib-bg-hover);
      border-color: transparent;
    }
  }

  // Default variant hover
  &--default:hover {
    background: var(--ib-bg-hover);
    border-color: var(--ib-border);
  }

  &__icon {
    flex-shrink: 0;
  }

  &__tooltip {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    font-size: 12px;
    white-space: nowrap;
    background: var(--text-primary, #1a1a1a);
    color: var(--bg-primary, #ffffff);
    border-radius: 4px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 150ms ease;
  }
}

// Hover to show tooltip (only when slot content exists)
.icon-button:has(.icon-button__tooltip):hover .icon-button__tooltip {
  opacity: 1;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .icon-button {
    --ib-color: var(--text-primary, #f5f5f5);
    --ib-color-hover: var(--text-primary, #f5f5f5);
    --ib-bg: var(--bg-tertiary, #3d3d3d);
    --ib-bg-hover: var(--bg-secondary, #2d2d2d);
    --ib-border: var(--border, #404040);
    --ib-accent: var(--accent, #60a5fa);
  }
}
</style>
