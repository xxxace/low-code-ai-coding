<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <ProductionWeeklyStatistics
      ref="statisticsRef"
      class="overflow-hidden min-w-[1248px]"
      :loading="statisticsLoding"
    />
    <div>
      <AceFieldset legend="查询" class="overflow-hidden min-w-[1248px]">
        <FieldItemGroup :disabled="loading">
          <div>
            <FieldItem :label="t('lbFTYNO', '工厂')" :width="48">
              <OptionInput
                :label-width="80"
                :value-width="120"
                v-model="query.FTYNO"
                v-model:labelValue="query.FTYNAME"
                :dialog-compoent="FactoryDialog"
              />
            </FieldItem>

            <FieldItem :label="t('lbWCSEQ', '车间')" :width="56">
              <OptionInput
                :label-width="80"
                :value-width="120"
                value-key="WCSEQ"
                v-model="query.WCSEQ"
                v-model:labelValue="query.WCNAME"
                :dialog-compoent="WorkShopDialog"
              />
            </FieldItem>
            <FieldItem :label="t('lbJOBNO', '工序')" :width="28">
              <OptionInput
                :label-width="60"
                :value-width="100"
                v-model="query.JOBNO"
                v-model:labelValue="query.JOBNAME"
                :dialog-compoent="ProcessDialog"
              />
            </FieldItem>
            <FieldItem :label="t('lbTCODE', '线长/带班长')" :width="70">
              <RemoteSelect
                class="!w-[120px]"
                autoLoad
                transfer
                v-model="query.TCODE"
                :sql="remoteSqlMap['线长/带班长的查询语句'].DBQUERY"
                :orderby="remoteSqlMap['线长/带班长的查询语句'].SORTBYCONTENT"
              />
            </FieldItem>
            <FieldItem :label="t('lbBOOKER', '计划开工日期')" :width="84">
              <date-range-picker
                class="w-[210px]"
                v-model:start="query.WKDATE.start"
                v-model:end="query.WKDATE.end"
              />
            </FieldItem>

            <FieldItem :width="0">
              <el-button type="primary" size="small" :loading="loading" @click="loadData"
                >{{ c('查询', 'common.query') }}
              </el-button>
            </FieldItem>
          </div>
          <div class="my-1">
            <FieldItem :label="t('lbPSNO', '计划号')" :width="48">
              <el-input class="w-[200px]!" v-model="query.PSNO" />
            </FieldItem>
            <FieldItem :label="t('lbORDNO', '批号')" :width="56">
              <el-input class="w-[200px]!" v-model="query.ORDNO" />
            </FieldItem>
            <FieldItem :label="t('lbSTYNO', '款号')" :width="28">
              <el-input class="w-[160px]!" v-model="query.STYNO" />
            </FieldItem>
            <FieldItem :label="t('lbTSKNO', '合约号')" :width="70">
              <el-input class="w-[120px]!" v-model="query.TSKNO" />
            </FieldItem>
            <FieldItem :label="t('lbSTFG', '状态')" :width="84">
              <RemoteSelect
                class="!w-[120px]"
                autoLoad
                transfer
                v-model="query.STFG"
                :sql="remoteSqlMap['状态的查询语句'].DBQUERY"
                :orderby="remoteSqlMap['状态的查询语句'].SORTBYCONTENT"
              />
            </FieldItem>
            <!--            <FieldItem :label="t('lbBOOKER', '计划完工日期')" :width="84">-->
            <!--              <date-range-picker-->
            <!--                class="w-[210px]"-->
            <!--                v-model:start="query.PMDT.start"-->
            <!--                v-model:end="query.PMDT.end"-->
            <!--              />-->
            <!--            </FieldItem>-->
          </div>
        </FieldItemGroup>
      </AceFieldset>
    </div>
    <AceFieldset absolute class="flex-1 overflow-hidden">
      <template #legend>
        <div class="flex items-center mb-1">
          <span>{{ t('ttTaskDetail', '任务详情') }}</span>

          <div class="ml-4 flex items-center gap-4">
            <div class="cursor-pointer flex items-center gap-1" @click="handleChangeStatus">
              <Icon icon="vi-ep:stamp" />
              <span>{{ t('btnConfirm', '确认') }}</span>
            </div>
            <div class="cursor-pointer flex items-center gap-1" @click="handleEditTask">
              <Icon icon="vi-ep:edit" />
              <span>{{ t('btnEdit', '编辑') }}</span>
            </div>
            <!--            <div class="cursor-pointer flex items-center gap-1">-->
            <!--              <Icon icon="vi-ep:document-checked" />-->
            <!--              <span>保存</span>-->
            <!--            </div>-->
            <div class="cursor-pointer flex items-center gap-1" @click="handleInsertTask">
              <Icon icon="vi-ep:document-add" />
              <span>{{ t('btnInsert', '插单') }}</span>
            </div>
            <div class="cursor-pointer flex items-center gap-1" @click="() => openStopWorkForm()">
              <Icon icon="vi-ep:warn-triangle-filled" />
              <span>{{ t('btnWaitMaterial', '待料停工') }}</span>
            </div>
            <div class="cursor-pointer flex items-center gap-1" @click="handleStopWork">
              <Icon icon="vi-ep:warn-triangle-filled" />
              <span>{{ t('btnWaitMaterial', '停工') }}</span>
            </div>
          </div>
        </div>
      </template>
      <TaskTable
        ref="TaskTableRef"
        :data="taskList"
        :loading="loading"
        @currentRowChange="handleTaskTableRowChange"
      />
    </AceFieldset>
    <div class="flex flex-1 gap-1">
      <AceFieldset
        :legend="t('lgColorGroup', '颜色组')"
        absolute
        class="flex-[1.4] overflow-hidden"
      >
        <ColorGroupTable
          :loading="loading || colorGroupLoading"
          :data="colorGroupList"
          @currentRowChange="handleColorGroupRowChange"
        />
      </AceFieldset>
      <AceFieldset :legend="t('lgColorBlending', '配色')" absolute class="flex-[1] overflow-hidden">
        <ColorBlendingTable
          :loading="loading || colorGroupLoading || colorBlendingLoading"
          :data="colorBlendingList"
        />
      </AceFieldset>
      <AceFieldset :legend="t('lgWorkOrder', '工单')" absolute class="flex-[1.2] overflow-hidden">
        <SizeInfoTable :loading="loading || workOrderLoading" :data="workOrderList" />
      </AceFieldset>
    </div>
  </div>
