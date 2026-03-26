<template>
  <StdFormWrapper>
    <div class="!min-w-[1080px] relative">
      <div class="relative flex">
        <div>
          <div class="relative mb-1 whitespace-nowrap">
            <FieldItem :label="t('lbITEMNO', '查单')" :width="84" independent color="blue">
              <UppercaseInput
                class="!w-[180px]"
                v-model="state.searchText"
                placeholder="请输入加工合约号"
                :disabled="!!state.PMSEQ"
                @keyup.enter="handleSearchPMOrder"
              />

              <!--              <el-button class="ml-2" type="primary" size="small" :disabled="!!state.PMSEQ"-->
              <!--                >查询-->
              <!--              </el-button>-->
            </FieldItem>
            <FieldItem :label="t('lbPMNO', '加工合约')" :width="84">
              <el-input class="!w-[180px]" v-model="state.PMNO" readonly />
            </FieldItem>
          </div>

          <div class="mt-1 relative whitespace-nowrap">
            <FieldItem :label="t('lbSTYNO', '款号')" :width="84">
              <el-input class="!w-[180px]" v-model="state.STYNO" readonly />
            </FieldItem>
            <FieldItem :label="t('lbV_PMQTY', '合约数量')" :width="84">
              <el-input class="!w-[180px]" v-model="state.V_PMQTY" type="number" readonly />
            </FieldItem>
          </div>

          <div class="mt-1 relative whitespace-nowrap">
            <FieldItem :label="t('lbDELYDATE', '交货日期')" :width="84">
              <el-date-picker
                class="!w-[180px]"
                v-model="state.DELYDATE"
                type="date"
                :editable="false"
                value-format="YYYY-MM-DD"
                readonly
              />
            </FieldItem>
          </div>

          <div class="mt-1 relative whitespace-nowrap">
            <FieldItem :label="t('lbBEGDT', '开工日期')" :width="84">
              <el-date-picker
                class="!w-[180px]"
                v-model="state.BEGDT"
                type="date"
                :editable="false"
                value-format="YYYY-MM-DD"
              />
            </FieldItem>
            <FieldItem :label="t('lbENDDT', '完工日期')" :width="84">
              <el-date-picker
                class="!w-[180px]"
                v-model="state.ENDDT"
                type="date"
                :editable="false"
                value-format="YYYY-MM-DD"
              />
            </FieldItem>
          </div>

          <div class="mt-1 relative whitespace-nowrap">
            <FieldItem :label="t('lbFTYNO', '工厂')" :width="84" required>
              <OptionInput
                :disabled="!state.PMSEQ"
                :PMSEQ="state.PMSEQ"
                :label-width="60"
                :value-width="120"
                label-key="V_FTYNAME"
                value-key="FTYNO"
                v-model="form.FTYNO"
                v-model:labelValue="state.V_FTYNAME"
                auto-load
                close-reset
                :dialog-compoent="FactoryDialog"
                @change="handleFactoryChange"
              />
            </FieldItem>

            <FieldItem :label="t('lbITEMNO', '产线')" :width="84">
              <OptionInput
                :disabled="!form.FTYNO"
                :FTYNO="form.FTYNO"
                :label-width="60"
                :value-width="120"
                value-key="WCSEQ"
                v-model="state.WCSEQ"
                v-model:labelValue="state.WCNAME"
                close-reset
                :dialog-compoent="WorkLineDialog"
              />
            </FieldItem>
          </div>

          <div class="mt-1 relative whitespace-nowrap">
            <FieldItem :label="t('lbinsertQty', '插单数量')" :width="84">
              <el-input class="!w-[180px]" v-model="state.insertQty" type="number" readonly />
            </FieldItem>
          </div>

          <div class="mt-2 relative whitespace-nowrap">
            <FieldItem :label="t('lbRMK', '插单备注')" :width="84">
              <el-input class="!w-[462px]" type="textarea" v-model="form.RMK" :rows="2" />
            </FieldItem>
          </div>
        </div>

        <div class="relative flex-1 ml-2">
          <FactoryTable ref="factoryTableRef" disabled :data="factoryList" />
        </div>
        <div class="relative flex-1 ml-2">
          <ProcessTable ref="jobTableRef" :toolBar="false" :data="pmjobList" />
        </div>
      </div>

      <div class="mt-1">
        <AceFieldset class="h-[300px]">
          <template #legend>
            <span>{{ t('lgRecipeEntry', '颜色组明细') }}</span>
            <el-divider direction="vertical" />
            <el-button
              :disabled="!state.PMSEQ"
              type="primary"
              size="small"
              @click="() => openColorDialog(true)"
              >{{ t('lgImportColor', '导入颜色') }}
            </el-button>
          </template>
          <ColorTable
            ref="colorTableRef"
            :toolBar="false"
            :data="pstaskclList"
            :rowInitializer="colorRowInitializer"
            @footer-row-updated="handleColorFooterRowUpdated"
            @cell-dbclick="handleColorTableCellDblclick"
          />
        </AceFieldset>
      </div>
    </div>

    <ColorDialog
      ref="colorDialogRef"
      :PMSEQ="state.PMSEQ!"
      :multi="isColorDialogMulti"
      auto-load
      close-reset
      @confirm="handleColorPick"
    />
  </StdFormWrapper>
