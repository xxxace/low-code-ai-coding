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
const emit = defineEmits(['openOrder'])
const i18nReactive = createI18nReactive('VUE_MES_QT')
const tableRef = ref<any>()
const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    {
      title: t('gvColorGroup_SEQ', '序号'),
      field: 'SEQ',
      width: 60,
      align: 'center'
    },
    {
      title: t('gvColorGroup_V_CL', '颜色組'),
      field: 'V_CL',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvColorGroup_WKDATE', '开织日期'),
      field: 'WKDATE',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvColorGroup_QTY', '订单数'),
      field: 'QTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColorGroup_PQTY', '已排数'),
      field: 'PQTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColorGroup_QQTY', '欠数'),
      field: 'QQTY',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColorGroup_QTRATE', '齐套率'),
      field: 'QTRATE',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'percentage'
    }
  ]
})

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
