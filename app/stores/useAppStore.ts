import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const message = ref('Hello from Pinia store!')
  const clickCount = ref(0)

  function increment() {
    clickCount.value++
  }

  return {
    message,
    clickCount,
    increment,
  }
})
