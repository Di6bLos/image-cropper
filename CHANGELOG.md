# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- _(2026-09-02, branch `feature/pdf-import`)_ PDF import: dropped or selected PDFs are
  rasterized client-side, one croppable image per page (first 25 pages, ~2048 px on the
  long edge).
- _(2026-09-03, branch `update/ux-ui`)_ User-facing error message when AI Crop requests
  are rate limited by Gemini (HTTP 429).
- _(2026-09-03, branch `update/ux-ui`)_ Live estimated file size preview for single-image
  export and "Export all as ZIP".

### Changed

- _(2026-09-03, branch `update/ux-ui`)_ Exported files get a `_cropped` suffix before
  the extension when the crop actually trims the image; a full-image export (format
  conversion only) keeps the original base name.
- _(2026-09-03, branch `update/ux-ui`)_ The crop box now has eight drag handles
  (four corners, four edges) and resizes free-form — drag any handle to change the
  crop's shape and size, with the opposite edge anchored. It is no longer locked to
  the selected ratio while dragging.
- _(2026-09-03, branch `update/ux-ui`)_ New images now import uncropped: the first
  upload switches to Custom size (px) mode at that image's own resolution, and every
  imported image's crop covers the whole image. "Reset Crop" and "Reset all image
  crops" stretch the crop to cover the entire image instead of a centered ratio crop.
  The initial dropzone is now much larger, filling most of the empty area.
- _(2026-09-03, branch `update/ux-ui`)_ Export encoding switched to jSquash WASM codecs
  (mozjpeg, libwebp) instead of the browser's native canvas encoder, for better
  compression.

### Fixed

- _(2026-09-03, branch `update/ux-ui`)_ Export no longer stretches a hand-resized
  crop to fill the Custom size (px) dimensions. The fixed output size is applied only
  when it matches the crop's aspect ratio; a free-form crop now exports at its own
  pixel dimensions.
- _(2026-09-03, branch `update/ux-ui`)_ Fixed a quality cliff in WebP export where
  dropping quality from 100% to 99% caused a disproportionate loss; sub-lossless WebP
  and all JPEG exports now go through jSquash's WASM encoders instead of the browser's
  native encoder.
- _(2026-09-03, branch `update/ux-ui`)_ Fixed the export size preview being stuck on
  "Calculating…" and failing to type-check: the preview composables' refs weren't
  unwrapped in the templates that read them.
- _(2026-09-03, branch `stage`)_ "Reset Crop" no longer rewrites the batch-wide Custom
  size (px) settings, which discarded every other image's crop edits.
- _(2026-09-03, branch `stage`)_ PDFs and images dropped from sources that supply no
  MIME type are now recognized by their file extension instead of being skipped as
  unsupported.
- _(2026-09-03, branch `stage`)_ A PDF that can't be read (corrupt or password
  protected) now reports that instead of the misleading "unsupported file" message.
- _(2026-09-03, branch `stage`)_ Exported PDF pages keep their `-pN` page suffix when
  the source filename contains dots (e.g. `q3.2024.final.pdf`), so pages no longer
  collide under one name in the ZIP.
- _(2026-09-03, branch `stage`)_ Export no longer stretches a large hand-resized crop
  to the Custom size (px) shape: the aspect match now uses a one-pixel tolerance rather
  than a percentage that grew with the crop.
- _(2026-09-03, branch `stage`)_ Dragging a crop handle on an image smaller than the
  minimum crop size no longer pushes the crop box outside the image.

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
