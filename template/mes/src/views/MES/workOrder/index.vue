<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <div id="vnode-container"></div>
    <AceFieldset legend="查询" class="overflow-hidden min-w-[1248px]">
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
        <FieldItem :label="t('lbWCSEQ', '车间')" :width="42">
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
        <FieldItem :label="t('lbSTFG', '状态')" :width="28">
          <RemoteSelect
            class="!w-[120px]"
            autoLoad
            transfer
            v-model="query.STFG"
            :sql="remoteSqlMap['状态的查询语句'].DBQUERY"
            :orderby="remoteSqlMap['状态的查询语句'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbWKDATE', '排产日期')" :width="56">
          <date-range-picker
            class="w-[210px]"
            v-model:start="query.WKDATE.start"
            v-model:end="query.WKDATE.end"
          />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loadingComputed" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
      <div class="my-1">
        <FieldItem :label="t('lbPSNO', '工单号')" :width="48">
          <el-input class="w-[200px]!" v-model="query.PSNO" />
        </FieldItem>
        <FieldItem :label="t('lbPMNO', '合约号')" :width="42">
          <el-input class="w-[200px]!" v-model="query.PMNO" />
        </FieldItem>
        <FieldItem :label="t('lbORDNO', '批号')" :width="28">
          <el-input class="w-[160px]!" v-model="query.ORDNO" />
        </FieldItem>
        <FieldItem :label="t('lbSTYNO', '款号')" :width="28">
          <el-input class="w-[120px]!" v-model="query.STYNO" />
        </FieldItem>
        <FieldItem :label="t('lbWCBOOS', '线长/带班长')" :width="70">
          <RemoteSelect
            class="!w-[120px]"
            autoLoad
            transfer
            v-model="query.WCBOOS"
            :sql="remoteSqlMap['线长/带班长的查询语句'].DBQUERY"
            :orderby="remoteSqlMap['线长/带班长的查询语句'].SORTBYCONTENT"
          />
        </FieldItem>

        <FieldItem :label="t('lbMACNUM', '机台号')" :width="42">
          <el-input class="w-[120px]!" v-model="query.MACNUM" />
        </FieldItem>
      </div>
    </AceFieldset>
    <AceFieldset legend="工单详情" absolute class="flex-1 overflow-hidden">
      <template #legend>
        <div class="flex items-center mb-1">
          <span>任务详情</span>

          <div class="ml-4 flex items-center gap-4">
            <div class="cursor-pointer flex items-center gap-1" @click="handleEditTask">
              <Icon icon="vi-ep:edit" />
              <span>{{ t('btnEdit', '编辑') }}</span>
            </div>
            <div class="cursor-pointer flex items-center gap-1" @click="handleInsertTask">
              <Icon icon="vi-ep:document-add" />
              <span>插单</span>
            </div>
            <div class="cursor-pointer flex items-center gap-1" @click="() => openStopWorkForm()">
              <Icon icon="vi-ep:warn-triangle-filled" />
              <span>停工</span>
            </div>
          </div>
        </div>
      </template>
      <WorkOrderTable
        ref="workOrderTableRef"
        :loading="loadingComputed"
        :data="workOrderList"
        @currentRowChange="handleWorkOrderRowChange"
      />
    </AceFieldset>
    <div class="flex-[0.5] flex">
      <AceFieldset legend="材料详情" absolute class="flex-[1] overflow-hidden">
        <MaterialTable :loading="loading || materialLoading" :data="materialList" />
      </AceFieldset>
      <AceFieldset legend="工序详情" absolute class="flex-[0.4] overflow-hidden">
        <ProcessDetailTable :loading="loading || materialLoading" :data="jobList" />
      </AceFieldset>
    </div>
  </div>
</template>

<script lang="tsx" setup>
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import OptionInput from '@/components/OptionInput.vue'
import WorkOrderTable from './components/workOrderTable/index.vue'
import ProcessDetailTable from './components/processDetailTable/index.vue'
import { ref, onMounted, computed } from 'vue'
import MaterialTable from './components/materialTable/index.vue'
import { openEditForm, openInsertForm, openStopWorkForm } from '../taskConfirm/utils/form'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'