</template>

<script setup lang="ts" root>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import StdFormWrapper from '@/components/StdForm/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { PSTASKRelation } from './relations/PSTASK'
import { PSTASKORDRelation } from './relations/PSTASKORD'
import { PSTASKJOBRelation } from './relations/PSTASKJOB'
import { PSTASKCLRelation } from './relations/PSTASKCL'
import { useArrayRefManager, useRefManager } from '@/hooks/nameson/useRefManager'
import { formRules, pstaskclListRules, pstaskjobListRules, pstaskordRules } from './validationRules'
import { searchList, searchObject } from '@/api/nameson/index'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useSetupStdFormMeta } from '@/hooks/nameson/useSetupStdFormMeta'
import { formatString } from '@/utils'
import type { VxeTableEvents } from 'vxe-table'
import FactoryTable from './components/FactoryTable/index.vue'
import ProcessTable from './components/ProcessTable/index.vue'
import ColorTable from './components/ColorTable/index.vue'
import { useRoute } from 'vue-router'
import {
  ColorGroupVO,
  FactoryVO,
  JOBVO,
  PMOrderVO,
  PSTASK_DTO,
  PSTASKCL_DTO,
  PSTASKJOB_DTO,
  PSTASKORD_DTO,
  ViewOnlyVO
} from '$types/views/MES/insertOrder'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'
import { ElMessageBox } from 'element-plus'
import { StdFormAction } from '@/components/StdForm/types/store'
import FactoryDialog from './dialogs/FactoryDialog.vue'
import WorkLineDialog from './dialogs/WorkLineDialog.vue'
import ColorDialog from '@/views/MES/taskConfirm/insertFormV4/dialogs/ColorDialog.vue'
import { useDataTable } from '@/hooks/nameson/useDataTable'
import { useModalExpose } from '@/plugins/dialog'

defineOptions({
  objectName: 'VUE_MES_INSERT'
})

// 创建StdForm单例
const stdForm = useStdForm()
stdForm.toolbar.add = false
stdForm.toolbar.edit = false
stdForm.toolbar.delete = false
stdForm.toolbar.draft = false
stdForm.toolbar.print = false
stdForm.toolbar.submit = false
stdForm.toolbar.finish = false
// 重写初始化方法
stdForm.onInit(async () => {
  const root = stdForm.relationRegister.root
  if (!root) throw new Error('relationRegister.root is not defined')
  const primaryKeyCol = stdForm.relationRegister.getPrimaryKey(root.relation)

  if (!primaryKeyCol) throw new Error('primaryKey is not defined')
  const primaryKeyValue: number | undefined = Number(route.query.PSSEQ)
  if (!primaryKeyValue) throw new Error('PSSEQ 获取失败')
  const TSKSEQ = await fetchTaskseq(primaryKeyValue)
  if (!TSKSEQ) throw new Error('TSKSEQ  获取失败')
  // const defaultValue = stdForm.relationRegister.getDefaultValue(root.relation)
  stdForm.actionType = StdFormAction.ADD
  return [
    {
      '@@target': root.relation.id,
      data: {
        [primaryKeyCol?.field]: primaryKeyValue,
        TSKSEQ: TSKSEQ + 1
      }
    }
  ]
})