</template>

<script lang="tsx" root setup>
import ProductionWeeklyStatistics from './components/ProductionWeeklyStatistics/index.vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import OptionInput from '@/components/OptionInput.vue'
import TaskTable from './components/TaskTable/index.vue'
import ColorGroupTable from './components/ColorGroupTable/index.vue'
import ColorBlendingTable from './components/ColorBlendingTable/index.vue'
import SizeInfoTable from './components/SizeInfoTable/index.vue'
import { ref, onMounted } from 'vue'
import {
  openEditForm,
  openInsertForm,
  openStopWorkForm,
  openStopWorkForm2,
  openCancleForm
} from './utils/form'
import { searchObject, searchList, saveData } from '@/api/nameson'
import { ElMessageBox } from 'element-plus'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import {
  ColorBlendingVO,
  ColorGroupVO,
  StatisticsVO,
  TaskDetailVO,
  WorkOrderVO
} from '$types/views/MES/taskConfirm'
import ProcessDialog from './components/ProcessDialog/index.vue'
import WorkShopDialog from './components/WorkShopDialog/index.vue'
import FactoryDialog from './components/FactoryDialog/index.vue'
import { formatString } from '@/utils'
import { useRoute, useRouter } from 'vue-router'
import { getChangeStatusItemList } from '@/views/MES/taskConfirm/utils/upload'

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_PSTASK'
})

const { t, c } = useI18nProxy('VUE_MES_PSTASK')

const [query, queryManager] = useParamsRefManager(() => {
  return {
    FTYNO: '',
    FTYNAME: '',
    JOBNO: '',
    JOBNAME: '',
    WCSEQ: '',
    WCNAME: '',
    TCODE: '',
    PSNO: '',
    ORDNO: '',
    STYNO: '',
    TSKNO: '',
    STFG: '',
    WKDATE: {
      start: '',
      end: ''
    }
  }
})

