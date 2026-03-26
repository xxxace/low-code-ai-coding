<template>
  <el-tag :type="statusType" size="small">
    <span>{{ statusText }}</span>
    <span v-if="percentage > 0 && percentage < 100">{{ percentage }}%</span>
  </el-tag>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { TagProps } from 'element-plus'

const props = defineProps<{
  status: string
  percentage: number
}>()

const statusType = computed<TagProps['type']>(() => {
  switch (props.status) {
    case '已完成':
      return 'success'
    case '生产中':
      return 'primary'
    case '待开始':
      return 'info'
    default:
      return 'info'
  }
})

const statusText = computed(() => props.status)
</script>
