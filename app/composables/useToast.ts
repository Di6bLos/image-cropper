/**
 * useToast - Toast notification state and helpers
 *
 * Provides global toast notification state and helper functions.
 * SSR-safe with early return pattern.
 *
 * @see AIDT-04, AIDT-05
 */

export interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
}

const toasts = process.client ? ref<Toast[]>([]) : { value: [] } as any

/**
 * Show a toast notification
 * @param message - Message to display
 * @param type - Toast type (info | success | error)
 * @param duration - Auto-dismiss duration in ms (default 3000)
 */
export function showToast(
  message: string,
  type: 'info' | 'success' | 'error' = 'info',
  duration: number = 3000
): void {
  if (!process.client) return

  const id = Date.now() + Math.random()
  const toast: Toast = { id, message, type }
  toasts.value.push(toast)

  setTimeout(() => {
    const index = toasts.value.findIndex((t: Toast) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }, duration)
}

/**
 * Show "Center crop applied" toast (fallback used)
 */
export function showFallbackToast(): void {
  showToast('Center crop applied', 'info')
}

/**
 * Show "Detection unavailable" toast (AI failed)
 */
export function showFailureToast(): void {
  showToast('Detection unavailable', 'error')
}

export function useToast() {
  return {
    toasts,
    showToast,
    showFallbackToast,
    showFailureToast,
  }
}
