<template>
  <div class="app-layout">
    <!-- Header bar -->
    <header class="app-header">
      <h1 class="app-header__title">Image Cropper</h1>
    </header>

    <!-- Two-column layout -->
    <div class="app-layout__content">
      <!-- Left sidebar: Image list -->
      <aside class="app-layout__sidebar">
        <ImageList />
      </aside>

      <!-- Main area: Crop workspace -->
      <main class="app-layout__main">
        <CropWorkspace />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageList from '~/components/ImageList.vue'
import CropWorkspace from '~/components/CropWorkspace.vue'

// Page title
useHead({
  title: 'Image Cropper',
})
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);

  &__content {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr;
    overflow: hidden;
  }

  &__sidebar {
    overflow: hidden;
    border-right: 1px solid var(--border);
  }

  &__main {
    overflow: hidden;
  }
}

.app-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

// Responsive: stack vertically on narrow screens
@media (max-width: 768px) {
  .app-layout {
    &__content {
      grid-template-columns: 1fr;
      grid-template-rows: 200px 1fr;
    }

    &__sidebar {
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
  }
}
</style>