const loading = ref(false)
const statisticsLoding = ref(false)
const colorGroupLoading = ref(false)
const workOrderLoading = ref(false)
const colorBlendingLoading = ref(false)

const statisticsRef = ref<InstanceType<typeof ProductionWeeklyStatistics>>()
const TaskTableRef = ref<InstanceType<typeof TaskTable>>()

const [taskList, taskListManager] = useArrayRefManager<TaskDetailVO>([])
const [colorGroupList, colorGroupListManager] = useArrayRefManager<ColorGroupVO>([])
const [colorBlendingList, colorBlendingListManager] = useArrayRefManager<ColorBlendingVO>([])
const [workOrderList, workOrderListManager] = useArrayRefManager<WorkOrderVO>([])

const handleTaskTableRowChange = async (row: TaskDetailVO) => {
  if (!row.PMSEQ) {
    colorGroupListManager.update([])
    workOrderListManager.update([])
    return
  }

  await loadColorGroupList(row.PMSEQ)
  await loadWorkOrderList(row.PSSEQ, row.TSKSEQ, row.PMSEQ, row.WCSEQ, row.JOBNO)
}

const handleColorGroupRowChange = async (row: ColorGroupVO) => {
  if (!row.PMSEQ) {
    colorBlendingListManager.update([])
    return
  }

  await loadColorBlendingList(row.PMSEQ, row.CUTSEQ, row.CLSEQ)
}

const handleInsertTask = () => {
  const records = TaskTableRef.value?.getCheckboxRecords()
  if (!records || records.length === 0) {
    ElMessageBox.alert('请选择要插单的数据！', { type: 'warning' })
    return
  }
  if (records.length > 1) {
    ElMessageBox.alert(`请选择 1 条要插单的数据，当前选中 ${records.length} 条！`, {
      type: 'warning'
    })
    return
  }
  openInsertForm(records[0].PSSEQ)
}

const handleEditTask = () => {
  const records = TaskTableRef.value?.getCheckboxRecords()
  if (!records || records.length === 0) {
    ElMessageBox.alert('请选择要编辑的数据！', { type: 'warning' })
    return
  }
  if (records.length > 1) {
    ElMessageBox.alert(`请选择 1 条要编辑的数据，当前选中 ${records.length} 条！`, {
      type: 'warning'
    })
    return
  }
  openEditForm(records[0].TSKNO)
}

const handleStopWork = () => {
  const records = TaskTableRef.value?.getCheckboxRecords()
  if (!records || records.length === 0) {
    ElMessageBox.alert('请选择要停工的数据！', { type: 'warning' })
    return
  }
  if (records.length > 1) {
    ElMessageBox.alert(`请选择 1 条要停工的数据，当前选中 ${records.length} 条！`, {
      type: 'warning'
    })
    return
  }
  openStopWorkForm2(records[0])
}

const handleChangeStatus = () => {
  const records = TaskTableRef.value?.getCheckboxRecords()
  if (!records || records.length === 0) {
    ElMessageBox.alert('请选择要确认的数据！', { type: 'warning' })
    return
  }

  const confirmList = records.filter((r) => r.STFG === 'EX_S')
  if (confirmList.length === 0) {
    ElMessageBox.alert('请选择排产状态的数据！', { type: 'warning' })
    return
  }

  ElMessageBox.confirm('是否确认修改?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        loading.value = true
        const postList: any[] = []
        confirmList.forEach((c) => {
          postList.push(getChangeStatusItemList({ item: c, status: 'EX_M' }))
        })

        if (postList.length > 0) {
          const res = await saveData(postList)
          if (res.statusCode == '1') {
            ElMessageBox.alert('确认成功！', { type: 'success' })
            loading.value = false
            await loadData()
          } else {
            throw new Error(res.message)
          }
        }
      } catch (err: any) {
        ElMessageBox.alert(`操作失败：${err.message || JSON.stringify(err)}`, { type: 'error' })
      } finally {
        loading.value = false
      }
    })
    .catch(() => {})
}

const loadData = async () => {
  loading.value = true
  await loadStatistics()
  await loadTaskList()
  loading.value = false
}

