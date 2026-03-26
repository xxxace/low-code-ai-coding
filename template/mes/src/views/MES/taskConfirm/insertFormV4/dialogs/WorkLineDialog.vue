<template>
  <DialogPicker
    ref="dialogPickerRef"
    :title="t('ttWorkLineQuery', '产线查询')"
    width="640px"
    height="400px"
    mode="confirm"
    lock-view
    footer
    :manager="queryParamsManager"
    :sql="sql"
    :sort-by="sortby"
    :columns="columns"
    @confirm="handleConfirm"
  >
    <template #search="{ onSearch, onReset }">
      <FieldItem :label="t('lbWCSEQ', '编码')" :width="56">
        <el-input class="w-[120px]!" v-model="queryParams['A.WCSEQ__like']" />
      </FieldItem>

      <FieldItem :label="t('lbCNAME', '名称')" :width="28">
        <el-input class="w-[120px]!" v-model="queryParams['A.CNAME__like']" />
      </FieldItem>

      <FieldItem class="align-bottom">
        <el-button type="primary" size="small" @click="() => handleSearch(onSearch)">
          {{ c('查询', 'common.query') }}
        </el-button>
        <el-button size="small" @click="onReset">{{ c('重置', 'common.reset') }}</el-button>
      </FieldItem>
    </template>
  </DialogPicker>
</template>
<script setup lang="ts">
import DialogPicker from '@/components/Nameson/Dialog/DialogPicker.vue'
import { useParamsRefManager } from '@/hooks/nameson/useRefManager'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { VxeGridPropTypes } from 'vxe-table'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { ref } from 'vue'
import { formatString, getResizeModelExposeProxy } from '@/utils'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'

const props = defineProps<{
  FTYNO: string
}>()
const emit = defineEmits(['confirm'])
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_INSERT' })

const { t, c } = useI18nProxy('VUE_MES_INSERT')
const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    ['A.WCSEQ__like']: '',
    ['A.CNAME__like']: '',
    ['A.FTYNO']: props.FTYNO
  }
})

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'seq', width: 50 },
    { field: 'WCSEQ', title: t('gvWorkLine_WCSEQ', '产线编码'), width: 80 },
    { field: 'WCNAME', title: t('gvWorkLine_WCSEQ', '产线名称'), width: 140 },
    {
      field: 'PRODUCTION_BASENAME',
      title: t('gvWorkLine_PRODUCTION_BASENAME', '工业区名称')
    },
    { field: 'DEPTNAME', title: t('gvWorkLine_DEPTNAME', '部门名称'),
      width: 80 }
  ]
})
// 查询语句
const sql = () => remoteSqlMap['产线的查询语句'].DBQUERY
const sortby = () => remoteSqlMap['产线的查询语句'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  onSearch()
}
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
