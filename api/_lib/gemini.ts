// Re-verify model availability/pricing at deploy time — model names on the Gemini API churn.
// gemini-2.5-flash-lite was retired for new users; gemini-3.5-flash-lite is the current
// stable, low-cost flash model (confirmed via ai.google.dev docs).
export const GEMINI_MODEL = 'gemini-3.5-flash-lite'

export class GeminiParseError extends Error {}

export function buildPrompt(): string {
  return (
    'Detect the single most visually prominent subject (person, animal, or object) in this image. ' +
    'If no single subject clearly stands out, choose the most visually significant region instead. ' +
    'Respond with only a JSON object of the form {"box_2d":[ymin,xmin,ymax,xmax]}, where each value ' +
    'is an integer from 0 to 1000 normalized to the image dimensions.'
  )
}

interface FocalPoint {
  focalX: number
  focalY: number
}

/**
 * Extracts a normalized (0-1) focal point from a Gemini generateContent response —
 * the center of the detected subject's box_2d.
 */
export function parseGeminiResponse(raw: unknown): FocalPoint {
  const text = extractText(raw)
  if (!text) {
    throw new GeminiParseError('Gemini response had no text content')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new GeminiParseError('Gemini response text was not valid JSON')
  }

  const box = extractBox(parsed)
  if (!box) {
    throw new GeminiParseError('Gemini response did not contain a valid box_2d')
  }

  const [ymin, xmin, ymax, xmax] = box
  const focalX = clamp01(((xmin + xmax) / 2) / 1000)
  const focalY = clamp01(((ymin + ymax) / 2) / 1000)

  return { focalX, focalY }
}

function extractText(raw: unknown): string | null {
  if (typeof raw !== 'object' || raw === null) return null
  const candidates = (raw as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates) || candidates.length === 0) return null

  const content = (candidates[0] as { content?: unknown })?.content
  const parts = (content as { parts?: unknown } | undefined)?.parts
  if (!Array.isArray(parts) || parts.length === 0) return null

  const text = (parts[0] as { text?: unknown })?.text
  return typeof text === 'string' ? text : null
}

function extractBox(parsed: unknown): [number, number, number, number] | null {
  const source = Array.isArray(parsed) ? parsed[0] : parsed
  if (typeof source !== 'object' || source === null) return null

  const box = (source as { box_2d?: unknown }).box_2d
  if (!Array.isArray(box) || box.length !== 4) return null
  if (!box.every((value) => typeof value === 'number' && Number.isFinite(value))) return null

  return box as [number, number, number, number]
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1)
}
