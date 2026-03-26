<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data">
    <template #STFGNAME="{ row }">
      <el-tag :type="row.STFGNAME === '已完成' ? 'success' : 'primary'" effect="dark" round
        >{{ row.STFGNAME }}
      </el-tag>
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
const emit = defineEmits(['openOrder'])
const i18nReactive = createI18nReactive('VUE_MES_PSTASK')
const tableRef = ref<any>()

const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    {
      title: t('gvColorBlending_VAT', '缸号'),
      field: 'VAT',
      width: 120,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvColorBlending_QTY', '需求数'),
      field: 'QTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      fixed: 'left'
    },
    {
      title: t('gvColorBlending_FLQTY', '发料数'),
      field: 'FLQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center'
    },
    {
      title: t('gvColorBlending_CLQTY', '存料数'),
      field: 'CLQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center'
    },
    {
      title: t('gvColorBlending_QLQTY', '欠料'),
      field: 'QLQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center'
    }
  ]
})

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
