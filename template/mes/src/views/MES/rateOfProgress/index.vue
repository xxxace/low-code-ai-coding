<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '开始日期')" :width="70">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.BEGDT"
            type="date"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '结束日期')" :width="70">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.ENDDT"
            type="date"
            placeholder="选择结束日期"
          />
        </FieldItem>

        <FieldItem :label="t('lbBOOKER', '生产单号')" :width="70">
          <el-input class="w-[140px]!" v-model="query.ORDNO" placeholder="请输入生产单号" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '合约号')" :width="70">
          <el-input class="w-[140px]!" v-model="query.PMNO" placeholder="请输入合约号" />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>

    <!-- 表格区域 -->
    <AceFieldset legend="每日生产报表" absolute class="flex-1 overflow-hidden">
      <SystemReportTable :data="mainTableData" :loading="loading" />
    </AceFieldset>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import { dayjs, ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'
import { formatString } from '@/utils'

import SystemReportTable from '@/views/MES/rateOfProgress/components/systemTable/index.vue'

defineOptions({
  objectName: 'VUE_MES_PMSCH'
})

const { t, c } = useI18nProxy('VUE_MES_PMSCH')
const loading = ref(false)

const permissionList = JSON.parse(window.localStorage.getItem('ns-user') || '{}').permissionList
const objectId = permissionList.find((item: any) => item.ENAME === 'VUE_MES_PMSCH')?.OBJECTID

const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_PMSCH', objectId })
const [query] = useParamsRefManager(() => {
  return {
    BEGDT: dayjs().format('YYYY-MM-DD'),
    ENDDT: dayjs().format('YYYY-MM-DD'),
    ORDNO: '',
    PMNO: ''
  }
})

const [mainTableData] = useArrayRefManager<any>([])

async function loadData() {
  if (loading.value) return
  loading.value = true
  try {
    const remoteSql = remoteSqlMap['工单列表']
    const sqlParams = generateSQLParams()

    const materialList = await searchList<any[]>({
      sql: formatString(remoteSql.DBQUERY),
      params: sqlParams,
      sortby: remoteSql.SORTBYCONTENT
    })

    mainTableData.value = materialList
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

function generateSQLParams() {
  const params = query.value
  const SQLParams: Record<string, any> = {}

  if (params.BEGDT) {
    const begdt =
      typeof params.BEGDT === 'object' && params.BEGDT !== null
        ? (params.BEGDT as Date).toISOString().split('T')[0]
        : params.BEGDT
    SQLParams['PJ.BEGDT__gte@date'] = begdt
  }
  if (params.ENDDT) {
    const enddt =
      typeof params.ENDDT === 'object' && params.ENDDT !== null
        ? (params.ENDDT as Date).toISOString().split('T')[0]
        : params.ENDDT
    SQLParams['PJ.ENDDT__lte@date'] = enddt
  }
  if (params.ORDNO && params.ORDNO.trim()) {
    SQLParams['O.ORDNO'] = params.ORDNO.trim()
  }
  if (params.PMNO && params.PMNO.trim()) {
    SQLParams['O.PMNO'] = params.PMNO.trim()
  }

  return SQLParams
}

onMounted(async () => {
  loadData()
})
</script>
<style lang="scss" scoped></style>
