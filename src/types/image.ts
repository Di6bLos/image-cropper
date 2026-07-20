export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export type ImageStatus = 'ready' | 'exporting' | 'done' | 'error'

export interface ImportedImage {
  id: string
  file: File
  name: string
  url: string
  naturalWidth: number
  naturalHeight: number
  cropRect: CropRect | null
  status: ImageStatus
}
