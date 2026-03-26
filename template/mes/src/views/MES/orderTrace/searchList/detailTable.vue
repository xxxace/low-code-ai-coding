<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" footer :data="props.data">
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
  { title: '#', type: 'seq', align: 'center', width: '60px' },
  {
    title: '工序',
    field: 'JOBNO',
    width: 60,
    align: 'center'
  },
  {
    title: '工序名称',
    field: 'JOBNAME',
    width: 70,
    align: 'center'
  },
  {
    title: '子工序',
    field: 'JOBNO1',
    width: 60,
    align: 'center'
  },
  {
    title: '子工序名称',
    field: 'JOBNAME1',
    width: 70,
    align: 'center'
  },
  {
    title: '牌号',
    field: 'TKTSEQ',
    width: 90,
    align: 'center'
  },
  {
    title: '件号',
    field: 'LABSEQ',
    width: 90,
    align: 'center'
  },
  {
    title: '产线',
    field: 'WCNAME',
    width: 90,
    align: 'center'
  },
  {
    title: '机位号',
    field: 'WORKNUM',
    width: 70,
    align: 'center'
  },
  {
    title: '员工',
    field: 'STAFF',
    width: 100,
    align: 'center',
    formatter: ({ cellValue }) => {
      if (!cellValue) return cellValue
      return Array.from(new Set(cellValue.split(','))).join(',')
    }
  },
  {
    title: '发货时间',
    field: 'DTIME',
    width: 130,
    align: 'center'
  },
  {
    title: '收货时间',
    field: 'RTIME',
    width: 130,
    align: 'center'
  },
  {
    title: '收货件数',
    field: 'RQTY',
    width: 70,
    align: 'center',
    summary: true
  },
  {
    title: '次品件数',
    field: 'BADQTY',
    width: 70,
    align: 'center',
    summary: true
  },
  {
    title: '生产时间\n(小时)',
    field: 'WKHRS',
    width: 70,
    align: 'center',
    summary: true
  },
  {
    title: '生产效率\n(小时/件)',
    field: 'WKRATE',
    width: 70,
    align: 'center',
    summary: true
  }
])

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
