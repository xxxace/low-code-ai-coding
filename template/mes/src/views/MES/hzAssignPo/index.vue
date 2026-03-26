<template>
  <div
    class="view-container w-full h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
    v-loading="confirmLoading"
  >
    <h3 class="mt-0 mb-1">后整分配PO排产工厂确认</h3>
    <AceFieldset legend="查询" class="overflow-hidden min-w-[900px]">
      <FieldItemGroup :disabled="loading">
        <div>
          <FieldItem :label="t('lbORIGIN', '工业区')" :width="46">
            <RemoteSelect
              ref="originSelectRef"
              class="w-[120px]!"
              v-model="query.ORIGIN"
              :data-loader="fetchIndustrialZoneOptions"
              default-first
              :disabled="loading"
            />
          </FieldItem>
          <FieldItem :label="t('lbYRWEEK', '排产年月')" :width="56">
            <el-date-picker
              class="w-[120px]!"
              v-model="query.YRWEEK"
              type="month"
              format="YYYYMM"
              value-format="YYYYMM"
              :editable="false"
              :clearable="false"
            />
          </FieldItem>

          <FieldItem :label="t('lbPSTY', '排产类型')" :width="56">
            <RemoteSelect
              ref="pstySelectRef"
              class="w-[120px]!"
              v-model="query.PSTY"
              value-key="TMPLNO"
              :data-loader="fetchSchedualingTypeOptions"
              default-first
              :disabled="loading"
            />
          </FieldItem>

          <FieldItem :label="t('lbCAPACITY', '产能')" :width="28">
            <el-switch
              v-model="query.CAPACITY"
              inline-prompt
              active-value="0"
              inactive-value="1"
              active-text="无限产能"
              inactive-text="有限产能"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              :disabled="loading"
            />
          </FieldItem>

          <FieldItem :width="0">
            <el-button type="primary" size="small" :loading="loading" @click="loadData"
              >{{ c('查询', 'common.search') }}
            </el-button>
            <el-button size="small" :loading="loading" @click="handleRest"
              >{{ c('重置', 'common.reset') }}
            </el-button>
          </FieldItem>
        </div>

        <div class="mt-1">
          <FieldItem :label="t('lbORDNO', '批号')" :width="46">
            <UppercaseInput
              class="w-[120px]!"
              v-model="query.ORDNO"
              :clearable="true"
              spellcheck="false"
            />
          </FieldItem>

          <FieldItem :label="t('lbCLNTFTYNO', '承制工厂')" :width="56">
            <RemoteSelect
              class="w-[314px]!"
              v-model="query.CLNTFTYNO"
              label-key="FTYNAME"
              value-key="FTYNO"
              :data-loader="fetchFactoryOptions"
              :disabled="loading"
            />
          </FieldItem>
        </div>
      </FieldItemGroup>
    </AceFieldset>

    <div class="flex-1 flex flex-col" v-ace-loading="loading">
      <div class="flex-[0.5] flex gap-1">
        <AceFieldset class="flex-1" legend="任务清单">
          <BatchnoInfoTable
            :data="dataList"
            :loading="loading"
            @currentRowChange="handleBatchnoInfoCurrentRowChange"
          />
        </AceFieldset>

        <AceFieldset class="flex-[0.4]" legend="生产排期工厂">
          <FactoryTable :data="schedualingList" :loading="loading" />
        </AceFieldset>
      </div>
      <div class="flex-1 flex gap-1">
        <AceFieldset class="flex-1" legend="工厂排产">
          <template #legend>
            <div class="flex gap-2">
              <el-segmented v-model="currentTab" :options="['前整', '缝挑', '后整']" size="small" />
            </div>
          </template>
          <div class="h-full flex flex-col">
            <PreProcessingTable
              v-if="currentTab === '前整'"
              class="flex-1"
              :data="preProcessingList"
              :loading="loading"
            />
            <LinkingAndHandStitchingTable
              v-else-if="currentTab === '缝挑'"
              class="flex-1"
              :data="lahsList"
              :loading="loading"
            />
            <PostProcessingTable
              v-show="currentTab === '后整'"
              ref="postProcessingTableRef"
              class="flex-1"
              :data="postProcessingList"
              :loading="loading"
              @confirm="handleHzConfirm"
            />
          </div>
        </AceFieldset>
        <AceFieldset class="flex-[0.4]" legend="工序">
          <JobTable class="h-full" :data="jobList" :loading="loading" />
        </AceFieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useParamsRefManager, useArrayRefManager } from '@/hooks/nameson/useRefManager'
