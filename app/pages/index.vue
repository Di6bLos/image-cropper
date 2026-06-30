<script setup lang="ts">
import { useAppStore } from '~/stores/useAppStore'

const appStore = useAppStore()
const count = ref(0)

function increment() {
  count.value++
  appStore.increment()
}
</script>

<template>
  <main>
    <h1>Welcome to Image Cropper</h1>
    <p>Store message: {{ appStore.message }}</p>
    <p>Local count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </main>
</template>
