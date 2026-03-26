<template>
  <div class="view-container h-full box-border relative overflow-hidden">
    <div>
      <div class="bg-white p-2 mb-2" style="border-radius: 8px">
        <h5 class="mt-0 mb-1">生产工序追溯系统</h5>
        <AceFieldset :legend="c('查询', 'common.query')">
          <div>
            <FieldItem :label="t('lbBOOKER', '工序')" :width="56">
              <OptionInput
                :label-width="60"
                :value-width="100"
                value-key="JOBNO"
                v-model="query.JOBNO"
                v-model:labelValue="query.JOBNAME"
                autoLoad
                closeReset
                :dialog-compoent="JobDialog"
                @enter="loadJobItem"
              />
            </FieldItem>
            <FieldItem :label="t('lbBOOKER', '工厂')" :width="28">
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
            <FieldItem :label="t('lbBOOKER', '批号')" :width="28">
              <UppercaseInput class="w-[160px]!" v-model="query.ORDNO" />
            </FieldItem>

            <FieldItem :width="0">
              <el-button type="primary" size="small" :loading="loading" @click="loadData"
                >{{ c('查询', 'common.query') }}
              </el-button>
            </FieldItem>
          </div>

          <div class="mt-1">
            <FieldItem :label="t('lbBOOKER', '加工合约')" :width="56">
              <UppercaseInput class="w-[160px]!" v-model="query.PMNO" />
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
      </div>
      <div class="summary-cards" v-loading="summaryLoading">
        <el-card class="summary-card" shadow="hover">
          <div>总件数量</div>
          <div class="summary-value">{{ toFixedPlus(summaryData.PM_QTY, 2) || 0 }}</div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div>完成数量</div>
          <div class="summary-value done">{{ toFixedPlus(summaryData.FINISHQTY, 2) || 0 }}</div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div>在产数量</div>
          <div class="summary-value doing">{{ toFixedPlus(summaryData.PRDQTY, 2) || 0 }}</div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div>生产效率%</div>
          <div class="summary-value purple">{{ toFixedPlus(summaryData.PRDRATE, 2) || 0 }}%</div>
        </el-card>
      </div>
    </div>

    <!--    <div class="process-flow">-->
    <!--      <h5 class="flex mt-1 mb-0 pl-[10px] gap-2">-->
    <!--        <span>生产工序流程图</span>-->

    <!--        <div class="status-indicator">-->
    <!--          <i class="shape green"></i>-->
    <!--          <span>生产进度</span>-->
    <!--        </div>-->

    <!--        <div class="status-indicator">-->
    <!--          <i class="shape blue"></i>-->
    <!--          <span>生产负荷</span>-->
    <!--        </div>-->
    <!--      </h5>-->
    <!--      <div class="flow-cards" v-loading="summaryLoading || loading">-->
    <!--        <template v-if="mainStepList.length">-->
    <!--          <template v-for="(step, idx) in mainStepList" :key="idx">-->
    <!--            <ProcessStep-->
    <!--              :class="[{ active: query.JOBNO2 === step.JOBNO }]"-->
    <!--              :step="step"-->
    <!--              @dblclick="() => handlePrcessStepDblclick(step)"-->
    <!--              @click="() => handlePrcessStepClick(step)"-->
    <!--            />-->
    <!--            <div v-if="idx < mainStepList.length - 1" class="arrow">—</div>-->
    <!--          </template>-->
    <!--        </template>-->
    <!--        <el-empty v-else class="w-full" description="暂无数据" />-->
    <!--      </div>-->
    <!--    </div>-->

    <div class="flex-1 relative">
      <div class="flex gap-3 absolute top-0 left-0 w-full h-full">
        <div class="process-flow">
          <div class="flex justify-between">
            <h5 class="flex mt-1 mb-0 pl-[10px] gap-2">
              <span>生产工序流程图({{ mainStepList.length }})</span>
            </h5>
            <div class="border-box pt-1 pr-2">
              <div class="status-indicator">
                <i class="shape green"></i>
                <span>生产进度</span>
              </div>

              <div class="status-indicator">
                <i class="shape blue"></i>
                <span>生产负荷</span>
              </div>
            </div>
          </div>
          <div class="flow-cards" v-loading="summaryLoading || loading">
            <template v-if="mainStepList.length">
              <template v-for="(step, idx) in mainStepList" :key="idx">
                <ProcessStep
                  :class="['mb-2', { active: query.JOBNO2 === step.JOBNO }]"
                  :step="step"
                  @dblclick="() => handlePrcessStepDblclick(step)"
                  @click="() => handlePrcessStepClick(step)"
                />
              </template>
            </template>
            <el-empty v-else class="w-full" description="暂无数据" />
          </div>
        </div>

        <div class="flex-1 bg-white mt-0 p-1" style="border-radius: 8px">
          <SearchList
            class="h-full"
            :loading="summaryLoading || loading || entryLoading"
            :data="mainStepEntryList"
          />
        </div>
      </div>
    </div>

    <ResizeModel ref="subProcessStepModalRef" width="88vw" height="80vh" title="子工序详情">
      <SubProcessStep ref="subProcessStepRef" />
    </ResizeModel>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ProcessStep from './ProcessStep/index.vue'
