<template>
  <div class="flex flex-col p-1 overflow-hidden box-border">
    <AceFieldset :legend="c('查询', 'common.query')">
      <div>
        <FieldItem :label="t('lbBOOKER', '批号')" :width="56">
          <UppercaseInput
            class="w-[160px]!"
            v-model="query.ORDNO"
            :disabled="ordnoLoading || colorLoading"
            @change="handleORDNOChanged"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '颜色')" :width="28">
          <vxe-select
            class="!w-[244px]"
            v-model="query.CLSEQ"
            placeholder=" "
            size="mini"
            :loading="loading || colorLoading"
            :disabled="!query.ORDNO"
            @change="resetContractNoRelated"
          >
            <vxe-option
              v-for="opt in colorOptions"
              :key="opt.CLSEQ"
              :value="opt.CLSEQ"
              :label="opt.CLNAME"
            />
          </vxe-select>
        </FieldItem>
        <FieldItem :label="t('lbBLTIME', '加工合约')" :width="56">
          <vxe-select
            class="w-[164px]!"
            v-model="query.PMNO"
            placeholder=" "
            size="mini"
            :loading="loading || colorLoading"
            :disabled="!query.ORDNO"
            @change="loadCommonInfo"
          >
            <vxe-option
              v-for="(opt, i) in contractNoOptions"
              :key="i"
              :value="opt.PMNO"
              :label="opt.PMNO"
            />
          </vxe-select>
        </FieldItem>

        <FieldItem :width="0">
          <el-button
            type="primary"
            size="small"
            :loading="loading || ordnoLoading"
            @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>

      <div class="mt-1">
        <FieldItem :label="t('lbBOOKER', '工序')" :width="56">
          <OptionInput
            :label-width="60"
            :value-width="100"
            value-key="JOBNO"
            label-key="JOBNAME"
            v-model="query.JOBNO"
            v-model:labelValue="query.JOBNAME"
            :sql="
              formatString(
                remoteSqlMap['工序清单的查询语句'].DBQUERY,
                query.ORDNO,
                query.CLSEQ,
                query.PMNO
              )
            "
            autoLoad
            closeReset
            :dialog-compoent="JobDialog"
            @enter="loadJobItem"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '牌号范围')" :width="56">
          <div class="w-[100px]!">
            <span>{{ query.MIN_P }}</span>
            <span class="inline-block mx-2">~</span>
            <span>{{ query.MAX_P }}</span>
          </div>
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '牌号')" :width="62">
          <el-input class="w-[77px]!" type="number" v-model="query.TKTSEQ.min" />
          <span>~</span>
          <el-input class="w-[77px]!" type="number" v-model="query.TKTSEQ.max" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '件号范围')" :width="56">
          <div class="w-[100px]!">
            <span>{{ query.MIN_J }}</span>
            <span class="inline-block mx-2">~</span>
            <span>{{ query.MAX_J }}</span>
          </div>
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '件号')" :width="56">
          <el-input class="w-[77px]!" type="number" v-model="query.LABSEQ.min" />
          <span>~</span>
          <el-input class="w-[77px]!" type="number" v-model="query.LABSEQ.max" />
        </FieldItem>
      </div>
    </AceFieldset>
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
import { ref, onMounted, nextTick } from 'vue'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import DetailTable from './detailTable.vue'
import dayjs from 'dayjs'
import { useFetchSqlEffect } from '@/hooks/nameson/useFetchSql'
import { searchList, searchObject } from '@/api/nameson'
import { ElMessageBox } from 'element-plus'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { formatString } from '@/utils'
import type { RFIDItemVO } from '$types/views/MES/orderTrac'
import JobDialog from './components/JobDialog/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'
import { useParentScope } from '@/hooks/nameson/useParentScope'

defineOptions({
  objectName: 'VUE_MES_ORDSCH'
})

const [remoteSqlMap, remoteSqlMapLoader] = useFetchSqlEffect({ objectName: 'VUE_MES_ORDSCH' })