// 设置表单原数据
useSetupStdFormMeta(stdForm)
// 获取翻译函数
const { t } = useStdFormI18n()
// 明细组件ref
const factoryTableRef = ref<InstanceType<typeof FactoryTable>>()
const jobTableRef = ref<InstanceType<typeof ProcessTable>>()
const colorTableRef = ref<InstanceType<typeof ColorTable>>()
const colorDialogRef = ref<InstanceType<typeof ColorDialog>>()
const pmjobTableRef = useDataTable()

const route = useRoute()
const isColorDialogMulti = ref(false)
const currentColorRow = ref<PSTASKCL_DTO>({} as any)
// ref响应值管理器
const [state, stateManager] = useRefManager<ViewOnlyVO>(() => ({
  searchText: ''
}))
const [form, formManager] = useRefManager<PSTASK_DTO>(() => ({
  UNIT: 'PCS'
}))
const [pstaskord, pstaskordManger] = useRefManager<PSTASKORD_DTO>(() => ({
  LSTSEQ: 1,
  ORDTY: 'PM',
  UNIT: 'PCS'
}))

const [factoryList, factoryListManger] = useArrayRefManager<FactoryVO>([])
const [pmjobList, pmjobListManger] = useArrayRefManager<JOBVO>([])

const [pstaskjobList, pstaskjobListManager] = useArrayRefManager<PSTASKJOB_DTO>([])
const [pstaskclList, pstaskclListManager] = useArrayRefManager<PSTASKCL_DTO>([])

// ghost table 初始化
pmjobTableRef.value.loadData(pstaskjobList)
pmjobTableRef.value.setRowInitializer((row: PSTASKJOB_DTO) => {
  if (!form.value.PSSEQ) throw new Error(t('msgOrdException', '单据异常请重新创建'))
  row.PSSEQ = form.value.PSSEQ
  row.TSKSEQ = form.value.TSKSEQ!
  row.UNIT = 'PCS'
  row.STFG = 'EX_S'
  row.STDT = dayjs().format('YYYY-MM-DD HH:mm:ss')
  return row
})

// 设置规则
formManager.setRules(formRules)
pstaskordManger.setRules(pstaskordRules)
pstaskjobListManager.setRules(pstaskjobListRules)
pstaskclListManager.setRules(pstaskclListRules)

// 数据 ref 绑定table ref
factoryListManger.setRef(factoryTableRef)
pmjobListManger.setRef(jobTableRef)
pstaskjobListManager.setRef(pmjobTableRef)
pstaskclListManager.setRef(colorTableRef)

// 表单关系和明细关系绑定、查询语句绑定
PSTASKRelation.manager = formManager
// PSTASKORD
PSTASKORDRelation.parentId = PSTASKRelation.id
PSTASKORDRelation.manager = pstaskordManger
// PSTASKJOB 工序
PSTASKJOBRelation.parentId = PSTASKRelation.id
PSTASKJOBRelation.manager = pstaskjobListManager
// PSTASKCL 颜色明细
PSTASKCLRelation.parentId = PSTASKRelation.id
PSTASKCLRelation.manager = pstaskclListManager

// 注册关系
stdForm.relationRegister.register(PSTASKRelation)
stdForm.relationRegister.register(PSTASKORDRelation)
stdForm.relationRegister.register(PSTASKJOBRelation)
stdForm.relationRegister.register(PSTASKCLRelation)

stdForm.onInitDone(() => {
  // 查完单则清空查询内容
  state.value.searchText = ''
  stdForm.actionType = StdFormAction.EDIT
})

