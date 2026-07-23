import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GEMINI_MODEL, GeminiParseError, buildPrompt, parseGeminiResponse } from './_lib/gemini'

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

interface RequestBody {
  image?: unknown
  mimeType?: unknown
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = req.body as RequestBody
  if (typeof body?.image !== 'string' || !body.image || typeof body?.mimeType !== 'string' || !body.mimeType) {
    res.status(400).json({ error: 'Request body must include base64 "image" and "mimeType" strings' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured')
    res.status(500).json({ error: 'AI cropping is not configured on the server' })
    return
  }

  let geminiResponse: Response
  try {
    geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ inlineData: { mimeType: body.mimeType, data: body.image } }, { text: buildPrompt() }],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    })
  } catch (error) {
    console.error('Failed to reach Gemini API:', error)
    res.status(502).json({ error: 'Failed to reach the Gemini API' })
    return
  }

  if (geminiResponse.status === 429) {
    res.status(429).json({ error: 'Rate limited by Gemini — try again shortly' })
    return
  }

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text().catch(() => '')
    console.error(`Gemini API error ${geminiResponse.status}:`, detail.slice(0, 500))
    res.status(502).json({ error: 'Gemini API returned an error' })
    return
  }

  let focalPoint: { focalX: number; focalY: number }
  try {
    const payload = await geminiResponse.json()
    focalPoint = parseGeminiResponse(payload)
  } catch (error) {
    if (error instanceof GeminiParseError) {
      console.error('Gemini parse error:', error.message)
      res.status(502).json({ error: 'Gemini did not return a usable result for this image' })
      return
    }
    console.error('Unexpected error parsing Gemini response:', error)
    res.status(502).json({ error: 'Gemini did not return a usable result for this image' })
    return
  }

  res.status(200).json(focalPoint)
}
