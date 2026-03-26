<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data">
    <template #STFGNAME="{ row }">
      <el-tag :type="row.STFGNAME === '已完成' ? 'success' : 'primary'" effect="dark" round
        >{{ row.STFGNAME }}
      </el-tag>
    </template>
    <template #action="{ row }">
      <el-button type="primary" size="small">牌号清单</el-button>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { createI18nReactive } from '@/hooks/nameson/useI18nReactive.ts'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const i18nReactive = createI18nReactive('VUE_MES_PSTASK')
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()

const columns = i18nReactive<ReportTableColumn[]>(({ t, c }) => {
  return [
    {
      title: t('gvWorkOrder_WKDATE', '日期'),
      field: 'WKDATE',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvWorkOrder_WCNAME', '产线'),
      field: 'WCNAME',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvWorkOrder_WKNUM', '机台数'),
      field: 'WKNUM',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvWorkOrder_QTY', '计划数量'),
      field: 'QTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWorkOrder_STFG', '状态'),
      field: 'STFG',
      width: 70,
      align: 'center'
    },
    {
      title: t('gvWorkOrder_PCT', '进度%'),
      field: 'PCT',
      width: 70,
      align: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvWorkOrder_WIPQTY', '收货数量'),
      field: 'WIPQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWorkOrder_WKDATE', '操作'),
      field: 'ZT',
      width: 90,
      align: 'center',
      fixed: 'right',
      slots: { default: 'action' }
    }
  ]
})

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
