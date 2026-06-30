# Feature Research

**Domain:** Bulk Image Cropping Tool
**Researched:** 2026-06-24
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| File picker + drag-and-drop import | Universal pattern across all file tools; users expect both options | LOW | Use HTML5 drag-drop API; ensure visual drop zone feedback |
| Bulk preview list with thumbnails | Users need to see what they are cropping; single-image view breaks workflow | LOW | Lazy-load thumbnails; show filename + dimensions |
| Draggable crop window overlay | Core interaction; without it users cannot adjust crops | MEDIUM | Must have grab cursor, smooth dragging, boundary clamping |
| Resizable crop handles (corners + edges) | Standard crop UI inherited from every image editor ever | MEDIUM | Corner handles for proportional resize, edge handles for free resize |
| Aspect ratio presets (16:9, 3:2, 1:1, 2:3) | Social media and photography standard crops | LOW | Constrain selection to ratio on drag; visual ratio label |
| Export as JPG/PNG/WebP | Fundamental output formats; no format choice feels limiting | LOW | Canvas API toBlob(); WebP support may vary by browser |
| Quality slider for lossy formats | Users need control over file size vs quality tradeoff | LOW | Range input 1-100; real-time file size estimate |
| ZIP download for batch | Downloading 50 images one-by-one is unacceptable | LOW | Use JSZip library; stream to avoid memory spikes |
| Original filenames preserved on export | Losing the original filename breaks asset organization | LOW | Map exports to original names + suffix or sequential numbering |
| Visual crop overlay (dimmed area outside crop) | Users need to see exactly what will be cropped | LOW | Semi-transparent black overlay; white border on crop region |
| Responsive canvas sizing | Users have different screen sizes; fixed layout fails | LOW | CSS Grid/Flexbox; canvas scales to container |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI subject detection (client-side) | Automatic smart cropping eliminates manual work for typical images | HIGH | Use libraries like smartcrop.js or TensorFlow.js; u2netp for salient object detection |
| Center-crop fallback for AI | Graceful degradation when AI cannot detect subject | LOW | Simple center-based crop as default; toggle to manual |
| Custom aspect ratio input (e.g., "4:5") | Power users need non-standard ratios | LOW | Parse "W:H" string; validate > 0 |
| Custom pixel size export | Users want specific output dimensions, not just ratios | MEDIUM | Calculate crop from target size; may need to letterbox |
| Rule of thirds grid overlay | Composition guidance helps users make better crops | LOW | Toggle-able grid lines; draw over overlay |
| Before/after comparison slider | Lets users verify crop quality before committing | MEDIUM | Draggable divider or hover-to-swap; memory intensive for large images |
| Batch progress indicator with per-file status | Transparency during long processing; users hate wondering if it is working | MEDIUM | Progress bar + "12/50 processed" counter + ETA |
| Multi-format single-click export | Export same image to multiple formats/sizes at once | MEDIUM | Queue multiple export jobs; parallel processing where possible |
| Undo/redo for crop adjustments | Mistakes happen; full-session undo is expected | MEDIUM | Command pattern; stack per-image or global |
| Crop position memory across images | Users often want same crop position for similar images | LOW | Store last position; apply to newly added images |
| Dark mode UI | Modern tool expectation; reduces eye strain | LOW | CSS variables; respects system preference |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time AI auto-crop as you drag | Sounds convenient | Creates UI lag; AI inference on every drag event is slow | Apply AI crop on selection; user adjusts manually |
| Batch rename with tokens | Users want "IMG_001_cropped.jpg" | Adds complex string manipulation UI; edge cases (unicode, duplicates) | Suffix-only is sufficient: "original.jpg" -> "original_cropped.jpg" |
| Cloud storage integration (Google Drive, Dropbox) | Convenience for cloud-heavy workflows | Auth complexity, token refresh, API rate limits; not v1 scope | Browser download/upload is universal |
| RAW format support (CR2, NEF, DNG) | Professional photographers use RAW | Client-side RAW decoding is heavy; browser support poor | Document limitation; suggest converting to TIFF first |
| Lossless WebP/AVIF export option | Pixel-perfect output | Browser canvas API quality setting is lossy-only for these formats | Note in UI that quality slider applies; provide lossless PNG |
| Automatic watermark/ branding | Users want to batch-add logos | UI for logo positioning is complex; aspect ratio handling breaks | Provide separate watermarking tool in v2 |
| Collaborative editing / team features | "Team of 3 devs" mentioned in context | Real-time sync is complex; WebSocket, conflict resolution, auth | v1: share project file (JSON state) via git or manual export |
| Keyboard shortcuts for everything | Power user expectation | Creates discoverability issues; some actions need modifiers (Alt, Shift) | Start with essential shortcuts only (arrow keys for nudge, Enter to apply) |

