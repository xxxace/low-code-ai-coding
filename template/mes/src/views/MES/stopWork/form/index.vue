<template>
  <StdFormWrapper>
    <div class="!min-w-[800px] relative">
      <div class="whitespace-nowrap">
        <FieldItem :label="t('lbREQNO', '单号')" :width="56">
          <el-input class="!w-[120px]" v-model="form.REQNO" readonly />
        </FieldItem>
        <FieldItem :label="t('lbREQDATE', '单据日期')" :width="56">
          <el-date-picker
            class="!w-[120px]"
            v-model="form.REQDATE"
            type="date"
            :editable="false"
            readonly
            value-format="YYYY-MM-DD"
          />
        </FieldItem>
        <FieldItem :label="t('lbREQSTAFF', '制单人')" :width="42">
          <el-input class="!w-[120px]" v-model="form.REQSTAFF" readonly />
        </FieldItem>
        <FieldItem :label="t('lbSTFG', '状态')" :width="56">
          <el-input class="!w-[120px]" v-model="form.V_STFGNAME" readonly />
        </FieldItem>
        <FieldItem :label="c('查单', 'common.query')" :width="28" independent>
          <el-input
            class="!w-[100px] mr-1"
            v-model="searchText"
            :disabled="!stdForm.readonly"
            @keyup.enter="handleSearchOrder"
          />
          <el-button
            type="primary"
            size="small"
            :disabled="!stdForm.readonly"
            @click="() => advancedQueryDialogRef?.open()"
            >{{ c('高级查询', 'common.advancedQuery') }}
          </el-button>
        </FieldItem>
      </div>
      <div class="whitespace-nowrap mt-1">
        <FieldItem :label="t('lbV_FTYNAME', '工厂')" :width="56" required>
          <OptionInput
            :label-width="100"
            :value-width="214"
            v-model="form.FTYNO"
            v-model:labelValue="form.V_FTYNAME"
            :dialog-compoent="FactoryDialog"
            @change="handleFtynoChange"
          />
        </FieldItem>
        <FieldItem :label="t('lbSTDT', '状态日期')" :width="236">
          <el-date-picker
            class="!w-[120px]"
            v-model="form.STDT"
            type="date"
            :editable="false"
            readonly
            value-format="YYYY-MM-DD"
          />
        </FieldItem>
      </div>
      <div class="mt-1 relative">
        <FieldItem :label="t('lbV_DEPTNAME', '部门')" :width="56" required>
          <OptionInput
            :label-width="100"
            :value-width="214"
            label-key="V_DEPTNAME"
            value-key="DEPTNO"
            :FTYNO="form.FTYNO"
            closeReset
            v-model="form.DEPTNO"
            v-model:labelValue="form.V_DEPTNAME"
            :dialog-compoent="DepartmentDialog"
          />
        </FieldItem>
        <FieldItem :label="t('lbSTREASON', '状态原因')" :width="236">
          <el-input class="!w-[120px]" v-model="form.STREASON" readonly />
        </FieldItem>
      </div>
      <div class="mt-1 relative">
        <FieldItem :label="t('lbV_JOBNAME', '工序')" :width="56" required>
          <OptionInput
            :label-width="100"
            :value-width="214"
            v-model="form.JOBNO"
            v-model:labelValue="form.V_JOBNAME"
            :dialog-compoent="JobDialog"
          />
        </FieldItem>
      </div>
      <div class="mt-1 relative">
        <FieldItem :label="t('lbRMK', '停工原因')" :width="56" required>
          <el-input class="!w-[908px]" type="textarea" v-model="form.RMK" :rows="2" />
        </FieldItem>
      </div>

      <div class="mt-2 min-h-[300px]">
        <div class="relative flex">
          <AceFieldset class="flex flex-col flex-1" :legend="t('lgRecipeEntry', '人员清单')">
            <div class="mb-1 flex">
              <el-button type="primary" size="small" @click="() => openStaffDialog(true)">
                选择员工
              </el-button>

              <div class="ml-4">
                <FieldItem :label="t('lbLeaveRange', '放假起始范围')" :width="84">
                  <vxe-date-range-picker
                    class="!w-[260px]"
                    size="mini"
                    v-model="leaveRange"
                    type="datetime"
                    value-format="yyyy-MM-dd HH:mm"
                    label-format="yyyy-MM-dd HH:mm"
                    clearable
                    :disabled="stdForm.readonly"
                  ></vxe-date-range-picker>
                </FieldItem>

                <FieldItem :label="t('lbLeaveHours', '放假时数')" :width="56">
                  <el-input class="!w-[80px]" type="number" v-model="leaveHours" readonly />
                  <el-button class="ml-2" type="primary" size="small" @click="handleSetLeaveRange"
                    >设置放假起始范围
                  </el-button>
                </FieldItem>

                <FieldItem :label="t('lbRMK', '总人数')" :width="42">
                  <el-input class="!w-[80px]" type="number" v-model="rowCount" readonly />
                </FieldItem>
              </div>
            </div>
            <StaffTable
              class="h-[348px]"
              ref="leaveTableRef"
              :data="leaveList"
              :row-initializer="recipeRowInitializer"
              @total-rows-updated="handleRowsUpdated"
              @cell-dbclick="handleLeaveListDblclick"
            />
          </AceFieldset>
        </div>
      </div>
    </div>

    <AdvancedQueryDialog
      ref="advancedQueryDialogRef"
      closeReset
      @confirm="handleAdvancedQueryConfirm"
    />
    <StaffDialog
      ref="staffDialogRef"
      :multi="isStaffDialogSelectMulti"
      :FTYNO="form.FTYNO"
      :DEPTNO="form.DEPTNO"
      @confirm="handleStaffConfirm"
    />
  </StdFormWrapper>
