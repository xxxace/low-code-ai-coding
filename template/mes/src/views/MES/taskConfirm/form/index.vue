<template>
  <StdFormWrapper>
    <div class="!min-w-[800px] relative">
<!--      <button @click="getUserInfo">关闭</button>-->
      <div class="relative mb-1 whitespace-nowrap">
        <FieldItem :label="t('lbTSKNO', '计划号')" :width="42">
          <el-input class="!w-[180px]" v-model="state.TSKNO" readonly />
        </FieldItem>
        <FieldItem :label="t('lbSTYNO', '款号')" :width="42">
          <el-input class="!w-[180px]" v-model="state.STYNO" readonly />
        </FieldItem>
        <FieldItem :label="t('lbV_ORDNO', '批号')" :width="28">
          <el-input class="!w-[180px]" v-model="state.V_ORDNO" readonly />
        </FieldItem>
        <FieldItem :label="t('lbsearchText', '查单')" :width="28" color="blue" independent>
          <el-input
            class="!w-[180px]"
            v-model="state.searchText"
            type="number"
            placeholder="请输入计划号"
            :disabled="!stdForm.readonly"
            @keyup.enter="handleSearchPMTASKJOB"
          />

          <!--          <el-button class="ml-1" type="primary" size="small">查询</el-button>-->
        </FieldItem>
      </div>

      <div class="mt-1 whitespace-nowrap">
        <FieldItem :label="t('lbV_PMNO', '合约号')" :width="42">
          <el-input class="!w-[180px]" v-model="state.V_PMNO" readonly />
        </FieldItem>
        <FieldItem :label="t('lbV_ORIGINNAME', '工业区')" :width="42">
          <el-input class="!w-[180px]" v-model="state.V_ORIGINNAME" readonly />
        </FieldItem>
        <FieldItem :label="t('lbV_FTYNAME', '工厂')" :width="28">
          <el-input class="!w-[180px]" v-model="state.V_FTYNAME" readonly />
        </FieldItem>
      </div>

      <div class="flex-1 flex mt-2 flex-col">
        <div class="flex-1">
          <div class="min-h-[300px] h-full">
            <div class="relative flex">
              <AceFieldset class="flex-1">
                <template #legend>
                  <div class="flex items-center mb-1">
                    <span>{{ t('lgEditBeforeEntry', '调整前明细') }}</span>
                  </div>
                </template>
                <JobTable ref="beforeEditTableRef" :data="beforeEditList" disabled />
              </AceFieldset>
            </div>
          </div>
        </div>

        <div class="flex-1">
          <div class="min-h-[300px] h-full">
            <div class="relative flex">
              <AceFieldset class="flex-1">
                <template #legend>
                  <div class="flex items-center">
                    <div class="flex items-center">
                      <span>{{ t('lgEditAfterEntry', '调整后明细') }}</span>
                    </div>

                    <div class="ml-4 flex items-center gap-4">
                      <div
                        class="cursor-pointer flex items-center gap-1 text-blue-700"
                        title="对某个任务进行拆分"
                        @click="handleSplitOrder"
                      >
                        <Icon icon="vi-ep:document-add" />
                        <span>拆分</span>
                      </div>
                    </div>
                  </div>
                </template>
                <EditJobTable
                  ref="editJobTableRef"
                  :data="editJobList"
                  :tool-bar="false"
                  :rowInitializer="editJobTableRowInitializer"
                  @cell-dbclick="handleEditTableCellDblclick"
                />
              </AceFieldset>
            </div>
          </div>
        </div>
      </div>
    </div>
    <WorkLineDialog
      ref="workLineDialogRef"
      :wcseq="currentEditRow.WCSEQ"
      :multi="isWorkLineDialogMulti"
      auto-load
      close-reset
      @confirm="handleWorkLineConfirm"
    />
  </StdFormWrapper>
</template>

<script setup lang="ts" root>
import { ref, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import StdFormWrapper from '@/components/StdForm/index.vue'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { PSTASKJOBRelation } from './relations/PSTASKJOB'
import { useArrayRefManager, useRefManager } from '@/hooks/nameson/useRefManager'
import { pstaskjobListRules } from './validationRules'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useSetupStdFormMeta } from '@/hooks/nameson/useSetupStdFormMeta'
import { VxeTableEvents } from 'vxe-table'
import { useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  PSTASKJOB_EDIT_VO,
  PSTASKJOB_VO,
  ViewOnlyVO,
  WorkLineVO
} from '$types/views/MES/editManager'
import JobTable from './components/JobTable/index.vue'
import EditJobTable from './components/EditJobTable/index.vue'
import WorkLineDialog from './dialogs/WorkLineDialog.vue'
import type { DefaultValueItem } from '@/components/StdForm/register/initHandler'
import { useDataTable } from '@/hooks/nameson/useDataTable'
import { cloneDeep } from 'lodash-es'
import { OrderStatus } from '@/components/StdForm/types/stdForm'
// import { useModalMsgSlaverManager } from '@/plugins/dialog'
//
// const modalMsgSlaverManager = useModalMsgSlaverManager()

