<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data">
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { createI18nReactive } from '@/hooks/nameson/useI18nReactive'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const i18nReactive = createI18nReactive('VUE_MES_QT')
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    {
      title: t('gvTotalRequirement_V_MATUSE', '部位'),
      field: 'V_MATUSE',
      align: 'center'
    },
    {
      title: t('gvTotalRequirement_V_OWNQTY', '需毛数'),
      field: 'V_OWNQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number',
      summary: true
    },
    {
      title: t('gvTotalRequirement_V_OWRATE', '占比%'),
      field: 'V_OWRATE',
      width: 90,
      align: 'right',
      headerAlign: 'center'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