</template>

<script setup lang="tsx" root>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import StdFormWrapper from '@/components/StdForm/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import StaffTable from './components/StaffTable/index.vue'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { useUserStore } from '@/store/modules/user'
import { formRelation } from './relations/form'
import { leaveListRelation } from './relations/leaveList'
import { useArrayRefManager, useRefManager } from '@/hooks/nameson/useRefManager'
import { formRules, leaveListRules } from './validationRules'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useSetupStdFormMeta } from '@/hooks/nameson/useSetupStdFormMeta'
import { formatString } from '@/utils'
import { EXREQFormDTO, EXREQLSTItemDTO } from '$types/views/MES/stopWork'
import FactoryDialog from './components/FactoryDialog/index.vue'
import DepartmentDialog from './components/DepartmentDialog/index.vue'
import JobDialog from './components/JobDialog/index.vue'
import AdvancedQueryDialog from './components/AdvancedQueryDialog/index.vue'
import StaffDialog from './components/StaffDialog/index.vue'
import { ElMessageBox } from 'element-plus'
import { VxeTableEvents } from 'vxe-table'

defineOptions({
  objectName: 'VUE_MES_STOP'
})

// 创建StdForm单例
const stdForm = useStdForm()
stdForm.toolbar.add = true
stdForm.toolbar.delete = false
stdForm.toolbar.draft = true
stdForm.toolbar.print = false
stdForm.toolbar.submit = true
stdForm.toolbar.finish = false
// 设置表单原数据
useSetupStdFormMeta(stdForm)
// 获取翻译函数
const { t, c } = useStdFormI18n()

// 明细组件ref
const leaveTableRef = ref<InstanceType<typeof StaffTable>>()
// ref响应值管理器
const [form, formManager] = useRefManager<EXREQFormDTO>(() => ({
  REQDATE: dayjs().format('YYYY-MM-DD'),
  REQSTAFF: useUserStore().userInfo?.username,
  STFG: 'BL_D',
  STDT: dayjs().format('YYYY-MM-DD'),
  STAFF: useUserStore().userInfo?.username
}))
const [leaveList, leaveListManager] = useArrayRefManager<EXREQLSTItemDTO>([])

// 自定义变量区
const searchText = ref('')
const leaveRange = ref([])
const leaveHours = computed(() => {
  if (!leaveRange.value.length) return 0
  const [start, end] = leaveRange.value

  // 计算差值（单位：小时）
  const hours = dayjs(end).diff(dayjs(start), 'hour')
  return hours
})
const rowCount = ref(0)
const currentLeaveRow = ref<EXREQLSTItemDTO>()
const advancedQueryDialogRef = ref<InstanceType<typeof AdvancedQueryDialog>>()
const staffDialogRef = ref<InstanceType<typeof StaffDialog>>()
const isStaffDialogSelectMulti = ref(false)
// 设置规则
formManager.setRules(formRules)
leaveListManager.setRules(leaveListRules)

// 数据 ref 绑定table ref
leaveListManager.ref = leaveTableRef

// 表单关系和明细关系绑定、查询语句绑定
formRelation.manager = formManager
formRelation.sqlQuery = (item) => ({
  sql: stdForm.sqlMap['单据主表的查询语句'].DBQUERY,
  params: Object.keys(item).reduce((pre, key) => {
    pre[`A.${key}`] = item[key]
    return pre
  }, {}),
  orderby: stdForm.sqlMap['单据主表的查询语句'].SORTBYCONTENT
})

