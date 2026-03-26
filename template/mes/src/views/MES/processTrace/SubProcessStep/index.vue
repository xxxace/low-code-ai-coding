<template>
  <div class="!min-w-[800px] relative h-full flex flex-col">
    <AceFieldset class="m-0" :legend="c('查询', 'common.query')">
      <div>
        <FieldItem :label="t('lbBOOKER', '主工序')" :width="42">
          <OptionInput
            :label-width="80"
            :value-width="100"
            value-key="JOBNO"
            v-model="query.MAINJOBNO"
            v-model:labelValue="query.MAINJOBNAME"
            autoLoad
            closeReset
            :dialog-compoent="JobDialog"
            @enter="loadJobItem"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '工厂')" :width="56">
          <OptionInput
            :label-width="80"
            :value-width="140"
            v-model="query.FTYNO"
            v-model:labelValue="query.FTYNAME"
            autoLoad
            closeReset
            :dialog-compoent="FactoryDialog"
            @enter="loadFactoryItem"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '产线')" :width="28">
          <UppercaseInput class="w-[160px]!" v-model="query.WCNAME" />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>

      <div class="mt-1">
        <FieldItem :label="t('lbBOOKER', '批号')" :width="42">
          <UppercaseInput class="w-[180px]!" v-model="query.ORDNO" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '加工合约')" :width="56">
          <UppercaseInput class="w-[220px]!" v-model="query.ORDNO" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '加工合约日期')" :width="84">
          <date-range-picker
            class="w-[210px]"
            v-model:start="query.PMDT.start"
            v-model:end="query.PMDT.end"
          />
        </FieldItem>
      </div>
    </AceFieldset>

    <div class="flex-1 flex">
      <AceFieldset class="m-0 w-[180px]!">
        <template #legend>
          <div class="flex gap-2">
            <span>子工序流程图({{ subProcessList.length }})</span>
            <div class="status-indicator">
              <i class="shape green"></i>
              <span>生产进度</span>
            </div>
          </div>
        </template>
        <div class="flex flex-row relative h-full">
          <div class="flow-cards absolute left-0 top-0" v-loading="loading">
            <template v-if="subProcessList.length">
              <template v-for="(step, idx) in subProcessList" :key="idx">
                <ProcessStep
                  :class="['mb-1', { active: query.JOBNO2 === step.JOBNO1 }]"
                  :step="step"
                  @click="() => handlePrcessStepClick(step)"
                />
                <div v-if="idx < subProcessList.length - 1" class="arrow"></div>
              </template>
            </template>
            <el-empty v-else class="w-full h-[164px]" :image-size="84" description="暂无数据" />
          </div>
        </div>
      </AceFieldset>
      <AceFieldset :legend="`在制品追踪(${subProcessEntryList.length})`" class="flex-1 m-0">
        <DetailTable
          class="flex-1"
          :loading="loading || entryLoading"
          :data="subProcessEntryList"
        />
      </AceFieldset>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import DetailTable from './detailTable.vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import ProcessStep from './processStep/index.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { useArrayRefManager } from '@/hooks/nameson/useRefManager'
import { searchList, searchObject } from '@/api/nameson'
import type { RFIDItemVO } from '$types/views/MES/orderTrac'
import { formatString } from '@/utils'
import { ElMessageBox } from 'element-plus'
import JobDialog from '../components/JobDialog/index.vue'
import FactoryDialog from '../components/FactoryDialog/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import { JobEntryItemVO } from '$types/views/MES/jobTrace'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'

const { t, c } = useI18nProxy('VUE_MES_JOBSCH')
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_JOBSCH' })

const query = ref({
  MAINJOBNO: '',
  MAINJOBNAME: '',
  JOBNO: '',
  JOBNO2: '',
  JOBNAME: '',
  FTYNO: '',
  FTYNAME: '',
  ORDNO: '',
  PMNO: '',
  WCNAME: '',
  PMDT: {
    start: '2025-03-11',
    end: '2025-03-13'
  }
})

const loading = ref(false)
const entryLoading = ref(false)
const [subProcessList, subProcessListManager] = useArrayRefManager<any>([])
const [subProcessEntryList, subProcessEntryListManager] = useArrayRefManager<any>([])

