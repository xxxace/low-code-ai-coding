<template>
  <DialogPicker
    ref="dialogPickerRef"
    :title="t('ttFactoryQuery', '停工查询')"
    width="980px"
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
      <FieldItem :label="t('lbREQNO', '单号')" :width="28" independent>
        <el-input class="w-[120px]!" v-model="queryParams['A.REQNO__like']" />
      </FieldItem>

      <FieldItem :label="t('lbSTFG', '状态')" :width="28" independent>
        <RemoteSelect
          class="!w-[120px]"
          autoLoad
          transfer
          v-model="queryParams['A.STFG']"
          :sql="remoteSqlMap['状态的查询语句'].DBQUERY"
          :orderby="remoteSqlMap['状态的查询语句'].SORTBYCONTENT"
        />
      </FieldItem>

      <FieldItem :label="t('lbREQSTAFF', '制单人')" :width="42" independent>
        <el-input class="w-[120px]!" v-model="queryParams['A.REQSTAFF__like']" />
      </FieldItem>

      <FieldItem :label="t('lbREQDATE', '单据日期')" :width="56" independent>
        <date-range-picker
          class="w-[210px]"
          v-model:start="queryParams['A.REQDATE__gte@date']"
          v-model:end="queryParams['A.REQDATE__lte@date']"
        />
      </FieldItem>

      <FieldItem class="align-bottom" independent>
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
import dayjs from 'dayjs'

const emit = defineEmits(['confirm'])
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_STOP' })

const { t, c } = useI18nProxy('VUE_MES_STOP')
const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    ['A.REQNO__like']: '',
    ['A.REQSTAFF__like']: '',
    ['A.REQDATE__gte@date']: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    ['A.REQDATE__lte@date']: '',
    ['A.STFG']: ''
  }
})

// 列配置
const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    // { type: 'seq', width: 50, align: 'center', fixed: 'left' },
    { field: 'REQNO', title: t('gvAdvancedQuery_REQNO', '单号'), width: 80, fixed: 'left' },
    {
      field: 'REQDATE',
      title: t('gvAdvancedQuery_REQDATE', '单据日期'),
      width: 80,
      fixed: 'left',
      align: 'center',
      formatter: 'date'
    },
    {
      field: 'REQSTAFF',
      title: t('gvAdvancedQuery_REQSTAFF', '制单人'),
      width: 60,
      fixed: 'left'
    },
    {
      field: 'V_FTYNAME',
      title: t('gvAdvancedQuery_V_FTYNAME', '工厂名称'),
      width: 100,
      fixed: 'left'
    },
    { field: 'V_DEPTNAME', title: t('gvAdvancedQuery_V_DEPTNAME', '部门名称'), width: 80 },
    { field: 'V_JOBNAME', title: t('gvAdvancedQuery_V_JOBNAME', '工序名称'), width: 80 },
    {
      field: 'V_STFGNAME',
      title: t('gvAdvancedQuery_V_STFGNAME', '状态'),
      width: 60,
      align: 'center'
    },
    { field: 'V_WCNAME', title: t('gvAdvancedQuery_V_WCNAME', '产线名称'), width: 80 },
    { field: 'V_POSTNAME', title: t('gvAdvancedQuery_V_POSTNAME', '职位名称'), width: 80 },
    { field: 'EMPNO', title: t('gvAdvancedQuery_EMPNO', '工号'), width: 100 },
    { field: 'V_EMPNAME', title: t('gvAdvancedQuery_V_EMPNAME', '姓名'), width: 70 },
    { field: 'BEGDT', title: t('gvAdvancedQuery_BEGDT', '放假起始'), width: 130 },
    { field: 'ENDDT', title: t('gvAdvancedQuery_ENDDT', '放假结束'), width: 130 },
    {
      field: 'HRS',
      title: t('gvAdvancedQuery_HRS', '放假时数'),
      width: 60,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    }
  ]
})
// 查询语句
const sql = () => remoteSqlMap['高级查询的查询语句'].DBQUERY
const sortby = () => remoteSqlMap['高级查询的查询语句'].SORTBYCONTENT
const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  onSearch()
}
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
