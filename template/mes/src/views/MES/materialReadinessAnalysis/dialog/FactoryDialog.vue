<template>
  <DialogPicker
    ref="dialogPickerRef"
    :title="t('ttClientQuery', '工厂查询')"
    width="640px"
    height="600px"
    mode="confirm"
    lock-view
    footer
    :manager="queryParamsManager"
    :sql="sql"
    :sortby="sortby"
    :columns="columns"
    @confirm="handleConfirm"
  >
    <template #search="{ onSearch, onReset }">
      <FieldItem :label="t('lbCODE', '编码')" :width="56">
        <el-input class="w-[120px]!" v-model="queryParams['CODE__like']" />
      </FieldItem>

      <FieldItem :label="t('lbSNAME', '名称')" :width="28">
        <el-input class="w-[120px]!" v-model="queryParams['NVL(SNAME,NVL(CNAME,ENAME))__like']" />
      </FieldItem>

      <FieldItem class="align-bottom">
        <el-button type="primary" size="small" @click="() => handleSearch(onSearch)"
          >{{ c('查询', 'common.query') }}
        </el-button>
        <el-button size="small" @click="onReset">{{ c('重置', 'common.reset') }}</el-button>
      </FieldItem>
    </template>
  </DialogPicker>
</template>
<script setup lang="ts">
import DialogPicker from '@/components/Nameson/Dialog/DialogPicker.vue'
import { useParamsRefManager } from '@/hooks/nameson/useRefManager'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { VxeGridPropTypes } from 'vxe-table'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { ref } from 'vue'
import { getResizeModelExposeProxy } from '@/utils'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql.ts'

const emit = defineEmits(['confirm'])
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_QT' })

const { t, c } = useStdFormI18n()
const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    ['CODE__like']: '',
    ['NVL(SNAME,NVL(CNAME,ENAME))__like']: ''
  }
})

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'seq', width: 50 },
    { field: 'CODE', title: t('gvBO_CODE', '编码'), width: 100 },
    { field: 'CNAME', title: t('gvBO_CNAME', '名称') }
  ]
})
// 查询语句
const sql = () => remoteSqlMap['批号_工厂下拉框'].DBQUERY
const sortby = () => remoteSqlMap['批号_工厂下拉框'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  // if (!queryParams.value['A.ITEMNO__like'] && !queryParams.value['A.ITEMNAME__like']) {
  //   ElMessageBox.alert('查询条件不能为空！', '提示', { type: 'warning' })
  //   return
  // }

  onSearch()
}
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