import SearchList from './searchList/index.vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import ResizeModel from '@/components/ResizeModal/index.vue'
import SubProcessStep from './SubProcessStep/index.vue'
import type { ResizeModalInstance } from '@/components/ResizeModal/types'
import { useFetchSqlEffect } from '@/hooks/nameson/useFetchSql'
import { searchList, searchObject } from '@/api/nameson'
import type { RFIDItemVO } from '$types/views/MES/orderTrac'
import { formatString, toFixedPlus } from '@/utils'
import { ElMessageBox } from 'element-plus'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import dayjs from 'dayjs'
import { JobEntryItemVO, JobSummaryVO } from '$types/views/MES/jobTrace'
import OptionInput from '@/components/OptionInput.vue'
import JobDialog from './components/JobDialog/index.vue'
import FactoryDialog from './components/FactoryDialog/index.vue'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'

defineOptions({
  objectName: 'VUE_MES_JOBSCH'
})

const [remoteSqlMap, remoteSqlMapLoader] = useFetchSqlEffect({ objectName: 'VUE_MES_JOBSCH' })

const { t, c } = useI18nProxy('VUE_MES_JOBSCH')

const subProcessStepModalRef = ref<ResizeModalInstance>()

const subProcessStepRef = ref<InstanceType<typeof SubProcessStep>>()

const loading = ref(false)
const summaryLoading = ref(false)
const entryLoading = ref(false)
const [query, queryManager] = useParamsRefManager(() => {
  return {
    CLSEQ: 0,
    PMSEQ: 0,
    JOBNO: '',
    JOBNO2: '',
    JOBNAME: '',
    FTYNO: '',
    FTYNAME: '',
    ORDNO: '',
    PMNO: '',
    WCNAME: '',
    PMDT: {
      start: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      end: dayjs().format('YYYY-MM-DD')
    }
  }
})

const summaryData = ref<Partial<JobSummaryVO>>({})
const [mainStepList, mainStepListManager] = useArrayRefManager<any>([])
const [mainStepEntryList, mainStepEntryListManager] = useArrayRefManager<any>([])

queryManager.init()

const generateSQLParams = () => {
  const params = query.value
  if (!params.PMDT.start || !params.PMDT.end) {
    if (!params.JOBNO && !params.FTYNO && !params.ORDNO && !params.PMNO) {
      throw new Error('加工合约日期不能为空！')
    }
  }

  const SQLParams = {
    'B.JOBNO': params.JOBNO,
    'PC.REFCLSEQ': params.CLSEQ,
    'A.PMSEQ': params.PMSEQ
  }

  return SQLParams
}

