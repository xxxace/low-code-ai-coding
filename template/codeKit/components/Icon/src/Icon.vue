<script setup lang="ts">
import {computed, unref} from 'vue'
import {ElIcon} from 'element-plus'
import {useDesign} from '../../../hooks/useDesign'
import {Icon} from '@iconify/vue'


const ICON_PREFIX = 'vi-'

const {getPrefixCls} = useDesign()

const prefixCls = getPrefixCls('icon')

const props = defineProps({
  // icon name
  icon: String,
  // icon color
  color: String,
  // icon size
  size: {
    type: Number,
    default: 16
  },
  hoverColor: String
})

const isLocal = computed(() => props.icon.startsWith('svg-icon:'))

const symbolId = computed(() => {
  return unref(isLocal) ? `#icon-${props.icon.split('svg-icon:')[1]}` : props.icon
})

// 是否使用在线图标
const isUseOnline = computed(() => {
  return true
})

const getIconifyStyle = computed(() => {
  const {color, size} = props
  return {
    fontSize: `${size}px`,
    color
  }
})

const getIconName = computed(() => {
  return props.icon.startsWith(ICON_PREFIX) ? props.icon.replace(ICON_PREFIX, '') : props.icon
})
</script>

<template>
  <ElIcon :class="prefixCls" :size="size" :color="color">
    <svg v-if="isLocal" aria-hidden="true">
      <use :xlink:href="symbolId"/>
    </svg>

    <template v-else>
      <Icon v-if="isUseOnline" :icon="getIconName" :style="getIconifyStyle"/>
      <div v-else :class="`${icon} iconify`" :style="getIconifyStyle"></div>
    </template>
  </ElIcon>
</template>

<style lang="scss" scoped>
$prefix-cls: 'v-icon';

.#{ $prefix-cls},
.iconify {
  :deep(svg) {
    &:hover {
      // stylelint-disable-next-line
      color: v-bind(hoverColor) !important;
    }
  }
}

.iconify {
  &:hover {
    // stylelint-disable-next-line
    color: v-bind(hoverColor) !important;
  }
}
</style>
