---
phase: 3
slug: 03-ai-detection
plans_validated: [03]
---

# Phase 3: AI Detection - Validation

## Phase Requirements

### AIDT-01: Auto Crop Button Functionality
- AIDT-01: The "Auto crop" button is present in the CropWorkspace and triggers AI subject detection when clicked

### AIDT-02: Smartcrop.js CDN Lazy Loading
- AIDT-02: Smartcrop.js loads dynamically from CDN on first use, not bundled in the application

### AIDT-03: Detected Focal Point Positioning
- AIDT-03: The detected focal point from Smartcrop.js automatically repositions the crop window

### AIDT-04: Center-Crop Fallback
- AIDT-04: When AI detection fails or is unavailable, center-crop is applied as fallback

### AIDT-05: Web Worker Processing
- AIDT-05: AI detection runs in a Web Worker, off the main thread, without freezing the UI

---

## Acceptance Criteria (from UI-SPEC)

### Primary CTA
- [ ] "Auto crop" button displays with `sparkles` icon
- [ ] Button uses accent color (`#3b82f6` light / `#60a5fa` dark) exclusively
- [ ] Button size is `lg` (44px) per IconButton component

### Loading State
- [ ] Button shows spinner animation during AI processing
- [ ] Button is disabled while processing
- [ ] Label changes to "Detecting subject..." during processing

### Toast Notifications
- [ ] Toast appears at bottom-center of crop workspace
- [ ] Toast auto-dismisses after 3000ms
- [ ] "Center crop applied" toast shows when fallback triggers
- [ ] "Detection unavailable" toast shows when detection fails

### Keyboard Shortcut
- [ ] Pressing `A` key triggers auto crop when crop workspace is focused
- [ ] `A` shortcut does not trigger when input fields are focused

### Integration
- [ ] Crop window repositions to detected focal point after successful detection
- [ ] Crop window centers (center-crop) when detection fails or is unavailable

---

## Verification

### AIDT-01 Verification
**Method:** Manual testing
1. Load application and select an image
2. Locate "Auto crop" button in CropWorkspace
3. Verify button has `sparkles` icon
4. Click button and verify detection initiates

### AIDT-02 Verification
**Method:** Browser developer tools + network inspection
1. Open Network tab in browser DevTools
2. Clear network log
3. Click "Auto crop" button for first time
4. Verify network request to jsDelivr CDN: `https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js`
5. Verify request returns 200 OK
6. Verify application bundle does NOT contain smartcrop code

### AIDT-03 Verification
**Method:** Manual testing with visual inspection
1. Select an image with clear subject (e.g., person, object)
2. Note initial crop window position
3. Click "Auto crop"
4. After detection completes, verify crop window has moved to different position
5. Verify crop window is still within image bounds

### AIDT-04 Verification
**Method:** Error injection + network throttling
1. Block CDN network request or use offline mode
2. Click "Auto crop"
3. Verify crop window centers in image (center-crop)
4. Verify toast shows "Center crop applied" or "Detection unavailable"
5. Re-enable network and verify normal operation

### AIDT-05 Verification
**Method:** Performance monitoring
1. Open browser DevTools Performance tab
2. Start recording
3. Click "Auto crop" on a large image (>5MP)
4. Verify UI remains responsive during processing (no freezing)
5. Verify main thread indicator shows no blocking activity
6. Verify worker context receives and processes message

### UI-SPEC Acceptance Verification
| Criterion | Test Method | Pass Condition |
|-----------|-------------|-----------------|
| Button has sparkles icon | Visual inspection | Icon visible, not generic fallback |
| Accent color on button | DevTools color picker | `var(--accent)` applied (#3b82f6 / #60a5fa) |
| Spinner during processing | Visual inspection | CSS animation visible, button disabled |
| Toast bottom-center | Visual inspection | Positioned at bottom center, auto-dismisses |
| A key shortcut | Manual keyboard test | A key triggers detection, no trigger in inputs |

---

## Edge Cases

### Empty State
- No image selected: Auto crop button should be disabled

### Large Images
- Images >50MP: Detection should still complete without crashing
- Worker timeout: If detection takes >30s, treat as failure and apply center-crop

### Repeated Detection
- Multiple rapid clicks: Button disabled during processing prevents queue buildup
- Re-detection: Should work correctly on same image multiple times

### Worker Lifecycle
- Worker termination: Should not leave dangling resources
- Memory cleanup: ImageBitmap properly closed after transfer

---

## Release Criteria

Phase 3 is complete when ALL of the following are TRUE:

1. **AIDT-01:** Auto crop button exists and triggers detection
2. **AIDT-02:** Smartcrop.js loads from CDN on first use, not bundled
3. **AIDT-03:** Crop window repositions to detected focal point
4. **AIDT-04:** Center-crop fallback works when detection fails
5. **AIDT-05:** Detection runs in Web Worker without UI freeze
6. **UI-SPEC:** Button styling, toast notifications, and keyboard shortcut all match spec

---

*Validation document: 2026-07-17*
