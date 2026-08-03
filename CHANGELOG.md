# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Bulk image import via drag-and-drop or file picker.
- Interactive crop workspace with pan/zoom and per-image ratio controls (preset,
  custom ratio, and custom pixel output modes).
- AI Crop: subject-detection powered focal-point cropping via a Gemini-backed
  serverless endpoint, with per-image status feedback.
- Batch export of cropped images to a single ZIP file.
- Toast notifications for import, export, and AI Crop feedback.
