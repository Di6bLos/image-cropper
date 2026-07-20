# Bulk Image Cropper

A client-side tool for bulk-importing images and cropping them to fixed ratios (1:1, 4:3, 3:2,
16:9, 9:16), a custom ratio, or an exact pixel size — then exporting everything as a single ZIP.

Everything runs in the browser: images are never uploaded anywhere, and cropping/resizing/encoding
happens off the main thread in a Web Worker so the UI stays responsive during large batch exports.

## Stack

Vue 3 (`<script setup>`, TypeScript) · Vite · Pinia · Sass · JSZip · Vitest

## Getting started

```sh
npm install
npm run dev      # start the dev server
npm run test     # run the test suite
npm run build    # type-check + production build
```

## How it works

1. Drag & drop (or pick) images in bulk.
2. Choose a crop ratio — preset, custom W:H, or an exact output size in px. It applies to every
   imported image by default; select an image to pan/zoom its crop individually.
3. Export — each image is cropped/resized/encoded in a Web Worker, then bundled into a ZIP and
   downloaded.

## Deployment

Deploys to Vercel with zero configuration (static Vite build, no backend/serverless functions).
