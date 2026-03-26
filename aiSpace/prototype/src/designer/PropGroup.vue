<!--
  PropGroup.vue
  属性面板分组容器，带折叠功能
-->
<template>
  <div class="prop-group" :class="{ 'prop-group--collapsed': !expanded }">
    <div class="prop-group__header" @click="expanded = !expanded">
      <span class="prop-group__title">{{ title }}</span>
      <el-icon class="prop-group__arrow" :class="{ 'is-expanded': expanded }">
        <ArrowRight />
      </el-icon>
    </div>
    <div v-show="expanded" class="prop-group__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

interface Props {
  title: string
  /** 默认是否展开，默认 true */
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: true,
})

const expanded = ref(props.defaultExpanded)
</script>

<style scoped>
.prop-group {
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 2px;
}

.prop-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 4px;
  cursor: pointer;
  user-select: none;
  border-radius: 3px;
  transition: background 0.1s;
}

.prop-group__header:hover {
  background: #f5f7fa;
}

.prop-group__title {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  letter-spacing: 0.3px;
}

.prop-group__arrow {
  font-size: 10px;
  color: #c0c4cc;
  transition: transform 0.2s;
  transform: rotate(0deg);
}

.prop-group__arrow.is-expanded {
  transform: rotate(90deg);
}

.prop-group__body {
  padding-bottom: 4px;
}

/* 折叠状态 */
.prop-group--collapsed .prop-group__header {
  padding-bottom: 7px;
}
</style>
