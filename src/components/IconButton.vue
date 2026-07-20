<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <button type="button" class="icon-button" :aria-label="label" :title="label">
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;
  line-height: 1;

  &:hover {
    background: $color-surface-hover;
    color: $color-text;
  }
}
</style>
