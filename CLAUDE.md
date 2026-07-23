# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev          # Vite dev server only — does NOT serve /api/* (AI Crop will fail)
npm run dev:vercel   # vercel dev — serves the app AND /api/ai-crop, required to test AI Crop locally
npm run build        # vue-tsc -b (type-check) + vite build
npm run test         # vitest run (single run)
npm run test:watch   # vitest watch mode
```

Run a single test file: `npx vitest run tests/composables/useCropEngine.test.ts`

There is no lint script configured; type-checking (`vue-tsc -b`, three project references in
`tsconfig.json`: app/node/api) is the primary static check.

### Local AI Crop setup

`vercel dev` does not read the repo's `.env` — it pulls from the linked Vercel project's env vars.
One-time setup: `npx vercel link`, then `npx vercel env add GEMINI_API_KEY development`.

## Architecture

Client-side bulk image cropper (Vue 3 `<script setup>` + TS, Pinia, Vite, Sass, JSZip). All
cropping/resizing/encoding happens locally in the browser; the only network call is the optional
AI Crop feature, which sends a downscaled image to a Vercel serverless function that proxies to
Gemini.

### State

Two Pinia stores are the source of truth; components mostly read/react to them rather than
holding local state:

- **`useImageStore`** (`src/stores/useImageStore.ts`) — the list of `ImportedImage` (defined in
  `src/types/image.ts`), each with its own `cropRect`, `status`, `focalPoint`, and `aiCropStatus`.
  Object URLs are created on import and must be revoked via `revokeObjectUrl` (see
  `useObjectUrls.ts`) on removal/clear — `removeImage`/`clearAll` already do this.
- **`useSettingsStore`** (`src/stores/useSettingsStore.ts`) — the batch-wide crop ratio/output
  config (`mode`: `preset` | `custom-ratio` | `custom-px`). `ratio` and `outputSize` are computed
  from the raw inputs.

### Crop math

`src/composables/useCropEngine.ts` is pure, dependency-free geometry: `getCenteredCropRect`
(largest ratio-matching rect centered on the image), `getFocalCropRect` (same, but centered on a
given point and clamped to bounds), `panCropRect`, `resizeCropRect`. All rects are in
natural-image pixel space, not screen/DOM space.

Changing the ratio (`App.vue` watcher on `settingsStore.ratio`) reapplies `applyToAll` across
every image: images with a stored `focalPoint` recenter on it via `getFocalCropRect`, others fall
back to `getCenteredCropRect`. Per-image pan/zoom then layers on top until the ratio changes again.

### AI Crop flow

1. `useAiCrop.ts::runAiCrop` downscales each image client-side (`useImageDownscale.ts`) to a
   base64 payload and POSTs it to `/api/ai-crop`.
2. `api/ai-crop.ts` (Vercel serverless function) validates the body, calls the Gemini
   `generateContent` endpoint with the image + a fixed subject-detection prompt
   (`api/_lib/gemini.ts::buildPrompt`), and requires `GEMINI_API_KEY` server-side only (never
   prefix it `VITE_`, or it'll be bundled into client JS).
3. `api/_lib/gemini.ts::parseGeminiResponse` extracts a `box_2d` (`[ymin,xmin,ymax,xmax]`,
   normalized 0-1000) from the Gemini response and converts it to a normalized `{focalX, focalY}`
   center point — this parsing logic is unit-tested in `tests/api/gemini.test.ts` independent of
   the network call.
4. The client denormalizes the focal point into natural-image pixels, stores it on the image
   (`setFocalPoint`), and immediately recomputes its `cropRect` via `getFocalCropRect` — same crop
   size as a ratio crop, just recentered, not a tight zoom to the subject.
5. `GEMINI_MODEL` in `api/_lib/gemini.ts` is a name that has changed before (flash-lite models get
   retired) — re-verify against `ai.google.dev` docs before assuming it's current.

### Export flow

`useImageExport.ts::exportImages` spins up one `export.worker.ts` Web Worker and runs jobs through
it sequentially (not in parallel) so the UI stays responsive during large batches. Reactive Pinia
state can't survive `structuredClone` over `postMessage`, so `cropRect`/`outputSize` are copied to
plain objects before posting. The worker draws the crop onto an `OffscreenCanvas` and returns a
`Blob`; `useZipExport.ts` collects the blobs (deduping filenames) into a single ZIP via JSZip and
triggers the download.

### Adding a new ratio/crop mode

Touches, in order: `types/ratio.ts` (mode/preset types) → `useSettingsStore.ts` (state +
`ratio`/`outputSize` computeds) → `RatioControls.vue` (UI) → crop math in `useCropEngine.ts` if the
new mode needs different geometry.
