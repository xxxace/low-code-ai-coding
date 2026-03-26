<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data"></ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref } from 'vue'
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
      title: t('gvRegisterDate_JOBNAME', '工序'),
      field: 'JOBNAME',
      align: 'center'
    },
    {
      title: t('gvRegisterDate_FNDT', '日期'),
      field: 'FNDT',
      width: 140,
      align: 'center',
      formatter: 'datetime'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