leaveListRelation.parentId = formRelation.id
leaveListRelation.manager = leaveListManager
leaveListRelation.sqlQuery = (item: EXREQFormDTO) => ({
  sql: formatString(stdForm.sqlMap['明细表的查询语句'].DBQUERY, item.REQSEQ),
  params: {},
  orderby: stdForm.sqlMap['明细表的查询语句'].SORTBYCONTENT
})

// 注册关系
stdForm.relationRegister.register(formRelation)
stdForm.relationRegister.register(leaveListRelation)

stdForm.onInitDone(() => {
  // 查完单则清空查询内容
  searchText.value = ''
  leaveRange.value = []
})

stdForm.onBeforeSubmit(async () => {
  if (!form.value.REQNO && form.value.REQSEQ) {
    //单号同REQSEQ一样
    form.value.REQNO = String(form.value.REQSEQ)
  }

  return true
})

const handleSearchOrder = () => {
  if (!searchText.value || searchText.value == form.value.REQNO) return
  stdForm.init({ REQNO: searchText.value })
}

const recipeRowInitializer = (row: EXREQLSTItemDTO, utils) => {
  if (!form.value.REQSEQ) throw new Error(t('msgOrdException', '单据异常请重新创建'))
  row.REQSEQ = form.value.REQSEQ
  row.LSTSEQ = utils.getMax('LSTSEQ') + 1
  return row
}

const handleRowsUpdated = (rows: EXREQLSTItemDTO[]) => {
  rowCount.value = rows.length
}

const handleLeaveListDblclick: VxeTableEvents.CellDblclick<EXREQLSTItemDTO> = (params) => {
  if (stdForm.readonly) return
  if (!['EMPNO', 'V_EMPNAME'].includes(params.column.field)) return
  currentLeaveRow.value = params.row
  openStaffDialog()
}

const openStaffDialog = (isFromBtn?: boolean) => {
  if (!form.value.FTYNO || !form.value.DEPTNO) {
    ElMessageBox.alert('工厂或部门不能为空', { type: 'warning' })
    return
  }
  isStaffDialogSelectMulti.value = isFromBtn || false
  staffDialogRef.value?.open()
}

const handleFtynoChange = () => {
  form.value.DEPTNO = ''
  form.value.V_DEPTNAME = ''
}

const handleAdvancedQueryConfirm = (item: EXREQFormDTO) => {
  stdForm.init(item ? item.REQSEQ : '')
}

const handleStaffConfirm = async (item: any) => {
  //双击时单独处理
  if (!isStaffDialogSelectMulti.value) {
    const row = currentLeaveRow.value!
    leaveTableRef.value?.updateRowField(row, 'EMPNO', item.EMPNO)
    leaveTableRef.value?.updateRowField(row, 'V_EMPNAME', item.EMPNAME)
    leaveTableRef.value?.updateRowField(row, 'POSTNO', item.POSTNO)
    leaveTableRef.value?.updateRowField(row, 'V_POSTNAME', item.V_JOBNAME)
    return
  }

  if (!(item instanceof Array)) {
    item = [item]
  }

  const records = leaveTableRef.value?.getTableData().visibleData as EXREQLSTItemDTO[]
  for (const row of item) {
    //去重
    if (records.some((record) => record.EMPNO === row.EMPNO)) {
      continue
    }
    const newRow = {
      EMPNO: row.EMPNO,
      V_EMPNAME: row.EMPNAME,
      // WCSEQ: row.DEPTNO,
      // V_JOBNAME: row.V_DEPTNAME,
      POSTNO: row.POSTNO,
      V_POSTNAME: row.V_JOBNAME
    } as unknown as EXREQLSTItemDTO
    await leaveTableRef.value?.addRow(newRow)
  }
}

const handleSetLeaveRange = () => {
  if (!leaveRange.value || !leaveRange.value.length) {
    ElMessageBox.alert('请选择要设置起始范围！', { type: 'warning' })
    return
  }
  if (leaveHours.value <= 0) {
    ElMessageBox.alert('放假时数必须大于0！', { type: 'warning' })
    return
  }
  const rows = leaveTableRef.value?.getCheckboxRecords()

  if (!rows || !rows.length) {
    ElMessageBox.alert('请选择要设置起始范围的数据！', { type: 'warning' })
    return
  }
  const [begin, end] = leaveRange.value
  for (const row of rows) {
    leaveTableRef.value?.updateRowField(row, 'BEGDT', begin)
    leaveTableRef.value?.updateRowField(row, 'ENDDT', end)
    leaveTableRef.value?.updateRowField(row, 'HRS', leaveHours.value)
  }
}
</script>

<style lang="scss" scoped></style>
