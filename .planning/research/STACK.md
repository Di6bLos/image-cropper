# Technology Stack

**Project:** Browser-Based Bulk Image Cropping Web App
**Researched:** 2026-06-24
**Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Nuxt | 3.x (3.10+) | Meta-framework | File-based routing, server routes, auto-imports, Vite bundling. Current stable is 3.x, Nuxt 4 is in alpha with breaking changes. |
| Vue | 3.5.x | UI framework | Composition API with `<script setup>`, shallowRef for performance, reactive refs. |
| Sass | 1.101.x | CSS preprocessor | Dart Sass is the standard, integrated via Vite/Nuxt natively. |

### Image Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Browser Canvas API | Native | Crop/resize operations | No library needed. Use `ctx.drawImage()` with crop coordinates. Native browser API, zero overhead. |
| Smartcrop.js | 2.0.5 | AI-lite subject detection | Traditional CV (edge detection, skin color, saturation). ~17KB, <20ms inference. Face detection can be added via tracking.js boost. **Start here.** |
| @xenova/transformers | 3.x | Optional: full AI detection | Only if Smartcrop.js proves insufficient. WebGPU support in v3. Heavy bundle (ML models). |

**Why not Fabric.js:** Fabric.js is a full canvas editor framework (100KB+). You only need crop coordinates and canvas drawing -- the native Canvas API is sufficient.

### Zip Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| JSZip | 3.10.1 | Create downloadable zip | Browser standard. `generateAsync({type: "blob"})` returns a blob for `saveAs()`. Works in all modern browsers. |

### Web Workers

| Technology | Purpose | Why |
|------------|---------|-----|
| Native Web Workers | Heavy async operations | Nuxt 3 supports `routeRules` for worker routes, or use `new Worker()` directly. Move AI inference and image encoding off the main thread to prevent UI blocking. |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Pinia | via @pinia/nuxt 0.11.3 | Global state | Official Vue 3 state library. Use `shallowRef()` for image data (avoids deep reactivity overhead). `storeToRefs()` for reactive destructuring. |

### Backend

| Technology | Purpose | Why |
|------------|---------|-----|
| Nuxt Server Routes | Future API/auth | Built into Nuxt 3 under `/server/api/`. Use for future auth, API key management. H3 is the underlying HTTP framework (already included). |
| H3 | HTTP utilities | H3 is bundled with Nuxt. Provides request handling, validation, error handling for server routes. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Image detection | Smartcrop.js | Transformers.js | Smartcrop is 17KB vs hundreds of MB for ML models. Speed: <20ms vs seconds. Only upgrade if accuracy is unacceptable. |
| Canvas | Native API | Fabric.js | Fabric.js is 100KB+ for full editor features. You only need drawImage with crop coordinates. |
| State | Pinia | Vuex | Pinia is the official Vue 3 recommendation. Better TypeScript support, simpler API. |
| Backend | Nuxt Server Routes | Express/Fastify | Nuxt server routes are lightweight, co-located, and use H3 natively. No separate server process needed for this use case. |

## Installation

```bash
# Core dependencies
npm install nuxt@^3.10 vue@^3.5

# Nuxt modules
npm install -D sass
npx nuxt module add pinia

# Image processing
npm install smartcrop

# Zip generation
npm install jszip
```

## Nuxt Config Highlights

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Sass configuration if needed
        }
      }
    }
  },

  // Opt into Nuxt 4 if ready to migrate
  // future: { compatibilityVersion: 4 }
})
```

## Key Architectural Decisions

1. **Client-side only processing:** All image manipulation uses browser Canvas API. Images never leave the browser. This eliminates privacy concerns and server costs.

2. **Smartcrop.js as MVP AI:** Start with traditional CV-based detection. Only upgrade to Transformers.js if real users report accuracy issues. YAGNI applies to ML bundle size.

3. **Web Workers for batch processing:** When processing dozens of images, run encoding/cropping in workers. The main thread stays responsive for UI updates.

4. **shallowRef for image data:** Image blobs are large. Using `shallowRef()` avoids Vue traversing the entire blob for reactivity. Only the reference itself is reactive.

5. **Pinia for cross-component state:** Image queue, crop settings, export progress all need to be accessible across components. Pinia provides clean separation.

## Sources

- [Nuxt 3 Documentation](https://nuxt.com/docs/3.x) - Context7 ID: /websites/nuxt_3_x
- [Vue 3 Documentation](https://vuejs.org/) - Context7 ID: /vuejs/vue
- [Pinia Documentation](https://pinia.vuejs.org/) - Context7 ID: /websites/pinia_vuejs
- [Smartcrop.js GitHub](https://github.com/jwagner/smartcrop.js/) - Context7 ID: /jwagner/smartcrop.js
- [JSZip Documentation](https://stuk.github.io/jszip/) - Context7 ID: /stuk/jszip
- [H3 HTTP Framework](https://h3.unjs.io/) - Context7 ID: /h3js/h3
- [Smartcrop.js vs Transformers.js Comparison](https://dev.to/emojiiii/how-to-build-an-image-processor-with-react-and-transformersjs-2kf6) - Web Search
