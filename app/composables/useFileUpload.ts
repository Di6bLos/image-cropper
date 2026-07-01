/**
 * useFileUpload - File drag-and-drop and picker composable
 *
 * Provides counter-based drag tracking, file validation, and SSR-safe guards.
 * Drag-over feedback is handled at component level via isDragging state.
 *
 * @see D-11, D-12
 * @see RESEARCH Pattern 1: Counter-based drag tracking
 */

export interface UseFileUploadOptions {
  maxFiles?: number
  maxSize?: number // bytes
  accept?: string // MIME type filter
}

export interface UseFileUploadReturn {
  files: Readonly<Ref<File[]>>
  isDragging: Readonly<Ref<boolean>>
  dropzoneRef: Ref<HTMLElement | null>
  inputRef: Ref<HTMLInputElement | null>
  openFilePicker: () => void
  addFiles: (newFiles: File[]) => void
  removeFile: (index: number) => void
  clearFiles: () => void
}

const DEFAULT_MAX_FILES = 50
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024 // 100MB
const DEFAULT_ACCEPT = 'image/*'

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxFiles = DEFAULT_MAX_FILES,
    maxSize = DEFAULT_MAX_SIZE,
    accept = DEFAULT_ACCEPT,
  } = options

  // Counter-based drag tracking (handles nested elements)
  const dragCounter = ref(0)
  const isDragging = ref(false)

  // File list state
  const files = ref<File[]>([])

  // Template refs
  const dropzoneRef = ref<HTMLElement | null>(null)
  const inputRef = ref<HTMLInputElement | null>(null)

  /**
   * Validate a single file
   */
  function isValidFile(file: File): boolean {
    // MIME type validation
    if (!file.type.startsWith('image/')) {
      return false
    }
    // Size validation
    if (file.size > maxSize) {
      return false
    }
    // Count validation
    if (files.value.length >= maxFiles) {
      return false
    }
    return true
  }

  /**
   * Handle drag enter - increment counter and set dragging
   */
  function handleDragEnter(e: DragEvent): void {
    if (!process.client) return
    e.preventDefault()
    dragCounter.value++
    isDragging.value = true
  }

  /**
   * Handle drag leave - decrement counter, set dragging false at 0
   */
  function handleDragLeave(e: DragEvent): void {
    if (!process.client) return
    e.preventDefault()
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  /**
   * Handle drag over - set dropEffect to copy
   */
  function handleDragOver(e: DragEvent): void {
    if (!process.client) return
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  /**
   * Handle drop - process files and reset state
   */
  function handleDrop(e: DragEvent): void {
    if (!process.client) return
    e.preventDefault()
    dragCounter.value = 0
    isDragging.value = false

    const droppedFiles = Array.from(e.dataTransfer?.files || [])
    addFiles(droppedFiles)
  }

  /**
   * Handle file input change
   */
  function handleFileInput(e: Event): void {
    if (!process.client) return
    const target = e.target as HTMLInputElement
    const selectedFiles = Array.from(target.files || [])
    addFiles(selectedFiles)
    // Reset input so same file can be selected again
    target.value = ''
  }

  /**
   * Add files to the list after validation
   */
  function addFiles(newFiles: File[]): void {
    const validFiles = newFiles.filter(isValidFile)
    files.value.push(...validFiles)
  }

  /**
   * Remove a file by index
   */
  function removeFile(index: number): void {
    files.value.splice(index, 1)
  }

  /**
   * Clear all files
   */
  function clearFiles(): void {
    files.value = []
  }

  /**
   * Open the hidden file picker
   */
  function openFilePicker(): void {
    inputRef.value?.click()
  }

  // Attach event listeners on mount
  onMounted(() => {
    if (!process.client) return
    if (!dropzoneRef.value) return

    dropzoneRef.value.addEventListener('dragenter', handleDragEnter)
    dropzoneRef.value.addEventListener('dragleave', handleDragLeave)
    dropzoneRef.value.addEventListener('dragover', handleDragOver)
    dropzoneRef.value.addEventListener('drop', handleDrop)
  })

  // Cleanup event listeners on unmount
  onUnmounted(() => {
    if (!process.client) return
    if (!dropzoneRef.value) return

    dropzoneRef.value.removeEventListener('dragenter', handleDragEnter)
    dropzoneRef.value.removeEventListener('dragleave', handleDragLeave)
    dropzoneRef.value.removeEventListener('dragover', handleDragOver)
    dropzoneRef.value.removeEventListener('drop', handleDrop)
  })

  return {
    files: readonly(files),
    isDragging: readonly(isDragging),
    dropzoneRef,
    inputRef,
    openFilePicker,
    addFiles,
    removeFile,
    clearFiles,
  }
}
