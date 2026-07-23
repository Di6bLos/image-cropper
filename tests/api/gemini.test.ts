import { describe, it, expect } from 'vitest'
import { GeminiParseError, buildPrompt, parseGeminiResponse } from '../../api/_lib/gemini'

function responseWithText(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
  }
}

describe('buildPrompt', () => {
  it('returns a non-empty prompt mentioning box_2d', () => {
    const prompt = buildPrompt()
    expect(prompt.length).toBeGreaterThan(0)
    expect(prompt).toContain('box_2d')
  })
})

describe('parseGeminiResponse', () => {
  it('computes a normalized focal point from a valid box_2d', () => {
    const raw = responseWithText(JSON.stringify({ box_2d: [100, 200, 300, 400] }))
    expect(parseGeminiResponse(raw)).toEqual({ focalX: 0.3, focalY: 0.2 })
  })

  it('clamps out-of-range values into 0-1', () => {
    const raw = responseWithText(JSON.stringify({ box_2d: [-500, -500, 1500, 1500] }))
    const { focalX, focalY } = parseGeminiResponse(raw)
    expect(focalX).toBeGreaterThanOrEqual(0)
    expect(focalX).toBeLessThanOrEqual(1)
    expect(focalY).toBeGreaterThanOrEqual(0)
    expect(focalY).toBeLessThanOrEqual(1)
  })

  it('throws on a missing box_2d', () => {
    const raw = responseWithText(JSON.stringify({ label: 'cat' }))
    expect(() => parseGeminiResponse(raw)).toThrow(GeminiParseError)
  })

  it('throws on malformed JSON text', () => {
    const raw = responseWithText('not json')
    expect(() => parseGeminiResponse(raw)).toThrow(GeminiParseError)
  })

  it('throws when the response has no candidates', () => {
    expect(() => parseGeminiResponse({ candidates: [] })).toThrow(GeminiParseError)
  })
})