stdForm.onAfterRollback(() => {
  init()
  stdForm.actionType = StdFormAction.ADD
})

stdForm.onBeforeSubmit(async () => {
  const selectedJobItems = jobTableRef.value?.getCheckboxRecords() as JOBVO[]
  if (!selectedJobItems || selectedJobItems.length < 1) {
    throw new Error('请选择工序！')
  }

  const stateItem = state.value
  const formItem = form.value

  // 回收主表数据
  form.value.STYSEQ = stateItem.STYSEQ
  form.value.QTY = stateItem.insertQty

  // 回收PSTASKORD表数据
  pstaskord.value.PSSEQ = formItem.PSSEQ
  pstaskord.value.TSKSEQ = formItem.TSKSEQ
  pstaskord.value.BILLID = stateItem.PMSEQ
  pstaskord.value.BILLNO = stateItem.PMNO
  pstaskord.value.PMSEQ = stateItem.PMSEQ
  pstaskord.value.CLNTDTTO = stateItem.DELYDATE
  pstaskord.value.QTY = stateItem.insertQty

  pmjobTableRef.value.init()
  // 回收勾选的工序数据
  selectedJobItems.forEach((item, i) => {
    const row = {
      PSSEQ: formItem.PSSEQ,
      TSKSEQ: formItem.TSKSEQ,
      JOBSEQ: i + 1,
      JOBNO: item.JOBNO,
      WCSEQ: stateItem.WCSEQ,
      BEGDT: stateItem.BEGDT,
      ENDDT: stateItem.ENDDT,
      QTY: stateItem.insertQty
    }
    pmjobTableRef.value.insert(row)
  })

  return true
})

stdForm.onAfterSubmit(() => {
  useModalExpose().unmount()
})

const init = () => {
  stateManager.init()
  pstaskordManger.init()
  factoryListManger.init()
  pmjobListManger.init()
  pstaskclListManager.init()
}

const fetchTaskseq = async (PSSEQ: number) => {
  const remoteSql = stdForm.sqlMap['取得当前排产表PSTASK的最大的TSKSEQ']
  const res = await searchObject<{ TSKSEQ: number }>({
    sql: formatString(remoteSql.DBQUERY, PSSEQ),
    sortby: remoteSql.SORTBYCONTENT
  })

  return res ? res.TSKSEQ : undefined
}

const fetchPMOrder = async (PMNO: string) => {
  const remoteSql = stdForm.sqlMap['合约的查询语句']
  return await searchObject<PMOrderVO>({
    sql: formatString(remoteSql.DBQUERY, PMNO),
    sortby: remoteSql.SORTBYCONTENT
  })
}

const fetchFactoryList = async (PMSEQ: number) => {
  const remoteSql = stdForm.sqlMap['合约的工厂清单的查询语句']
  return await searchList<FactoryVO[]>({
    sql: formatString(remoteSql.DBQUERY, PMSEQ),
    sortby: remoteSql.SORTBYCONTENT
  })
}

const fetchPMJobList = async (PMSEQ: number) => {
  const remoteSql = stdForm.sqlMap['查询合约的工序清单的语句']
  return await searchList<JOBVO[]>({
    sql: formatString(remoteSql.DBQUERY, PMSEQ),
    sortby: remoteSql.SORTBYCONTENT
  })
}

const handleSearchPMOrder = async () => {
  const PMNO = state.value.searchText
  if (!PMNO) {
    ElMessageBox.alert('合约单号不能为空！', { type: 'warning' })
    return
  }

  stdForm.loading = true
  try {
    init()
    const pmOrder = await fetchPMOrder(PMNO)
    if (pmOrder) {
      if (state.value.PMSEQ !== pmOrder.PMSEQ) {
        form.value.FTYNO = ''
        form.value.FTYSEQ = undefined
        form.value.FTYTY = ''
        state.value.V_FTYNAME = ''
      }

      const newState = {}
      Object.keys(pmOrder).forEach((key) => {
        newState[key] = pmOrder[key]
      })

      newState.searchText = ''
      stateManager.update(newState)

      if (pmOrder.PMSEQ) {
        const factories = await fetchFactoryList(pmOrder.PMSEQ)
        factoryListManger.update(factories)

        const pmjobs = await fetchPMJobList(pmOrder.PMSEQ)
        pmjobListManger.update(pmjobs)
      }
    } else {
      ElMessageBox.alert('找不到该合约单号的相关数据！', { type: 'warning' })
    }
  } catch (err: any) {
    ElMessageBox.alert(err.message || JSON.stringify(err), { type: 'warning' })
  }

  stdForm.loading = false
}

