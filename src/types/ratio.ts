export interface RatioPreset {
  label: string
  width: number
  height: number
}

export type RatioMode = 'preset' | 'custom-ratio' | 'custom-px'

export interface OutputSize {
  width: number
  height: number
}
