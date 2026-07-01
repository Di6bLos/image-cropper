import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Create a fresh Pinia instance for each test file
beforeEach(() => {
  setActivePinia(createPinia())
})

// Global mock for process.client
Object.defineProperty(process, 'client', { value: true })
