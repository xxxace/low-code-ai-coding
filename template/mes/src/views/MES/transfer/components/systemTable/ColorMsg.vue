<template>
  <ReportTable
    ref="tableRef"
    class="h-full"
    footer
    :columns="columns"
    :data="props.data"
    :loading="props.loading"
    @cell-click="cellClick"
  />
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(
  defineProps<{ data: any[]; rowClick: (item: any) => void; loading: boolean }>(),
  {
    data: () => []
  }
)

const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '色名',
    field: 'CLSEQ',
    width: '50',
    align: 'center'
  },
  {
    title: '色名',
    field: 'CCL',
    width: '',
    align: 'center',
    summary: false
  }
])

// 模拟数据
const mockData = [
  {
    color: '1001',
    colorName: '红色'
  },
  {
    color: '1002',
    colorName: '蓝色'
  }
]
watch(
  () => props.data,
  () => {
    if (props.data.length > 0) {
      props.rowClick(props.data[0])
    }
  },
  { deep: true, immediate: true }
)
// 点击单元格
const cellClick = ({ row }) => {
  props.rowClick(row)
}
// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
