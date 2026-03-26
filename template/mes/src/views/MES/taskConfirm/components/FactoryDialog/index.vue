<template>
  <DialogPicker
    ref="dialogPickerRef"
    :title="t('ttFactoryQuery', '工厂查询')"
    width="640px"
    height="600px"
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
      <FieldItem :label="t('lbCODE', '编码')" :width="56">
        <el-input class="w-[120px]!" v-model="queryParams['A.CODE__like']" />
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
import { getResizeModelExposeProxy } from '@/utils'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'

const emit = defineEmits(['confirm'])
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_PSTASK' })

const { t, c } = useI18nProxy('VUE_MES_PSTASK_GD')
const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    ['A.CODE__like']: '',
    ['A.CNAME__like']: ''
  }
})

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'seq', width: 50 },
    { field: 'CODE', title: t('gvFactory_CODE', '编码'), width: 100 },
    { field: 'CNAME', title: t('gvFactory_CNAME', '名称') }
  ]
})
// 查询语句
const sql = () => remoteSqlMap['工厂下拉框查询语句'].DBQUERY
const sortby = () => remoteSqlMap['工厂下拉框查询语句'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  onSearch()
}
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
