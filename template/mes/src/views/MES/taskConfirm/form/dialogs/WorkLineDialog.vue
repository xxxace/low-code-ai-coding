<template>
  <DialogPicker
    ref="dialogPickerRef"
    :title="t('ttWorkLineQuery', '产线查询')"
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
import {ResizeModalInstance} from "@/components/ResizeModal/types";

const props = defineProps<{
  wcseq: number
}>()
const emit = defineEmits(['confirm'])
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_MODIFY' })

const { t, c } = useI18nProxy('VUE_MES_MODIFY')
const dialogPickerRef = ref(null)

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'seq', width: 40 },
    { field: 'WCSEQ', title: t('gvWorkLine_WCSEQ', '产线编码'), width: 80 },
    { field: 'CNAME', title: t('gvWorkLine_CNAME', '产线名称'), width: 120 },
    {
      field: 'V_ORIGINNAME',
      title: t('gvWorkLine_V_ORIGINNAME', '工业区名称'),
      width: 120
    },
    {
      field: 'V_FTYNAME',
      title: t('gvWorkLine_V_FTYNAME', '工厂名称')
    }
  ]
})
// 查询语句
const sql = () => formatString(remoteSqlMap['产线的查询语句'].DBQUERY, props.wcseq)
const sortby = () => remoteSqlMap['产线的查询语句'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)

// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef) as ResizeModalInstance)
</script>
