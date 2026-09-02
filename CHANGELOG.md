# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- _(2026.09.02, branch `feature/pdf-import`)_ PDF import: dropped or selected PDFs are
  rasterized client-side, one croppable image per page (first 25 pages, ~2048 px on the
  long edge).
- User-facing error message when AI Crop requests are rate limited by Gemini (HTTP 429).
- Live estimated file size preview for single-image export and "Export all as ZIP".

### Changed

- Export encoding switched to jSquash WASM codecs (mozjpeg, libwebp) instead of the
  browser's native canvas encoder, for better compression.

### Fixed

- Fixed a quality cliff in WebP export where dropping quality from 100% to 99%
  caused a disproportionate loss; sub-lossless WebP and all JPEG exports now go
  through jSquash's WASM encoders instead of the browser's native encoder.
- Fixed the export size preview being stuck on "Calculating…" and failing to
  type-check: the preview composables' refs weren't unwrapped in the templates
  that read them.

## [v1.0] - 2026-07-17

### Added

- Bulk image import via drag-and-drop or file picker.
  ([#3](https://github.com/Di6bLos/image-cropper/pull/3))
- Interactive crop workspace with pan/zoom and per-image ratio controls (preset,
  custom ratio, and custom pixel output modes).
  ([#3](https://github.com/Di6bLos/image-cropper/pull/3))
- Batch export of all cropped images to a single ZIP file, processed off the main
  thread via a Web Worker. ([#3](https://github.com/Di6bLos/image-cropper/pull/3))
- Toast notifications for import, export, and AI Crop feedback.
  ([#3](https://github.com/Di6bLos/image-cropper/pull/3))
- AI Crop: Gemini-backed subject detection for automatic focal-point cropping, with
  per-image status feedback.
  ([#4](https://github.com/Di6bLos/image-cropper/pull/4), [#5](https://github.com/Di6bLos/image-cropper/pull/5))
- Per-image "Export" button in the crop workspace, alongside the existing
  "Export all as ZIP". ([#6](https://github.com/Di6bLos/image-cropper/pull/6))

### Changed

- Toast notifications repositioned to top-center of the screen for better
  visibility. ([#5](https://github.com/Di6bLos/image-cropper/pull/5))
