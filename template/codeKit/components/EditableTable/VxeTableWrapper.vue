<template>
  <div class="vxe-table-parent-wrapper">
    <div class="vxe-table-subparent-wrapper">
      <slot></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.vxe-table-parent-wrapper {
  position: relative;

  .vxe-table-subparent-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
  }
}
</style>
