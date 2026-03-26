<template>
  <DialogPicker
    ref="dialogPickerRef"
    :object-name="objectName"
    :title="t('ttClentSearch', '客户查询')"
    width="540px"
    height="600px"
    mode="confirm"
    lock-view
    :manager="queryParamsManager"
    :sql="sql"
    :sortby="sortby"
    :columns="columns"
    @confirm="handleConfirm"
  >
    <template #search="{ onSearch, onReset }">
      <FieldItem :label="t('lbCode', '编码')" :width="28">
        <el-input class="w-[120px]!" v-model="queryParams.CODE__like" />
      </FieldItem>

      <FieldItem :label="t('lbCname', '名称')" :width="28">
        <el-input class="w-[120px]!" v-model="queryParams['NVL(SNAME,NVL(CNAME,ENAME))__like']" />
      </FieldItem>

      <FieldItem class="align-bottom">
        <el-button type="primary" size="small" @click="onSearch">{{
          c('查询', 'common.query')
        }}</el-button>
        <el-button size="small" @click="onReset">{{ c('重置', 'common.reset') }}</el-button>
      </FieldItem>
    </template>
  </DialogPicker>
</template>
<script setup lang="ts" root>
import { useFetchSqlByObjectName } from '@/hooks/nameson/useFetchSql'
import DialogPicker from './DialogPicker.vue'
import { useParamsRefManager } from '@/hooks/nameson/useRefManager'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { VxeGridPropTypes } from 'vxe-table'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { ref } from 'vue'
import { getResizeModelExposeProxy } from '@/utils'

defineOptions({
  objectName: 'VUE_CLNTSEARCH'
})

const emit = defineEmits(['confirm'])
const objectName = 'VUE_CLNTSEARCH'
const remoteSqlMap = useFetchSqlByObjectName(objectName)
const { t, c } = useI18nProxy(objectName)
const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    CODE__like: '',
    ['NVL(SNAME,NVL(CNAME,ENAME))__like']: ''
  }
})

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'seq', width: 50 },
    { field: 'CODE', title: t('gvBo_CODE', '编码'), width: 150 },
    { field: 'CNAME', title: t('gvBo_CNAME', '名称') }
  ]
})
// 查询语句
const sql = () => remoteSqlMap.value['客户清单的查询语句'].DBQUERY
const sortby = () => remoteSqlMap.value['客户清单的查询语句'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