## Feature Dependencies

```
[AI Subject Detection]
    └──requires──> [Crop Window Overlay Positioning]
                          └──requires──> [Drag and Resize Handles]

[Aspect Ratio Presets]
    └──requires──> [Resizable Crop Selection with Constraint]

[Custom Ratio Input]
    └──requires──> [Aspect Ratio Presets]

[Quality Slider]
    └──requires──> [Format Selection]
                       └──requires──> [Export to File]

[ZIP Download]
    └──requires──> [Batch Processing Complete]

[Draggable Crop Window]
    └──requires──> [File Import]
                        └──requires──> [Thumbnail Generation]

[Before/After Comparison]
    └──conflicts──> [Large File Handling] (memory issues with many high-res images)

[Custom Pixel Size Export]
    └──conflicts──> [Aspect Ratio Presets] (mutually exclusive modes)
```

### Dependency Notes

- **AI Subject Detection requires Crop Window Overlay:** AI outputs focal point; UI must position crop window there
- **Custom Ratio Input requires Aspect Ratio Presets:** Parser and constraint logic is shared
- **ZIP Download requires Batch Processing:** Cannot zip empty or incomplete batch
- **Before/After Comparison conflicts with Large File Handling:** Storing both original and cropped in memory will crash on 4K images
- **Custom Pixel Size Export conflicts with Aspect Ratio Presets:** These are different export modes; UI should use tabs or radio buttons to separate

## MVP Definition

### Launch With (v1)

Minimum viable product - what is needed to validate the concept.

