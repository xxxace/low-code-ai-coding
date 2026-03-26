<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data" v-bind="attrs">
  </ReportTable>
</template>

<script setup lang="ts">
import {ref, useAttrs, h} from 'vue'
import {getEditableTableExposeProxy} from '@/utils/util'
import {useNsI18nColumns} from "@/hooks/useNsI18nColumns";

const attrs = useAttrs()
const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = useNsI18nColumns({
  scope: '',
  columns: [
    {title: '#', type: 'seq', align: 'center', width: '60px'},
    {
      field: 'ENDTO',
      title: '排产日期',
      i18nKey: 'lbENDTO',
      width: 90,
      formatter: 'date'
    }, {
      field: 'QTY',
      title: '当日排产',
      i18nKey: 'lbQTY',
      minWidth: 60,
      align: 'right',
      formatter: 'number'
    }, {
      field: 'ACCQTY',
      title: '累计排产',
      i18nKey: 'lbACCQTY',
      minWidth: 60,
      align: 'right',
      formatter: 'number'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
