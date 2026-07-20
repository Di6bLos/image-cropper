<template>
  <div class="crop-handle" />
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.crop-handle {
  position: absolute;
  right: -7px;
  bottom: -7px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: $color-primary;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: nwse-resize;
  touch-action: none;
}
</style>
