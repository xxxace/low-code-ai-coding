/**
 * @file SnapLines.vue
 * @description 吸附辅助线组件
 *
 * 功能：
 * 1. 渲染水平和垂直吸附线
 * 2. 配合 useFreeDrag 显示吸附检测结果
 */

<template>
  <div class="snap-lines-container">
    <!-- 水平吸附线 -->
    <div
      v-for="(line, index) in horizontalLines"
      :key="`h-${index}`"
      class="snap-line snap-line--horizontal"
      :style="{
        top: `${line.y}px`,
        left: `${line.start}px`,
        width: `${line.end - line.start}px`,
      }"
    />
    
    <!-- 垂直吸附线 -->
    <div
      v-for="(line, index) in verticalLines"
      :key="`v-${index}`"
      class="snap-line snap-line--vertical"
      :style="{
        left: `${line.x}px`,
        top: `${line.start}px`,
        height: `${line.end - line.start}px`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface HorizontalLine {
  y: number
  start: number
  end: number
}

interface VerticalLine {
  x: number
  start: number
  end: number
}

interface Props {
  horizontalLines: HorizontalLine[]
  verticalLines: VerticalLine[]
}

const props = withDefaults(defineProps<Props>(), {
  horizontalLines: () => [],
  verticalLines: () => [],
})
</script>

<style scoped>
.snap-lines-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.snap-line {
  position: absolute;
  background-color: #1890ff;
}

.snap-line--horizontal {
  height: 1px;
}

.snap-line--vertical {
  width: 1px;
}
</style>