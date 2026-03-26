<template>
  <div class="flex flex-col p-1 overflow-hidden box-border">
    <div class="flex-1">
      <AceFieldset class="h-full">
        <template #legend>
          <div class="flex items-center">
            <span>在制品追踪({{ props.data.length }})</span>
          </div>
        </template>
        <DetailTable :loading="props.loading" :data="props.data" />
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
import { listData } from '../mock'

defineOptions({
  objectName: 'VUE_HOTEL_RESERVE'
})

const props = defineProps<{
  loading?: boolean
  data: any[]
}>()

const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_HOTEL_RESERVE' })

const { t, c } = useI18nProxy('VUE_HOTEL_RESERVE')

// const loading = ref(false)

const statusOptions = [
  {
    label: '预定',
    value: 0
  },
  {
    label: '取消',
    value: 1
  }
]

const [query, queryManager] = useParamsRefManager(() => {
  return {
    ORDNO: '',
    COLOR: '',
    SIZE: '',
    PMNO: '',
    JOBNO: '',
    JOBNAME: '',
    LINE: '',
    LABELNO: '',
    orderStatus: 0,
    BOOK_ID: '',
    PAYMETHOD: [],
    PERIODTIME: '',
    FULLNAME: '',
    FOLLOWER: '',
    BLTIME: {
      start: dayjs().format('YYYY-MM-DD'),
      end: dayjs().format('YYYY-MM-DD')
    },
    AREANO: '',
    ISNEWCUST: '',
    CUSTTYPE: '',
    BOOKER: '',
    BOOKDEPT: ''
  }
})

const [mainTableData, mainTableDataManager] = useArrayRefManager<any>([
  {
    A: '织片',
    B: 'VN_SH14',
    C: 'ORD-2024-123',
    D: '黑色',
    E: 'M',
    F: 'DF-24000376_DYE1',
    G: 100,
    H: '生产中',
    I: 100,
    J: 100,
    K: 100,
    L: 100,
    M: 100
  }
])

queryManager.init()
mainTableDataManager.init()
const generateSQLParams = () => {
  const params = query.value
  if (
    !params.PERIODTIME &&
    !params.FULLNAME &&
    !params.AREANO &&
    !params.FOLLOWER &&
    !params.BLTIME?.start &&
    !params.BLTIME?.end &&
    !params.ISNEWCUST &&
    !params.CUSTTYPE &&
    !params.BOOKER &&
    !params.BOOK_ID &&
    !params.BOOKDEPT
  ) {
    throw new Error('查询参数不能为空！')
  }

  let $$SQL = ``

  if (params.orderStatus === 0) {
    $$SQL += `A.STFG <> 'BL_C'`
  } else if (params.orderStatus === 1) {
    $$SQL += `A.STFG = 'BL_C'`
  }

  const SQLParams = {
    'A.PERIODTIME': params.PERIODTIME,
    'A.FULLNAME__like': params.FULLNAME,
    'A.AREANO': params.AREANO,
    'A.ISNEWCUST': params.ISNEWCUST,
    'A.CUSTTYPE': params.CUSTTYPE,
    'A.BOOK_ID__like': params.BOOK_ID,
    'A.BOOKER__like': params.BOOKER,
    'A.FOLLOWER__like': params.FOLLOWER,
    'A.BOOKDEPT__like': params.BOOKDEPT,
    'A.BLTIME__gte@date': params.BLTIME.start,
    'A.BLTIME__lte@date': params.BLTIME.end,
    $$SQL: $$SQL
  }

  if (params.PAYMETHOD.length > 0) {
    const statement = params.PAYMETHOD.map((item) => `REGEXP_LIKE(A.PAYMETHOD, '${item}')`).join(
      ' AND '
    )
    if (SQLParams.$$SQL) SQLParams.$$SQL += ' AND ' + statement
    else SQLParams.$$SQL = statement
  }

  return SQLParams
}

const loadData = async () => {
  loading.value = true
  try {
    const remoteSql = remoteSqlMap['餐饮预订的查询语句']

    const materialList = await searchList<any[]>({
      sql: formatString(remoteSql.DBQUERY, useUserStore().userInfo?.username),
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
  }
})
</script>