const load = async (item: any, mainQuery: any) => {
  query.value.MAINJOBNO = item.JOBNO
  query.value.MAINJOBNAME = item.CNAME
  query.value.ORDNO = mainQuery.ORDNO
  query.value.PMNO = mainQuery.PMNO
  query.value.FTYNO = mainQuery.FTYNO
  query.value.FTYNAME = mainQuery.FTYNAME
  query.value.WCNAME = mainQuery.WCNAME
  query.value.PMDT.start = mainQuery.PMDT.start
  query.value.PMDT.end = mainQuery.PMDT.end
  await loadData()
}

const loadData = async () => {
  if (!query.value.MAINJOBNO) {
    ElMessageBox.alert(`主工序不能为空！`)
    return
  }
  query.value.JOBNO2 = ''
  await loadStepList()
  await loadEntryList()
}

const jobLoading = ref(false)
const loadJobItem = async () => {
  if (jobLoading.value) return
  jobLoading.value = true
  try {
    const remoteSql = remoteSqlMap['工序清单的查询语句']
    const options = await searchObject<{ JOBNO: string; CNAME: string }>({
      sql: remoteSql.DBQUERY,
      params: {
        'A.JOBNO': query.value.MAINJOBNO
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    const item = (options || {}) as { JOBNO: string; CNAME: string }
    query.value.MAINJOBNO = item.JOBNO
    query.value.MAINJOBNAME = item.CNAME
  } catch (e: any) {
    ElMessageBox.alert(`查询工序数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    jobLoading.value = false
  }
}

const factoryLoading = ref(false)
const loadFactoryItem = async () => {
  if (factoryLoading.value) return
  factoryLoading.value = true
  try {
    const remoteSql = remoteSqlMap['工厂清单的查询语句']
    const options = await searchObject<{ CODE: string; CNAME: string }>({
      sql: remoteSql.DBQUERY,
      params: {
        'A.CODE': query.value.FTYNO
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    const item = (options || {}) as { CODE: string; CNAME: string }
    query.value.FTYNO = item.CODE
    query.value.FTYNAME = item.CNAME
  } catch (e: any) {
    ElMessageBox.alert(`查询工厂数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    factoryLoading.value = false
  }
}

const loadStepList = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const remoteSql = remoteSqlMap['生产工序流程图信息(双击主工序出来的子工序的汇总信息)']
    const params = query.value
    const list = await searchList<RFIDItemVO[]>({
      sql: formatString(
        remoteSql.DBQUERY,
        params.FTYNO,
        params.ORDNO,
        params.PMNO,
        params.PMDT.start,
        params.PMDT.end || params.PMDT.start,
        params.MAINJOBNO,
        params.MAINJOBNO,
        params.JOBNO2
      ),
      sortby: remoteSql.SORTBYCONTENT
    })

    if (list.length > 0) {
      query.value.JOBNO2 = list[0].JOBNO1
    }

    subProcessListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

const loadEntryList = async () => {
  if (entryLoading.value) return
  entryLoading.value = true
  try {
    const remoteSql = remoteSqlMap['追踪明细信息(双击主工序出来的子工序界面的追踪明细信息)']
    const params = query.value
    const list = await searchList<JobEntryItemVO[]>({
      sql: formatString(
        remoteSql.DBQUERY,
        params.FTYNO,
        params.ORDNO,
        params.PMNO,
        params.PMDT.start,
        params.PMDT.end || params.PMDT.start,
        params.MAINJOBNO,
        params.MAINJOBNO,
        params.JOBNO2
      ),
      sortby: remoteSql.SORTBYCONTENT
    })

    subProcessEntryListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    entryLoading.value = false
  }
}

const timer = ref()
const handlePrcessStepClick = (step: any) => {
  if (entryLoading.value) return
  clearTimeout(timer.value)
  timer.value = setTimeout(() => {
    if (query.value.JOBNO2 === step.JOBNO1) {
      if (subProcessList.value.length === 1) return
      query.value.JOBNO2 = ''
    } else {
      query.value.JOBNO2 = step.JOBNO1
    }

    loadEntryList()
  }, 250)
}

defineExpose({ load })
</script>

<style lang="scss" scoped>
.flow-cards {
  //display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  width: 100%;
  //min-height: 180px;
  height: 100%;
  padding: 4px 4px 0;
  box-sizing: border-box;
}

.arrow {
  font-size: 2rem;
  color: #bbb;
  margin: 0 4px;
}

.active {
  border: 2px solid #0d84ff;
  box-sizing: border-box;
  border-radius: 8px;
}
</style>
