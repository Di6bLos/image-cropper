import { reactive } from 'vue'

export type ToastType = 'info' | 'success' | 'error'

export interface ToastMessage {
  id: number
  text: string
  type: ToastType
}

const toasts = reactive<ToastMessage[]>([])
let nextId = 0

export function useToast() {
  function show(text: string, type: ToastType = 'info', duration = 3000) {
    const id = nextId++
    toasts.push({ id, text, type })
    setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id: number) {
    const index = toasts.findIndex((toast) => toast.id === id)
    if (index !== -1) toasts.splice(index, 1)
  }

  return { toasts, show, dismiss }
}