import { formatString } from '@/utils'
import FactoryDialog from './dialogs/FactoryDialog/index.vue'
import ProcessDialog from './dialogs/ProcessDialog/index.vue'
import WorkShopDialog from './dialogs/WorkShopDialog/index.vue'
import { MaterialDetailVO, ProcessDetailVO, WorkOrderVO } from '$types/views/MES/workOrder'
import dayjs from 'dayjs'

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_PSTASK_GD'
})
const { t, c } = useI18nProxy('VUE_MES_PSTASK_GD')

const loading = ref(false)
const materialLoading = ref(false)
const jobLoading = ref(false)
const loadingComputed = computed(() => {
  return loading.value || materialLoading.value || jobLoading.value
})

const workOrderTableRef = ref<InstanceType<typeof WorkOrderTable>>()

const [query, queryManager] = useParamsRefManager(() => {
  return {
    FTYNO: '',
    FTYNAME: '',
    WCSEQ: '',
    WCNAME: '',
    JOBNO: '',
    JOBNAME: '',
    STFG: '',
    PSNO: '',
    PMNO: '',
    ORDNO: '',
    STYNO: '',
    WCBOOS: '',
    MACNUM: '',
    WKDATE: {
      start: dayjs().subtract(7, 'days'),
      end: dayjs().format('YYYY-MM-DD')
    }
  }
})

const [workOrderList, workOrderListManager] = useArrayRefManager<WorkOrderVO>([])
const [materialList, materialListManager] = useArrayRefManager<MaterialDetailVO>([])
const [jobList, jobListManager] = useArrayRefManager<ProcessDetailVO>([])

const handleWorkOrderRowChange = async (row: WorkOrderVO) => {
  if (!row.PSSEQ) {
    materialListManager.update([])
    jobListManager.update([])
    return
  }

  await loadMaterialList(row.PSSEQ, row.TSKSEQ)
  await loadJobList(row.PSSEQ, row.TSKSEQ)
}

const loadData = async () => {
  loading.value = true

  try {
    await loadWorkOrderList()
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }

  loading.value = false
}

const loadWorkOrderList = async () => {
  try {
    const params = query.value
    const remoteSql = remoteSqlMap['工单列表查询语句']
    const list = await searchList<WorkOrderVO[]>({
      sql: remoteSql.DBQUERY,
      params: {
        'B.FTYNO': params.FTYNO,
        'W.WCSEQ': params.WCSEQ,
        'J.JOBNO': params.JOBNO,
        'A.PSNO': params.PSNO,
        'P.PMNO__like': params.PMNO,
        'O.ORDNO': params.ORDNO,
        'BS1.CODE': params.STFG,
        'S.STYNO': params.STYNO,
        WCBOOS: '',
        'PC.WORKNUM': params.MACNUM,
        'E.WKDATE__gte@date': params.WKDATE.start,
        'E.WKDATE__lte@date': params.WKDATE.end
      },
      sortby: remoteSql.SORTBYCONTENT
    })

    workOrderListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}

const loadMaterialList = async (PSSEQ: number, TSKSEQ: number) => {
  if (!PSSEQ && !TSKSEQ) {
    return
  }

  materialLoading.value = true
  try {
    const remoteSql = remoteSqlMap['材料详情查询语句']
    const list = await searchList<MaterialDetailVO[]>({
      sql: formatString(remoteSql.DBQUERY, PSSEQ, TSKSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })

    materialListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`材料详情查询数据错误：${e.message || JSON.stringify(e)}`)
  }
  materialLoading.value = false
}

const loadJobList = async (PSSEQ: number, TSKSEQ: number) => {
  if (!PSSEQ && !TSKSEQ) {
    return
  }

  jobLoading.value = true
  try {
    const remoteSql = remoteSqlMap['工序详情查询语句']
    const list = await searchList<MaterialDetailVO[]>({
      sql: formatString(remoteSql.DBQUERY, PSSEQ, TSKSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })

    jobListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`工序详情查询数据错误：${e.message || JSON.stringify(e)}`)
  }
  jobLoading.value = false
}

const handleInsertTask = () => {
  const records = workOrderTableRef.value?.getCheckboxRecords()
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
  const records = workOrderTableRef.value?.getCheckboxRecords()
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
</script>
