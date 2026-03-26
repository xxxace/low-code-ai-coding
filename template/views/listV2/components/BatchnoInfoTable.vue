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
    { title: '#', type: 'seq', align: 'center', width: '60px', fixed: 'left' },
    {
      field: 'ORDNO',
      title: '批号',
      i18nKey: 'lbORDNO',
      width: 110,
      fixed: 'left'
    },
    {
      field: 'STYNO',
      title: '款号',
      i18nKey: 'lbSTYNO',
      width: 110,
      fixed: 'left'
    },
    {
      field: 'STYNAME',
      title: '款号信息',
      i18nKey: 'lbSTYNAME',
      minWidth: 160,
      fixed: 'left'
    },
    {
      field: 'ORIGINNAME',
      title: '产地',
      i18nKey: 'lbORIGINNAME',
      width: 60,
      fixed: 'left'
    },
    {
      field: 'EQMCAT',
      title: '针种',
      i18nKey: 'lbEQMCAT',
      width: 100
    },
    {
      field: 'CLNTFTYNO',
      title: '承制工厂',
      i18nKey: 'lbCLNTFTYNO',
      width: 100
    },
    {
      field: 'MATDT',
      title: '齐毛日期',
      i18nKey: 'lbMATDT',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      field: 'SHPDTTO',
      title: '厂期',
      i18nKey: 'lbSHPDTTO',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      field: 'QTY',
      title: '数量',
      i18nKey: 'lbQTY',
      width: 100,
      align: 'right',
      formatter: 'number'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