import dayjs from 'dayjs'
import BatchnoInfoTable from './components/BatchnoInfoTable.vue'
import FactoryTable from './components/FactoryTable.vue'
import JobTable from './components/JobTable.vue'
import PreProcessingTable from './components/PreProcessingTable.vue'
import LinkingAndHandStitchingTable from './components/LinkingAndHandStitchingTable.vue'
import PostProcessingTable from './components/PostProcessingTable.vue'
import RemoteSelect from '@/components/RemoteSelectV2/index.vue'
import {
  fetchFactoryOptions,
  fetchHzTaskList,
  fetchIndustrialZoneOptions,
  fetchSchedualingTypeOptions,
  fetchTaskSchedualingList,
  fetchTaskSchedualingJobList,
  fetchTaskSchedualingDetailList,
  type HzTaskVO,
  type TaskSchedualingVO,
  type TaskSchedualingJobVO,
  type PreProcessingVO,
  type LinkingAndHandStitchingVO,
  type PostProcessingVO
} from './api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { confirmTask } from './crud'

const { t, c } = useI18nProxy('VUE_MES_POFTY')
const loading = ref(false)
const confirmLoading = ref(false)

const originSelectRef = ref<InstanceType<typeof RemoteSelect>>()
const pstySelectRef = ref<InstanceType<typeof RemoteSelect>>()
const postProcessingTableRef = ref<InstanceType<typeof PostProcessingTable>>()
const currentTab = ref('后整')

const [query, queryManager] = useParamsRefManager(() => {
  return {
    ORIGIN: '',
    PSTY: '',
    // PSTY: 'DPS',
    ORDNO: '',
    // ORDNO: 'WV25073060',
    CLNTFTYNO: '',
    YRWEEK: dayjs().format('YYYYMM'),
    // YRWEEK: '202510',
    CAPACITY: '0'
  }
})
const pstyComputed = computed(() => {
  const PSTY = query.value.PSTY
  return PSTY === 'MPS' ? PSTY + query.value.CAPACITY : PSTY
})
const [dataList, dataListManager] = useArrayRefManager<HzTaskVO>([])
const [schedualingList, schedualingListManager] = useArrayRefManager<TaskSchedualingVO>([])
const [jobList, jobListManager] = useArrayRefManager<TaskSchedualingJobVO>([])
const [preProcessingList, preProcessingListManager] = useArrayRefManager<PreProcessingVO>([])
const [lahsList, lahsListManager] = useArrayRefManager<LinkingAndHandStitchingVO>([])
const [postProcessingList, postProcessingListManager] = useArrayRefManager<PostProcessingVO>([])
postProcessingListManager.setRef(postProcessingTableRef)

const handleHzConfirm = () => {
  if (postProcessingList.value.length === 0) {
    ElMessageBox.alert('暂无任务可以确认！')
    return
  }

  ElMessageBox.confirm('是否确认当前的后整任务？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    uploadConfirm()
  })
}

const uploadConfirm = async () => {
  confirmLoading.value = true
  try {
    const records = postProcessingListManager.records
    records.forEach((r) => {
      if (r.ISMODIFY === 'N') {
        r.ISMODIFY = 'Y'
      }
    })
    const res = await confirmTask({
      data: records,
      oldData: postProcessingListManager.old!
    })

    if (res?.statusCode === '1') {
      ElMessage.success('确认任务成功！')
      setTimeout(() => {
        loadData()
      }, 800)
    } else {
      ElMessageBox.alert(`确认任务失败: ${res?.message || '未知错误'}`)
    }
  } catch (e: any) {
    ElMessageBox.alert(`确认任务错误：${e.message || JSON.stringify(e)}`)
  }
  confirmLoading.value = false
}

