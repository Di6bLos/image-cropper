<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toast-stack">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        @click="dismiss(toast.id)"
      >
        {{ toast.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.toast-stack {
  position: fixed;
  bottom: $space-lg;
  right: $space-lg;
  display: flex;
  flex-direction: column;
  gap: $space-xs;
  z-index: 1000;
}

.toast {
  padding: $space-sm $space-md;
  border-radius: $radius-md;
  background: $color-text;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast--success {
  background: $color-success;
}

.toast--error {
  background: $color-danger;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