const parentScope = useParentScope('orderTrace')

const { t, c } = useI18nProxy('VUE_MES_ORDSCH')

const loading = ref(false)

export type ColorOptions = {
  CLSEQ: number
  CLNAME: string
}

export type ContractNoOptions = {
  PMNO: string
}

export type CommonInfo = {
  MIN_TKTSEQ: number
  MAX_TKTSEQ: number
  MIN_LABSEQ: number
  MAX_LABSEQ: number
}

const colorOptions = ref<ColorOptions[]>([])
const contractNoOptions = ref<ContractNoOptions[]>([])
const [query, queryManager] = useParamsRefManager(() => {
  return {
    ORDSEQ: 0,
    CLSEQ: 0,
    PMSEQ: 0,
    ORDNO: '',
    PMNO: '',
    JOBNO: '',
    JOBNAME: '',
    MIN_P: 0,
    MAX_P: 0,
    MIN_J: 0,
    MAX_J: 0,
    BLTIME: {
      start: dayjs().format('YYYY-MM-DD'),
      end: dayjs().format('YYYY-MM-DD')
    },
    TKTSEQ: {
      min: '',
      max: ''
    },
    LABSEQ: {
      min: '',
      max: ''
    }
  }
})

const [mainTableData, mainTableDataManager] = useArrayRefManager<any>([])

queryManager.init()

const handleORDNOChanged = async () => {
  if (!(await checkORDNOValid(query.value.ORDNO))) {
    ElMessageBox.alert(`批号 ${query.value.ORDNO} 不存在,请确认。`)
    return
  }
  await loadColorOptions()
  await nextTick()
  if (
    !colorOptions.value.length ||
    !colorOptions.value.some((color) => color.CLSEQ === query.value.CLSEQ)
  ) {
    query.value.CLSEQ = undefined as any
  }

  await resetContractNoRelated()
}

const resetContractNoRelated = async () => {
  await loadContractNoOptions()
  await nextTick()
  if (
    !contractNoOptions.value.length ||
    !contractNoOptions.value.some((contract) => contract.PMNO === query.value.PMNO)
  ) {
    query.value.PMNO = ''
    query.value.MIN_P = 0
    query.value.MAX_P = 0
    query.value.MIN_J = 0
    query.value.MAX_J = 0
  } else {
    await loadCommonInfo()
  }
}

const ordnoLoading = ref(false)
const checkORDNOValid = async (ORDNO: string) => {
  ordnoLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['批号是否存在的查询语句']
    const list = await searchList<any[]>({
      sql: formatString(remoteSql.DBQUERY, ORDNO),
      sortby: remoteSql.SORTBYCONTENT
    })

    return list && list.length > 0 ? true : false
  } catch (e: any) {
    ElMessageBox.alert(`校验批号错误：${e.message || JSON.stringify(e)}`)
  } finally {
    ordnoLoading.value = false
  }
}

const colorLoading = ref(false)
const loadColorOptions = async () => {
  colorLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['批号颜色的查询语句']
    const options = await searchList<ColorOptions[]>({
      sql: formatString(remoteSql.DBQUERY, query.value.ORDNO || 'null'),
      sortby: remoteSql.SORTBYCONTENT
    })

    colorOptions.value = options
  } catch (e: any) {
    ElMessageBox.alert(`查询颜色数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    colorLoading.value = false
  }
}

const loadContractNoOptions = async () => {
  colorLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['合约清单的查询语句']
    const options = await searchList<ContractNoOptions[]>({
      sql: formatString(
        remoteSql.DBQUERY,
        query.value.ORDNO || 'null',
        query.value.CLSEQ || 'null'
      ),
      sortby: remoteSql.SORTBYCONTENT
    })
    console.log(options)
    contractNoOptions.value = options
  } catch (e: any) {
    ElMessageBox.alert(`查询颜色数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    colorLoading.value = false
  }
}