const handleFactoryChange = (item: FactoryVO) => {
  const { FTYSEQ, FTYTY } = item || {}

  if (form.value.FTYSEQ !== FTYSEQ) {
    state.value.WCSEQ = void 0
    state.value.WCNAME = ''
  }

  form.value.FTYSEQ = FTYSEQ || void 0
  form.value.FTYTY = FTYTY || ''
}

const handleColorPick = async (item: ColorGroupVO | ColorGroupVO[]) => {
  if (isColorDialogMulti.value && !(item instanceof Array)) {
    item = [item]
  }

  if (item instanceof Array) {
    const records = colorTableRef.value?.getTableData().visibleData as PSTASKCL_DTO[]
    for (const row of item) {
      //去重
      if (records.some((record) => record.CUTSEQ === row.CUTSEQ && record.CLNAME === row.CLNAME)) {
        continue
      }
      const newRow = {
        CUTSEQ: row.CUTSEQ,
        CLNAME: row.CLNAME,
        QTY: row.QTY,
        FRNUM: row.FRNUM,
        TONUM: row.TONUM,
        TKTQTY: row.TKTQTY
      }
      await colorTableRef.value?.addRow(newRow, -1)
    }
  } else {
    const row = currentColorRow.value
    const records = colorTableRef.value?.getTableData().visibleData
    if (
      !records ||
      records.some((record) => record.CUTSEQ === item.CUTSEQ && record.CLNAME === item.CLNAME)
    ) {
      ElMessageBox.alert('重复选择，请确认', { type: 'warning' })
    } else {
      colorTableRef.value?.updateRowField(row, 'CUTSEQ', item.CUTSEQ)
      colorTableRef.value?.updateRowField(row, 'CLNAME', item.CLNAME)
      colorTableRef.value?.updateRowField(row, 'QTY', item.QTY)
      colorTableRef.value?.updateRowField(row, 'FRNUM', item.FRNUM)
      colorTableRef.value?.updateRowField(row, 'TONUM', item.TONUM)
      colorTableRef.value?.updateRowField(row, 'TKTQTY', item.TKTQTY)
    }
  }
}

const openColorDialog = (isMulti?: boolean) => {
  if (!state.value.PMSEQ) return
  isColorDialogMulti.value = isMulti || false
  colorDialogRef.value?.open()
}

const colorRowInitializer = (row: PSTASKCL_DTO, utils) => {
  if (!form.value.PSSEQ) throw new Error(t('msgOrdException', '单据异常请重新创建'))
  row.PSSEQ = form.value.PSSEQ
  row.TSKSEQ = form.value.TSKSEQ!
  row.CLSEQ = utils.getMax('CLSEQ') + 1
  row.SORTBY = row.CLSEQ
  return row
}

const handleColorFooterRowUpdated = (totalMap: any) => {
  const QTYStr = totalMap.QTY ? totalMap.QTY.replace(/\,/g, '') : 0
  state.value.insertQty = Number(QTYStr) || void 0
}

const handleColorTableCellDblclick: VxeTableEvents.CellDblclick<PSTASKCL_DTO> = (params) => {
  if (stdForm.readonly) return
  if ('CLNAME' !== params.column.field) return
  currentColorRow.value = params.row
  openColorDialog()
}

onMounted(async () => {
  stdForm.init()
})
</script>

<style lang="scss" scoped></style>
