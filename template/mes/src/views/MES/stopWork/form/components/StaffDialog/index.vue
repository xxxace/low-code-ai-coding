<template>
  <DialogPicker
    ref="dialogPickerRef"
    :title="t('ttStaffQuery', '员工查询')"
    width="640px"
    height="550px"
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
      <FieldItem :label="t('lbEMPNO', '工号')" :width="56">
        <el-input class="w-[120px]!" v-model="queryParams['A.EMPNO__like']" />
      </FieldItem>

      <FieldItem :label="t('lbCNAME', '姓名')" :width="28">
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
import { ref, watch } from 'vue'
import { getResizeModelExposeProxy } from '@/utils'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'

const props = defineProps<{
  FTYNO?: string
  DEPTNO?: string
}>()
const emit = defineEmits(['confirm'])
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_STOP' })

const { t, c } = useI18nProxy('VUE_MES_STOP')
const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    ['A.EMPNO__like']: '',
    ['A.CNAME__like']: '',
    ['A.CORPNO']: props.FTYNO,
    ['A.DEPTNO']: props.DEPTNO
  }
})

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'seq', width: 50 },
    { field: 'EMPNO', title: t('gvStaff_EMPNO', '工号'), width: 100 },
    { field: 'EMPNAME', title: t('gvStaff_EMPNAME', '姓名'), width: 80 },
    { field: 'V_CORPNAME', title: t('gvStaff_V_CORPNAME', '工厂名称') },
    { field: 'V_DEPTNAME', title: t('gvStaff_V_DEPTNAME', '部门名称'), width: 80 },
    { field: 'V_JOBNAME', title: t('gvStaff_V_JOBNAME', '职位名称'), width: 80 }
  ]
})
// 查询语句
const sql = () => remoteSqlMap['选择员工的查询语句'].DBQUERY
const sortby = () => remoteSqlMap['选择员工的查询语句'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  onSearch()
}

watch(
  () => [props.FTYNO, props.DEPTNO],
  () => {
    queryParamsManager.reset()
  }
)
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
