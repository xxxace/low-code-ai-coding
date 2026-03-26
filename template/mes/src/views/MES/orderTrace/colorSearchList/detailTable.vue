<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data">
    <template #action="{ row }">
      <el-button type="primary" size="small" @click="handleDetailClick(row)">
        <Icon icon="vi-ep:edit" />
        <span>编辑</span>
      </el-button>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '#',
    type: 'seq',
    align: 'center',
    width: '60px',
    fixed: 'left'
  },
  {
    title: '纱线编码',
    field: 'MATNO',
    width: 90,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '纱线名称',
    field: 'MATNAME',
    width: 220,
    fixed: 'left'
  },
  {
    title: '色号',
    field: 'SPECNO',
    width: 100,
    fixed: 'left'
  },
  {
    title: '色名',
    field: 'SPECNO1',
    width: 100,
    align: 'left',
    fixed: 'left'
  },
  {
    title: '需求数量',
    field: 'QTY',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '预留数量',
    field: 'RSQTY',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '发料数量',
    field: 'OSQTY',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '欠料',
    field: 'UNRSQTY',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '损耗',
    field: 'WST',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '损耗率%',
    field: 'WST_PCT',
    width: 70,
    align: 'right',
    formatter: 'percentage',
    summary: true
  },
  {
    title: '单位',
    field: 'UNIT',
    width: 70,
    align: 'center'
  }
])

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