const jobLoading = ref(false)
const loadJobItem = async () => {
  if (jobLoading.value) return
  jobLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['工序清单的查询语句']
    const options = await searchObject<{ JOBNO: string; JOBNAME: string }>({
      sql: formatString(
        remoteSql.DBQUERY,
        query.value.ORDNO || 'null',
        query.value.CLSEQ || 'null'
      ),
      params: {
        'PJ.JOBNO': query.value.JOBNO
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    const item = (options || {}) as { JOBNO: string; JOBNAME: string }
    query.value.JOBNO = item.JOBNO
    query.value.JOBNAME = item.JOBNAME
    await loadCommonInfo()
  } catch (e: any) {
    ElMessageBox.alert(`查询颜色数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    jobLoading.value = false
  }
}

const loadCommonInfo = async () => {
  colorLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['牌号范围\\件号范围的查询语句']
    const options = await searchObject<CommonInfo>({
      sql: formatString(
        remoteSql.DBQUERY,
        query.value.ORDNO || 'null',
        query.value.CLSEQ || 'null',
        query.value.PMNO || 'null'
      ),
      params: {},
      sortby: remoteSql.SORTBYCONTENT
    })
    const item = (options || {}) as CommonInfo
    query.value.MIN_P = item.MIN_TKTSEQ
    query.value.MAX_P = item.MAX_TKTSEQ
    query.value.MIN_J = item.MIN_LABSEQ
    query.value.MAX_J = item.MAX_LABSEQ
  } catch (e: any) {
    ElMessageBox.alert(`查询颜色数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    colorLoading.value = false
  }
}

const generateSQLParams = () => {
  const params = query.value
  if (!params.ORDNO && !params.PMNO) {
    throw new Error('批号或加工合约不能都为空！')
  }

  if (!params.JOBNO) {
    throw new Error('工序不能为空！')
  }

  // if (!params.TKTSEQ.min && !params.TKTSEQ.max && !params.LABSEQ.min && !params.LABSEQ.max) {
  //   throw new Error('件号范围或牌号范围不能都为空！')
  // }

  const SQLParams = {
    'B.TKTSEQ__gte': params.TKTSEQ.min,
    'B.TKTSEQ__lte': params.TKTSEQ.max,
    'B.LABSEQ__gte': params.LABSEQ.min,
    'B.LABSEQ__lte': params.LABSEQ.max,
    'B.JOBNO': params.JOBNO,
    'PC.REFCLSEQ': params.CLSEQ,
    'A.PMSEQ': params.PMSEQ
  }

  return SQLParams
}

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const remoteSql = remoteSqlMap.value['第五层合约工序下的收发明细记录']

    const materialList = await searchList<RFIDItemVO[]>({
      sql: formatString(remoteSql.DBQUERY, query.value.ORDSEQ),
      params: generateSQLParams(),
      sortby: remoteSql.SORTBYCONTENT
    })

    mainTableDataManager.update(materialList)
    parentScope.emit('searchList:loadData', query.value)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await remoteSqlMapLoader()
})

defineExpose({
  updateQueryParams: async (fun: (item: typeof query) => void) => {
    fun(query)
    query.value.TKTSEQ = { min: '', max: '' }
    query.value.LABSEQ = { min: '', max: '' }
    mainTableDataManager.update([])
    handleORDNOChanged()
    await loadData()
    // const list = detailsListData.filter(
    //   (item) =>
    //     item.A == query.value.ORDSEQ &&
    //     item.B == query.value.CLSEQ &&
    //     item.C == query.value.PMSEQ &&
    //     item.G == query.value.JOBNO
    // )
    //
    // const temp = JSON.parse(JSON.stringify(list))
    // temp.forEach((item) => {
    //   item.JOBNAME = query.value.JOBNAME
    // })
    // mainTableDataManager.update(temp)
  }
})
</script>

<style>
.el-input.is-disabled .el-input__inner {
  color: var(--el-input-text-color);
  -webkit-text-fill-color: var(--el-input-text-color);
  cursor: not-allowed;
}
</style>
