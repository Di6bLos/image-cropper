export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export type ImageStatus = 'ready' | 'exporting' | 'done' | 'error'

export type AiCropStatus = 'idle' | 'analyzing' | 'done' | 'error'

export interface ImportedImage {
  id: string
  file: File
  name: string
  url: string
  naturalWidth: number
  naturalHeight: number
  cropRect: CropRect | null
  status: ImageStatus
  focalPoint: { x: number; y: number } | null
  aiCropStatus: AiCropStatus
}
