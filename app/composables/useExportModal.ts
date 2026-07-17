/**
 * useExportModal - Export modal state and options management
 *
 * Manages modal visibility and export settings (format, quality, suffix).
 * Used by ExportModal.vue and triggered from CropWorkspace.
 *
 * @see EXPT-01: Export button opens modal
 * @see EXPT-02: Format selection (JPG/PNG/WebP)
 * @see EXPT-03: Quality slider for lossy formats
 */

export type ExportFormat = 'jpeg' | 'png' | 'webp'

export interface ExportOptions {
  format: ExportFormat
  quality: number // 1-100
  addSuffix: boolean
}

export function useExportModal() {
  // SSR-safe: modal is always hidden on server
  const isOpen = ref(false)

  // Default export options
  const options = ref<ExportOptions>({
    format: 'jpeg',
    quality: 90,
    addSuffix: true,
  })

  // Export in progress state
  const isExporting = ref(false)

  /**
   * Open the export modal
   */
  function show(): void {
    if (process.client) {
      isOpen.value = true
    }
  }

  /**
   * Close the export modal
   */
  function hide(): void {
    if (process.client) {
      isOpen.value = false
    }
  }

  /**
   * Get current export options (snapshot copy)
   */
  function getOptions(): ExportOptions {
    return { ...options.value }
  }

  return {
    isOpen: readonly(isOpen),
    options,
    isExporting,
    show,
    hide,
    getOptions,
  }
}
