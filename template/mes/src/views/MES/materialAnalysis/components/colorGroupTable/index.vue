<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data"></ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
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
      title: t('gvWoolColorGroup_ORDNO', '批号'),
      field: 'ORDNO',
      width: 100,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolColorGroup_V_CL', '颜色组'),
      field: 'V_CL',
      width: 90,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolColorGroup_QTY', '件数'),
      field: 'QTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number',
      fixed: 'left'
    },
    {
      title: t('gvWoolColorGroup_V_MTCH', '排色'),
      field: 'V_MTCH',
      width: 70,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvWoolColorGroup_V_JMRATE', '计毛比重'),
      field: 'V_JMRATE',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'percentage2'
    },
    {
      title: t('gvWoolColorGroup_REQDTTM', '需毛日期'),
      field: 'REQDTTM',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      formatter: 'date'
    },
    {
      title: t('gvWoolColorGroup_V_PRQTY', '需纱数'),
      field: 'V_PRQTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolColorGroup_V_PRQTY', '申购'),
      field: 'V_PRQTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolColorGroup_YRSQTY', '预留'),
      field: 'YRSQTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolColorGroup_OSQTY', '发料'),
      field: 'OSQTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolColorGroup_V_SQTY', '欠数'),
      field: 'V_SQTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number',
      className: ({ row, column }) => {
        if (row[column.field] < 0) {
          return 'red-text'
        }
        return ''
      }
    },
    {
      title: t('gvWoolColorGroup_QTRATE', '齐套率'),
      field: 'QTRATE',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'percentage'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