// const getUserInfo = async () => {
//   const userInfo = await modalMsgSlaverManager.getUserInfo()
//   modalMsgSlaverManager.disconnect()
// }

defineOptions({
  objectName: 'VUE_MES_MODIFY'
})

// 创建StdForm单例
const stdForm = useStdForm()
stdForm.toolbar.add = false
stdForm.toolbar.delete = false
stdForm.toolbar.draft = false
stdForm.toolbar.print = false
stdForm.toolbar.submit = false
stdForm.toolbar.audit = false
stdForm.toolbar.finish = false
stdForm.toolbar.cancel = false

// 设置表单原数据
useSetupStdFormMeta(stdForm)
// 获取翻译函数
const { t } = useStdFormI18n()
// 组件ref
const workLineDialogRef = ref<InstanceType<typeof WorkLineDialog>>()
const pmjobTableRef = useDataTable()
const beforeEditTableRef = ref<InstanceType<typeof JobTable>>()
const editJobTableRef = ref<InstanceType<typeof EditJobTable>>()

// ref响应值管理器
const route = useRoute()
const isWorkLineDialogMulti = ref(false)
const currentEditRow = ref<PSTASKJOB_EDIT_VO>({} as any)
const [state, stateManager] = useRefManager<ViewOnlyVO>(() => ({
  searchText: ''
}))
const [pstaskjobList, pstaskjobListManager] = useArrayRefManager<PSTASKJOB_VO>([])
const [beforeEditList, beforeEditListManager] = useArrayRefManager<PSTASKJOB_VO>([])
const [editJobList, editJobListManager] = useArrayRefManager<PSTASKJOB_EDIT_VO>([])

// 设置规则
pstaskjobListManager.setRules(pstaskjobListRules)

// 数据 ref 绑定table ref
pstaskjobListManager.setRef(pmjobTableRef)
beforeEditListManager.setRef(beforeEditTableRef)
editJobListManager.setRef(editJobTableRef)

// 表单关系和明细关系绑定、查询语句绑定 PSTASKJOB 工序
PSTASKJOBRelation.manager = pstaskjobListManager
PSTASKJOBRelation.sqlQuery = (item) => ({
  sql: stdForm.sqlMap['根据任务号查询的语句'].DBQUERY,
  params: Object.keys(item).reduce((pre, key) => {
    pre[`A.${key}`] = item[key]
    return pre
  }, {}),
  orderby: stdForm.sqlMap['根据任务号查询的语句'].SORTBYCONTENT
})

// 注册关系
stdForm.relationRegister.register(PSTASKJOBRelation)

stdForm.onAfterInit((result: DefaultValueItem[]) => {
  if (result && result.length) {
    // 用pstaskjob的第一条数据的父表办法做表头视图数据
    const pstaskjobDefaultValueItem = result.find(
      (item) => item['@@target'] === PSTASKJOBRelation.id
    )

    const data = (pstaskjobDefaultValueItem || {}).data as PSTASKJOB_VO[]
    if (data && data.length) {
      updateState(data[0])
      beforeEditListManager.update(cloneDeep(data))
      editJobListManager.update(cloneDeep(data))
    }
  }
})

stdForm.onInitDone(() => {
  // 由于单据状态设计时是强藕合的，新的状态又是另外一套，故此强行转换成旧状态绕过设计缺陷
  setTimeout(() => {
    stdForm.orderStatus = OrderStatus.Draft
  })
  // 查完单则清空查询内容
  state.value.searchText = ''
})

stdForm.onBeforeSubmit(async () => {
  collectEditJobTableRows()
  return true
})

const editJobTableRowInitializer = (row: PSTASKJOB_EDIT_VO, utils) => {
  if (!state.value.PSSEQ) throw new Error(t('msgOrdException', '单据异常请重新创建'))
  row.PSSEQ = state.value.PSSEQ
  row.TSKSEQ = state.value.TSKSEQ!
  row.JOBSEQ = utils.getMax('JOBSEQ') + 1
  return row
}

