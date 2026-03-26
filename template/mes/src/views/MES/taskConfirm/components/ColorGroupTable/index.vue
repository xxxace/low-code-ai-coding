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
    // { type: 'seq', title: '序号', width: '50px', fixed: 'left', align: 'center' },
    {
      title: t('gvColorGroup_CUTSEQ', '分隔號'),
      field: 'CUTSEQ',
      width: 60,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvColorGroup_CLSEQ', '颜色序号'),
      field: 'CLSEQ',
      width: 70,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvColorGroup_CLNAME', '颜色名稱'),
      field: 'CLNAME',
      width: 200,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvColorGroup_QTY', '数量'),
      field: 'QTY',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvColorGroup_FRNUM', '牌号始'),
      field: 'FRNUM',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvColorGroup_TONUM', '牌号止'),
      field: 'TONUM',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvColorGroup_TKTQTY', '牌数'),
      field: 'TKTQTY',
      width: 90,
      align: 'center'
    }
  ]
})

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
