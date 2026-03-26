<template>
  <div class="flex flex-col p-1 overflow-hidden box-border">
    <!--    <AceFieldset :legend="c('查询', 'common.query')">-->
    <!--      <div>-->
    <!--        <FieldItem :label="t('lbBOOKER', '纱线')" :width="56">-->
    <!--          <el-input class="w-[60px]!" v-model="query.JOBNO" />-->
    <!--          <el-input class="w-[100px]!" v-model="query.JOBNAME" />-->
    <!--        </FieldItem>-->

    <!--        <FieldItem :width="0">-->
    <!--          <el-button type="primary" size="small" :loading="loading" @click="loadData"-->
    <!--            >{{ c('查询', 'common.query') }}-->
    <!--          </el-button>-->
    <!--        </FieldItem>-->
    <!--      </div>-->
    <!--    </AceFieldset>-->
    <div class="flex-1">
      <AceFieldset class="h-full">
        <template #legend>
          <div class="flex items-center">
            <span>明细数据</span>
          </div>
        </template>
        <DetailTable :loading="loading" :data="mainTableData" />
      </AceFieldset>
    </div>
  </div>
</template>
<script setup lang="tsx" root>
import { ref, onMounted } from 'vue'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import DetailTable from './detailTable.vue'
import DateRangePicker from '@/components/DateRangePicker/index.vue'
import dayjs from 'dayjs'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { searchList } from '@/api/nameson'
import { ElMessageBox } from 'element-plus'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { formatString } from '@/utils'
import { useUserStore } from '@/store/modules/user'
import { colorDTLListData } from '../tracePanel/mock'

defineOptions({
  objectName: 'VUE_MES_ORDSCH'
})

const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_ORDSCH' })

const { t, c } = useI18nProxy('VUE_MES_ORDSCH')

const loading = ref(false)

const [query, queryManager] = useParamsRefManager(() => {
  return {
    ORDSEQ: 0,
    CLSEQ: 0
  }
})

const [mainTableData, mainTableDataManager] = useArrayRefManager<any>([])

queryManager.init()

const generateSQLParams = () => {
  const params = query.value
  if (!params.ORDSEQ && !params.CLSEQ) {
    throw new Error('查询参数不能为空！')
  }

  const SQLParams = {
    'B.CLSEQ': params.CLSEQ
  }

  return SQLParams
}

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const remoteSql = remoteSqlMap['第二层颜色下各色号的用量信息']

    const materialList = await searchList<any[]>({
      sql: formatString(remoteSql.DBQUERY, query.value.ORDSEQ),
      params: generateSQLParams(),
      sortby: remoteSql.SORTBYCONTENT
    })

    mainTableDataManager.update(materialList)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

defineExpose({
  updateQueryParams(fun: (item: typeof query) => void) {
    fun(query)
    loadData()
    // const list = colorDTLListData.filter(
    //   (item) => item.A == query.value.ORDSEQ && item.B == query.value.CLSEQ
    // )
    //
    // console.log(list)
    // mainTableData.value = JSON.parse(JSON.stringify(list))
  }
})
</script>
