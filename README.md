# Bulk Image Cropper

A client-side tool for bulk-importing images and cropping them to fixed ratios (1:1, 4:3, 3:2,
16:9, 9:16), a custom ratio, or an exact pixel size — then exporting everything as a single ZIP.

Cropping, resizing, and encoding all run locally in the browser (off the main thread in a Web
Worker, so the UI stays responsive during large batch exports) — images are never uploaded
anywhere for this. The one exception is the optional **AI Crop** feature: only when you explicitly
click "AI Crop all images" is each image sent to Google's Gemini API (via a small serverless
proxy) to detect its main subject, so the ratio crop can be re-centered on it instead of the
image's geometric center. Nothing is sent automatically or on upload.

## Stack

Vue 3 (`<script setup>`, TypeScript) · Vite · Pinia · Sass · JSZip · Vitest · Gemini API (AI Crop)

## Getting started

```sh
npm install
npm run dev          # start the plain Vite dev server (no /api/* support)
npm run dev:vercel   # start the full dev server, including /api/ai-crop
npm run test         # run the test suite
npm run build        # type-check + production build
```

`npm run dev` is a plain Vite dev server and does **not** serve `/api/*`. To test the AI Crop
feature locally, use `npm run dev:vercel` instead — it requires the Vercel CLI (included as a
devDependency) and a one-time setup:

```sh
npx vercel link                                # once, links this repo to a Vercel project
npx vercel env add GEMINI_API_KEY development   # paste your dev key when prompted
npm run dev:vercel                              # serves both the app and /api/ai-crop
```

`vercel dev` does not read the repo's local `.env` file — it pulls env vars from the linked
Vercel project's environment settings, which is why the key needs to be registered with
`vercel env add` rather than just existing in `.env`.

## How it works

1. Drag & drop (or pick) images in bulk.
2. Choose a crop ratio — preset, custom W:H, or an exact output size in px. It applies to every
   imported image by default; select an image to pan/zoom its crop individually.
3. Optionally click "AI Crop all images" to have Gemini find each image's main subject and
   re-center the ratio crop on it (same crop size, just recentered — not a tight zoom to the
   subject). Changing the ratio afterward keeps recentering on the detected subject; "Reset all
   image crops" forgets it and returns to dead-center.
4. Export — each image is cropped/resized/encoded in a Web Worker, then bundled into a ZIP and
   downloaded.

## Deployment

Deploys to Vercel. The static Vite build itself needs zero configuration; the AI Crop feature
adds one serverless function (`api/ai-crop.ts`), which requires a `GEMINI_API_KEY` environment
variable set on the Vercel project (Project → Settings → Environment Variables, or
`vercel env add GEMINI_API_KEY production`). Without that variable, the rest of the app still
works — AI Crop just returns a clear error toast instead of a focal point.
