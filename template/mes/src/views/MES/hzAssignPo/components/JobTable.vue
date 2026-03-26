<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data" v-bind="attrs" />
</template>

<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { useNsI18nColumns } from '@/hooks/nameson/useNsI18nColumns'

const attrs = useAttrs()
const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = useNsI18nColumns({
  scope: 'VUE_MES_POFTY',
  columns: [
    {
      field: 'JOBNAME',
      title: '工序',
      i18nKey: 'lbJOBNAME',
      width: 80,
      fixed: 'left',
      align: 'center'
    },
    {
      field: 'BEGDT',
      title: '开始日期',
      i18nKey: 'lbBEGDT',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      field: 'ENDDT',
      title: '结束日期',
      i18nKey: 'lbENDDT',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      field: 'FTYNAME',
      title: '排产工厂',
      i18nKey: 'lbFTYNAME',
      minWidth: 110,
      align: 'left'
    },
    {
      field: 'QTY',
      title: '数量',
      i18nKey: 'lbQTY',
      width: 80,
      align: 'right',
      formatter: 'number'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
