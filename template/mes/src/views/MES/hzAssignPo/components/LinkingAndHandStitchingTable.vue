<template>
  <ReportTable
    ref="tableRef"
    class="h-full"
    :columns="columns"
    :data="props.data"
    :toolBar="false"
    footer
    v-bind="attrs"
  />
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
const columns = useNsI18nColumns<any>({
  scope: 'VUE_MES_POFTY',
  columns: [
    { title: '#', type: 'seq', align: 'center', width: '60px', fixed: 'left' },
    {
      field: 'BILLNO',
      title: '合约号',
      i18nKey: 'lbBILLNO',
      width: 180
    },
    {
      field: 'FTYNO',
      title: '工厂编码',
      i18nKey: 'lbFTYNO',
      width: 90
    },
    {
      field: 'FTYNAME',
      title: '工厂名称',
      i18nKey: 'lbFTYNAME',
      width: 180
    },
    {
      field: 'KNIT_DATE',
      title: '缝盘日期',
      i18nKey: 'lbKNIT_DATE',
      width: 90,
      align: 'center'
    },
    {
      field: 'END_DATE',
      title: '缝盘交期',
      i18nKey: 'lbEND_DATE',
      width: 90,
      align: 'center'
    },
    {
      field: 'QTY',
      title: '数量',
      i18nKey: 'lbQTY',
      width: 110,
      align: 'right',
      formatter: 'number',
      summary: true
    }
    // ,
    // {
    //   field: 'STFG',
    //   title: '状态',
    //   i18nKey: 'lbSTFG',
    //   width: 110,
    //   align: 'center'
    // }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>

<style lang="scss">
.editable-col {
  background-color: #d7e4ff;

  .vxe-cell .vxe-cell--title,
  .vxe-cell--title {
    color: blue !important;
  }
}
</style>
