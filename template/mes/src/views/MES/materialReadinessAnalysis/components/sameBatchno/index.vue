<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data">
    <template #action="{ row }">
      <el-button type="primary" size="small">借调</el-button>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { createI18nReactive } from '@/hooks/nameson/useI18nReactive.ts'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const i18nReactive = createI18nReactive('VUE_MES_QT')
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    {
      title: t('gvSameBatchno_VAT', '缸号'),
      field: 'VAT',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvSameBatchno_ORDNO', '批号'),
      field: 'ORDNO',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvSameBatchno_V_OWNQTYORDSEQ', '总需求量'),
      field: 'V_OWNQTYORDSEQ',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvSameBatchno_V_REQDTTM', '需求日期'),
      field: 'V_REQDTTM',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvSameBatchno_YRSQTYORDSEQ', '预留数'),
      field: 'YRSQTYORDSEQ',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvSameBatchno_YOSQTYORDSEQ', '发料'),
      field: 'YOSQTYORDSEQ',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvSameBatchno_QTRATEORDSEQ', '齐套%'),
      field: 'QTRATEORDSEQ',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvSameBatchno_V_SQTYORDSEQ', '欠数'),
      field: 'V_SQTYORDSEQ',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvSameBatchno_WHDATE', '入库日期'),
      field: 'WHDATE',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvSameBatchno_RMK', '入库备注'),
      field: 'RMK',
      minWidth: 140,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvSameBatchno_action', '操作'),
      width: 60,
      align: 'center',
      slots: { default: 'action' },
      fixed: 'right'
    }
  ]
})

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
