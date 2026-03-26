<template>
  <DialogPicker
    ref="dialogPickerRef"
    :title="t('ttColorQuery', '颜色查询')"
    width="640px"
    height="400px"
    mode="confirm"
    lock-view
    footer
    :sql="sql"
    :sort-by="sortby"
    :columns="columns"
    @confirm="handleConfirm"
  >
  </DialogPicker>
</template>
<script setup lang="ts">
import DialogPicker from '@/components/Nameson/Dialog/DialogPicker.vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { VxeGridPropTypes } from 'vxe-table'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { ref } from 'vue'
import { formatString, getResizeModelExposeProxy } from '@/utils'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import {ColorGroupVO} from "$types/views/MES/insertOrder.ts";

const props = defineProps<{
  PMSEQ: number
}>()
const emit = defineEmits(['confirm'])
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_INSERT' })

const { t, c } = useI18nProxy('VUE_MES_INSERT')
const dialogPickerRef = ref(null)

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<ColorGroupVO>[]>(() => {
  return [
    { field: 'CUTSEQ', title: t('gvColor_CUTSEQ', '分隔号'), width: 80 },
    { field: 'CLSEQ', title: t('gvColor_CLSEQ', '颜色序号'), width: 80 },
    { field: 'CLNAME', title: t('gvColor_CUTSEQ', '颜色名称'), width: 80 },
    {
      field: 'QTY',
      title: t('gvColor_QTY', '数量'),
      align: 'right',
      width: 80,
      formatter: 'number'
    },
    { field: 'FRNUM', title: t('gvColor_FRNUM', '牌号始'), align: 'center', width: 80 },
    { field: 'TONUM', title: t('gvColor_TONUM', '牌号止'), align: 'center', width: 80 },
    {
      field: 'TKTQTY',
      title: t('gvColor_TKTQTY', '牌数'),
      align: 'right',
      width: 80,
      formatter: 'number'
    }
  ]
})
// 查询语句
const sql = () => formatString(remoteSqlMap['查询颜色组明细的语句'].DBQUERY, props.PMSEQ)
const sortby = () => remoteSqlMap['查询颜色组明细的语句'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  onSearch()
}
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