- [ ] File picker + drag-and-drop import -- foundation of all workflows
- [ ] Bulk preview list with thumbnails -- core UI; users must see their images
- [ ] Draggable + resizable crop window -- the primary interaction
- [ ] Aspect ratio presets (16:9, 3:2, 1:1, 2:3) -- most common use cases
- [ ] Visual crop overlay with dimmed outside area -- users need to see the crop
- [ ] Export as JPG/PNG with quality slider -- basic output
- [ ] ZIP download -- batch download is non-negotiable
- [ ] Original filenames preserved -- asset organization requirement
- [ ] Center-crop fallback -- manual positioning must work always

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] AI subject detection with one-click auto-crop -- main differentiator; add after basic crop works
- [ ] Custom ratio input -- requested by power users but not blocking
- [ ] Custom pixel size export -- requested by power users but not blocking
- [ ] Rule of thirds grid -- low effort, improves UX
- [ ] Batch progress indicator -- add when processing > 10 images becomes common
- [ ] Undo/redo -- add when users report making mistakes

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Before/after comparison slider -- memory concerns for large batches
- [ ] Multi-format single-click export -- adds UI complexity
- [ ] Collaborative editing / project files -- requires real-time sync infrastructure
- [ ] Cloud storage integration -- auth complexity not worth v1
- [ ] RAW format support -- browser limitations; out of scope
- [ ] Keyboard shortcuts for all actions -- discoverability issues; add for power users later

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| File picker + drag-and-drop | HIGH | LOW | P1 |
| Bulk preview list | HIGH | LOW | P1 |
| Draggable crop window | HIGH | MEDIUM | P1 |
| Resizable handles | HIGH | MEDIUM | P1 |
| Aspect ratio presets | HIGH | LOW | P1 |
| Visual crop overlay | HIGH | LOW | P1 |
| Export as JPG/PNG/WebP | HIGH | LOW | P1 |
| Quality slider | HIGH | LOW | P1 |
| ZIP download | HIGH | LOW | P1 |
| Original filenames | HIGH | LOW | P1 |
| Center-crop fallback | HIGH | LOW | P1 |
| AI subject detection | MEDIUM | HIGH | P2 |
| Custom ratio input | MEDIUM | LOW | P2 |
| Custom pixel size | MEDIUM | MEDIUM | P2 |
| Rule of thirds grid | LOW | LOW | P2 |
| Batch progress indicator | MEDIUM | MEDIUM | P2 |
| Undo/redo | MEDIUM | MEDIUM | P2 |
| Before/after comparison | LOW | MEDIUM | P3 |
| Multi-format export | LOW | MEDIUM | P3 |
| Keyboard shortcuts | LOW | LOW | P3 |
| Cloud integration | LOW | HIGH | P3 |
| RAW support | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Squoosh | Lightroom Classic | BIRME | Our Approach |
|---------|---------|-------------------|-------|--------------|
| Batch cropping | NO (one at a time) | YES | YES | YES - core use case |
| AI auto-crop | NO | NO (requires selection) | NO | YES - client-side ML |
| Aspect ratio presets | Limited | YES | YES | YES - include social media ratios |
| Custom ratio input | NO | YES | YES | YES |
| Custom pixel size | YES (resize) | YES | YES | YES |
| Format selection | YES | YES | YES | YES |
| Quality slider | YES | YES | NO | YES |
| ZIP download | NO | YES (Export) | YES | YES |
| Filename preservation | YES | YES | YES | YES |
| Drag-drop import | YES | NO (requires import) | YES | YES |
| Progress indicator | NO | YES | YES | YES |
| Rule of thirds | NO | YES (overlay) | NO | YES (toggle) |
| Before/after | YES (side-by-side) | YES | NO | YES (slider) |
| Client-side only | YES | NO | YES | YES - no uploads |
| Auth required | NO | YES | NO | NO (v1) |

### Analysis

- **Squoosh** excels at single-image codec comparison but has no batch processing - opportunity to own bulk workflow
- **Lightroom** is powerful but requires desktop app + auth - opportunity to own browser-based no-install experience
- **BIRME** is the closest browser-based competitor but lacks AI auto-crop and has dated UI - opportunity to differentiate with modern UX + ML

## Sources

- [Resizo vs Squoosh comparison](https://www.resizo.in/blog/resizo-vs-squoosh/)
- [Best Batch Image Resizers 2026](https://softpicker.com/best-free-batch-image-resizers/)
- [Smart Crop (fwip.app) - AI Subject Detection](https://fwip.app/tools/smart-crop/)
- [AI Crop - TensorFlow.js Implementation](https://aicrop.app/)
- [TapCrop - Smartcrop.js Focal Point](https://www.tapcrop.com/smart-crop)
- [Cloudinary AI Content Analysis](https://cloudinary.com/documentation/cloudinary_ai_content_analysis_object_aware_cropping)
- [Flutter Box Transform - Crop UI Patterns](https://medium.com/@saadoardati/mastering-resizable-draggable-boxes-with-flutter-box-transform-building-figmas-crop-ui-461ad264af3f)
- [Ark UI Image Cropper](https://ark-ui.com/docs/components/image-cropper)
- [React Image Crop Library](https://github.com/dominictobias/react-image-crop/tree/10.1.8)
- [PicsSizer - Bulk Image Compressor](https://www.picssizer.com/bulk-image-compressor)
- [ImageCrush - Batch Image Optimization](https://www.imagecrush.io/)
- [DataraIMG Batch Processing](https://datara.studio/dataraimg-batch)
- [CompressX Bulk Optimization](https://compressx.io/docs/bulk-optimization/)

---
*Feature research for: Bulk Image Cropping Tool*
*Researched: 2026-06-24*