// 获取统计
const loadStatistics = async () => {
  statisticsLoding.value = true
  await loadLastWeekStatistics()
  await loadCurrentWeekStatistics()
  statisticsLoding.value = false
}

// 获取上周统计
const loadLastWeekStatistics = async () => {
  try {
    const remoteSql = remoteSqlMap['上方汇总信息（上周）']
    const statistics = await searchObject<StatisticsVO>({
      sql: remoteSql.DBQUERY,
      sortby: remoteSql.SORTBYCONTENT
    })

    statisticsRef.value?.updateLastWeekStatistics(statistics)
  } catch (e: any) {
    ElMessageBox.alert(`查询【上方汇总信息（上周）】数据错误：${e.message || JSON.stringify(e)}`)
  }
}
// 获取本周统计
const loadCurrentWeekStatistics = async () => {
  try {
    const remoteSql = remoteSqlMap['上方汇总信息（本周）']
    const statistics = await searchObject<StatisticsVO>({
      sql: remoteSql.DBQUERY,
      sortby: remoteSql.SORTBYCONTENT
    })

    statisticsRef.value?.updateCurrentWeekStatistics(statistics)
  } catch (e: any) {
    ElMessageBox.alert(`查询【上方汇总信息（本周）】数据错误：${e.message || JSON.stringify(e)}`)
  }
}

// 获取任务详情
const loadTaskList = async () => {
  try {
    const params = query.value
    const remoteSql = remoteSqlMap['任务详情']
    const list = await searchList<TaskDetailVO[]>({
      sql: remoteSql.DBQUERY,
      params: {
        'A.FTYNO': params.FTYNO,
        'E.JOBNO': params.JOBNO,
        'E.WCSEQ': params.WCSEQ,
        'T.CODE': params.TCODE,
        'A.PSNO': params.PSNO,
        'O.ORDNO': params.ORDNO,
        'S.STYNO': params.STYNO,
        'B.TSKNO': params.TSKNO,
        'D.STFG': params.STFG,
        'E.WKDATE__gte@date': params.WKDATE.start,
        'E.WKDATE__lte@date': params.WKDATE.end
      },
      sortby: remoteSql.SORTBYCONTENT
    })

    taskListManager.update(list)
    // TaskTableRef.value?.loadData(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询【任务详情】数据错误：${e.message || JSON.stringify(e)}`)
  }
}
// 颜色组
const loadColorGroupList = async (PMSEQ: number) => {
  colorGroupLoading.value = true
  try {
    const remoteSql = remoteSqlMap['颜色组信息']
    const list = await searchList<ColorGroupVO[]>({
      sql: formatString(remoteSql.DBQUERY, PMSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })

    colorGroupListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询【颜色组信息】数据错误：${e.message || JSON.stringify(e)}`)
  }
  colorGroupLoading.value = false
}
// 配色
const loadColorBlendingList = async (PMSEQ: number, CUTSEQ: number, CLSEQ: number) => {
  colorBlendingLoading.value = true
  try {
    const remoteSql = remoteSqlMap['配色信息']
    const list = await searchList<ColorBlendingVO[]>({
      sql: formatString(remoteSql.DBQUERY, PMSEQ, CUTSEQ, CLSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })

    colorBlendingListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询【配色信息】数据错误：${e.message || JSON.stringify(e)}`)
  }
  colorBlendingLoading.value = false
}

// 颜色组
const loadWorkOrderList = async (
  PSSEQ: number,
  TSKSEQ: number,
  PMSEQ: number,
  WCSEQ: number,
  JOBNO: string
) => {
  workOrderLoading.value = true
  try {
    const remoteSql = remoteSqlMap['工单信息']
    const list = await searchList<WorkOrderVO[]>({
      sql: formatString(remoteSql.DBQUERY, PSSEQ, TSKSEQ, PMSEQ, WCSEQ, JOBNO),
      sortby: remoteSql.SORTBYCONTENT
    })

    workOrderListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询【工单信息】数据错误：${e.message || JSON.stringify(e)}`)
  }
  workOrderLoading.value = false
}

onMounted(() => {
  const route = useRoute()
  const router = useRouter()

  router.replace({
    path: route.path,
    query: { ...route.query, a: 1 }
  })
  // loadData()
})
</script>