const loadData = async () => {
  loading.value = true
  try {
    await loadHzTaskList()
  } catch (e: any) {
    loading.value = false
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}

const handleBatchnoInfoCurrentRowChange = async (row: HzTaskVO) => {
  if (!row.ORDSEQ) {
    schedualingListManager.update([])
    jobListManager.update([])
    preProcessingListManager.update([])
    lahsListManager.update([])
    postProcessingListManager.update([])
  } else {
    loading.value = true
    try {
      await loadSchedualingList(row.ORDSEQ)
      await loadJobList(row.ORDSEQ, query.value.PSTY, row.YRWEEK, row.ORIGIN)
      await loadTaskSchedualingDetailList(row.ORDSEQ, query.value.PSTY, row.YRWEEK, row.ORIGIN)
    } catch (e: any) {
      ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
    }
  }

  loading.value = false
}

const handleRest = () => {
  queryManager.reset()
}

const loadHzTaskList = async () => {
  const params = query.value
  try {
    const list = await fetchHzTaskList({
      'A.ORIGIN': params.ORIGIN,
      'A.PSTY': pstyComputed.value,
      'D.ORDNO': params.ORDNO,
      'A.CLNTFTYNO': params.CLNTFTYNO,
      'A.YRWEEK': params.YRWEEK
    })

    dataListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}

const loadSchedualingList = async (ORDSEQ: number) => {
  try {
    const list = await fetchTaskSchedualingList({
      'A.ORDSEQ': ORDSEQ
    })

    schedualingListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}

const loadJobList = async (ORDSEQ: number, PSTY: string, YRWEEK: string, ORIGIN: string) => {
  try {
    const list = await fetchTaskSchedualingJobList({
      $$SQL: `EXISTS (SELECT PSSEQ,TSKSEQ FROM PSTASKORD WHERE ORDSEQ = '${ORDSEQ}' AND B.PSSEQ = PSSEQ AND B.TSKSEQ = TSKSEQ)`,
      'A.PSTY': PSTY,
      'A.YRWEEK': YRWEEK,
      'A.ORIGIN': ORIGIN
    })

    jobListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}

const loadTaskSchedualingDetailList = async (
  ORDSEQ: number,
  PSTY: string,
  YRWEEK: string,
  ORIGIN: string
) => {
  try {
    const list = await fetchTaskSchedualingDetailList({
      'D.ORDSEQ': ORDSEQ,
      'A.PSTY': PSTY,
      'A.YRWEEK': YRWEEK,
      'A.ORIGIN': ORIGIN
    })

    preProcessingListManager.update(
      list
        .filter((item) => item.FTYTY === 'FF')
        .map((item) => ({
          BILLNO: item.BILLNO,
          FTYNO: item.FTYNO,
          FTYNAME: item.FTYNAME,
          KNIT_DATE: item.KNIT_DATE,
          KNITEND_DATE: item.KNITEND_DATE,
          QTY: item.QTY
        }))
    )
    lahsListManager.update(
      list
        .filter((item) => item.FTYTY === 'TF')
        .map((item) => ({
          BILLNO: item.BILLNO,
          FTYNO: item.FTYNO,
          FTYNAME: item.FTYNAME,
          SEW_DATE: item.SEW_DATE,
          SEWEND_DATE: item.SEWEND_DATE,
          QTY: item.QTY
        }))
    )
    postProcessingListManager.update(
      list
        .filter((item) => item.FTYTY === 'BF')
        .map((item) => ({
          PSSEQ: item.PSSEQ,
          TSKSEQ: item.TSKSEQ,
          BILLNO: item.BILLNO,
          FTYNO: item.FTYNO,
          FTYNAME: item.FTYNAME,
          QTY: item.QTY,
          ISMODIFY: item.ISMODIFY,
          ADDUSER: item.ADDUSER,
          ADDDTTM: item.ADDDTTM,
          UPDUSER: item.UPDUSER,
          UPDDTTM: item.UPDDTTM
        }))
    )
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}

onMounted(async () => {
  loading.value = true
  await originSelectRef.value?.load()
  await pstySelectRef.value?.load()
  loading.value = false
  loadData()
})
</script>