const jobLoading = ref(false)
const loadJobItem = async () => {
  if (jobLoading.value) return
  jobLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['工序清单的查询语句']
    const options = await searchObject<{ JOBNO: string; CNAME: string }>({
      sql: remoteSql.DBQUERY,
      params: {
        'A.JOBNO': query.value.JOBNO
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    const item = (options || {}) as { JOBNO: string; CNAME: string }
    query.value.JOBNO = item.JOBNO
    query.value.JOBNAME = item.CNAME
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
    const remoteSql = remoteSqlMap.value['工厂清单的查询语句']
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

const loadMainStepList = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const remoteSql = remoteSqlMap.value['生产工序流程图信息']
    const params = query.value
    const list = await searchList<RFIDItemVO[]>({
      sql: formatString(
        remoteSql.DBQUERY,
        params.FTYNO,
        params.ORDNO,
        params.PMNO,
        params.PMDT.start,
        params.PMDT.end || params.PMDT.start,
        params.JOBNO,
        params.JOBNO
      ),
      sortby: remoteSql.SORTBYCONTENT
    })

    if (list.length > 0) {
      query.value.JOBNO2 = list[0].JOBNO
    }
    mainStepListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

const loadSummaryData = async () => {
  if (summaryLoading.value) return
  summaryLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['汇总信息']
    const params = query.value
    const summary = await searchObject<JobSummaryVO>({
      sql: formatString(
        remoteSql.DBQUERY,
        params.FTYNO,
        params.ORDNO,
        params.PMNO,
        params.PMDT.start,
        params.PMDT.end || params.PMDT.start,
        params.JOBNO
      ),
      sortby: remoteSql.SORTBYCONTENT
    })

    summaryData.value = summary || {}
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  } finally {
    summaryLoading.value = false
  }
}

const loadData = async () => {
  query.value.JOBNO2 = ''
  try {
    const params = query.value
    if (!params.PMDT.start || !params.PMDT.end) {
      if (!params.JOBNO && !params.FTYNO && !params.ORDNO && !params.PMNO) {
        throw new Error('加工合约日期不能为空！')
      }
    }
    await loadSummaryData()
    await loadMainStepList()
    await loadEntryList()
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}

const loadEntryList = async () => {
  if (entryLoading.value) return
  entryLoading.value = true
  try {
    const remoteSql = remoteSqlMap.value['追踪明细信息']
    const params = query.value
    const list = await searchList<JobEntryItemVO[]>({
      sql: formatString(
        remoteSql.DBQUERY,
        params.FTYNO,
        params.ORDNO,
        params.PMNO,
        params.PMDT.start,
        params.PMDT.end || params.PMDT.start,
        params.JOBNO,
        params.JOBNO2
      ),
      sortby: remoteSql.SORTBYCONTENT
    })

    mainStepEntryListManager.update(list)
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
    if (query.value.JOBNO2 === step.JOBNO) {
      return
    } else {
      query.value.JOBNO2 = step.JOBNO
    }

    loadEntryList()
  }, 250)
}

const handlePrcessStepDblclick = (step: any) => {
  clearTimeout(timer.value)
  subProcessStepModalRef.value?.open()

  setTimeout(() => {
    subProcessStepRef.value?.load(step, query.value)
  }, 100)
}

onMounted(async () => {
  await remoteSqlMapLoader()
  // loadData()
})
</script>

<style scoped>
.process-trace {
  padding: 0px;
}

.summary-cards {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.summary-card {
  --el-card-padding: 10px;
  flex: 1;
  min-width: 180px;
  text-align: left;
  border-radius: 8px;
}

.summary-value {
  font-size: 1.6rem;
  font-weight: bold;
  margin-top: 0px;
}

.summary-value.done {
  color: var(--el-color-success);
}

.summary-value.doing {
  color: var(--el-color-primary);
}

.summary-value.purple {
  color: #8a63fa;
}

.process-flow {
  width: 250px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/**.flow-cards {
  display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  padding: 10px;
  min-height: 240px;
}**/

.flow-cards {
  flex: 1;
  height: 0px;
  overflow: auto;
  box-sizing: border-box;
  padding: 8px 4px 0;
}

.arrow {
  font-size: 2rem;
  color: #bbb;
  margin: 0 4px;
}
</style>

<style lang="scss">
.status-indicator {
  --shape-bg-color: #333333;
  font-size: 12px;
  font-weight: normal;

  display: flex;
  align-items: center;

  .shape {
    display: inline-block;
    box-sizing: border-box;
    border-radius: 2px;
    width: 14px;
    height: 14px;
    background: var(--shape-bg-color);
    margin-right: 4px;

    &.green {
      --shape-bg-color: var(--el-color-success);
    }

    &.blue {
      --shape-bg-color: var(--el-color-primary);
    }
  }
}

.active {
  border: 2px solid #0d84ff;
  box-sizing: border-box;
  border-radius: 8px;
}
</style>