const collectEditJobTableRows = () => {
  const editList = cloneDeep(editJobTableRef.value?.getTableData().fullData)
  const rows: PSTASKJOB_VO[] = []
  const splitRows: PSTASKJOB_VO[] = []
  console.log('editList', editList)
  for (const row of editList as PSTASKJOB_EDIT_VO[]) {
    console.log('row', row)
    let childQty = 0
    if (row.children && row.children.length) {
      row.children.forEach((child) => {
        child.QTY = child.EDIT_QTY || 0
        childQty += child.QTY
        delete child.children
        splitRows.push(child)
      })
    }

    const allEditQty = childQty + (row.EDIT_QTY || 0)
    if (allEditQty > row.HSQTY) {
      throw new Error(
        `序号 ${row.JOBSEQ} 的调整数量累加不能大于可调整，可调整数：${row.HSQTY},调整数：${allEditQty}`
      )
    }
    // 调整后的计划数量 = 已完成数 + 调整数量
    const EDIT_QTY = typeof row.EDIT_QTY !== 'number' ? row.HSQTY - childQty : row.EDIT_QTY
    row.QTY = (row.V_PRDQTY || 0) + EDIT_QTY

    delete row.children
    rows.push(row)
  }
  rows.push(...splitRows)
  pmjobTableRef.value.loadData(rows)
}

const init = () => {
  editJobListManager.init()
}

const updateState = (item: PSTASKJOB_VO) => {
  stateManager.update({
    searchText: '',
    PSSEQ: item.PSSEQ,
    TSKSEQ: item.TSKSEQ,
    TSKNO: item.TSKNO, //任务号
    STYSEQ: item.STYSEQ,
    STYNO: item.STYNO, //款号
    V_STYNAME: item.V_STYNAME, //款式名称
    V_ORDNO: item.V_ORDNO, //批号
    V_PMNO: item.V_PMNO, //合约号
    V_ORIGINNAME: item.V_ORIGINNAME, //工业区
    V_FTYNAME: item.V_FTYNAME //工厂
  })
}

const handleSearchPMTASKJOB = async () => {
  const TSKNO = state.value.searchText
  if (!TSKNO) {
    ElMessageBox.alert('计划号不能为空！', { type: 'warning' })
    return
  }

  try {
    init()
    await stdForm.init({ TSKNO })
  } catch (err: any) {
    ElMessageBox.alert(err.message || JSON.stringify(err), { type: 'warning' })
  }
}

const openWorkLineDialog = (isMulti?: boolean) => {
  isWorkLineDialogMulti.value = isMulti || false
  workLineDialogRef.value?.open()
}

const handleEditTableCellDblclick: VxeTableEvents.CellDblclick<PSTASKJOB_EDIT_VO> = (params) => {
  if (stdForm.readonly) return
  if (params.column.field !== 'V_WCNAME') return
  currentEditRow.value = params.row
  openWorkLineDialog()
}

const handleWorkLineConfirm = (item: WorkLineVO) => {
  if (!isWorkLineDialogMulti.value) {
    const row = currentEditRow.value
    editJobTableRef.value?.updateRowField(row, 'WCSEQ', item.WCSEQ)
    editJobTableRef.value?.updateRowField(row, 'V_WCNAME', item.CNAME)
    editJobTableRef.value?.updateRowField(row, 'V_ORIGINNAME', item.V_ORIGINNAME)
    editJobTableRef.value?.updateRowField(row, 'V_FTYNAME', item.V_FTYNAME)
  }
}

//拆单处理
const handleSplitOrder = async () => {
  if (stdForm.readonly) {
    ElMessageBox.alert('请点击编辑', { type: 'warning' })
    return
  }
  const records = editJobTableRef.value?.getCheckboxRecords() as PSTASKJOB_EDIT_VO[]
  if (!records || records.length === 0) {
    ElMessageBox.alert('请选择要拆分的数据', { type: 'warning' })
    return
  }

  if (records.length > 1) {
    console.log(records)
    ElMessageBox.alert(`请选择 1 条数据进行拆分，目前选中 ${records.length} 条！`, {
      type: 'warning'
    })
    return
  }

  const splitItem = records[0]
  const childrenRow: PSTASKJOB_EDIT_VO = {
    parentId: splitItem.JOBSEQ,
    JOBNO: splitItem.JOBNO,
    V_JOBNAME: splitItem.V_JOBNAME,
    WCSEQ: splitItem.WCSEQ,
    V_WCNAME: splitItem.V_WCNAME,
    HSQTY: splitItem.HSQTY,
    UNIT: 'PCS',
    STFG: 'EX_P',
    V_STFGNAME: '计划',
    STDT: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  await editJobTableRef.value?.addRow(childrenRow, -1)
  await nextTick()
  await editJobTableRef.value?.setAllTreeExpand(true)
}

onMounted(async () => {
  stdForm.init({ TSKNO: route.query.TSKNO })
})
</script>

<style lang="scss" scoped></style>
