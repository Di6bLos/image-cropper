/**
 * Blob Registry Client Plugin
 *
 * Provides a global singleton instance of useBlobRegistry that persists
 * across all components in the client session.
 *
 * This plugin ensures a single registry instance is shared app-wide,
 * preventing duplicate Blob URL tracking and ensuring consistent cleanup.
 *
 * @see D-05
 */
export default defineNuxtPlugin(() => {
  // Create a singleton registry instance
  const blobRegistry = useBlobRegistry()

  // Provide globally so any component can inject the same instance
  return {
    provide: {
      blobRegistry,
    },
  }
})
