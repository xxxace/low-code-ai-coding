<template>
  <StdFormWrapper>
    <div class="!min-w-[800px] relative">
      <div class="relative mb-1 whitespace-nowrap">
        <FieldItem :label="t('lbITEMNO', '计划号')" :width="56">
          <el-input class="!w-[180px]" v-model="form.COSTPRC" type="number" readonly />
        </FieldItem>
        <FieldItem class="!align-top" :label="t('lbUPDUSER', '款号')" :width="80">
          <el-input class="!w-[180px]" v-model="form.UPDUSER" readonly />
        </FieldItem>
        <FieldItem class="!align-top" :label="t('lbUPDUSER', '批号')" :width="56">
          <el-input class="!w-[124px]" v-model="form.UPDUSER" readonly />
        </FieldItem>
        <FieldItem class="!align-top" :label="t('lbUPDUSER', '合约号')" :width="56">
          <el-input class="!w-[124px]" v-model="form.UPDUSER" readonly />
        </FieldItem>
        <FieldItem :label="t('lbITEMNO', '查单')" :width="56" independent>
          <el-input
            class="!w-[124px]"
            v-model="form.COSTPRC"
            type="number"
            placeholder="请输入计划号"
          />
        </FieldItem>
      </div>
      <div class="whitespace-nowrap">
        <FieldItem class="!align-top" :label="t('lbUPDUSER', '客户')" :width="56">
          <OptionInput
            :label-width="60"
            :value-width="120"
            value-key="JOBNO"
            v-model="form.JOBNO"
            v-model:labelValue="form.JOBNAME"
          />
        </FieldItem>
        <FieldItem class="!align-top" :label="t('lbUPDDTTM', '计划开工日期')" :width="80">
          <el-date-picker
            class="!w-[180px]"
            v-model="form.UPDDTTM"
            type="date"
            :editable="false"
            value-format="YYYY-MM-DD"
            readonly
          />
        </FieldItem>
        <FieldItem :label="t('lbITEMNO', '计划数量')" :width="56">
          <el-input class="!w-[124px]" v-model="form.UPDUSER" readonly />
        </FieldItem>
        <FieldItem :label="t('lbITEMSNAME', '完工数量')" :width="56">
          <el-input class="!w-[124px]" v-model="form.UPDUSER" readonly />
        </FieldItem>
        <FieldItem :label="t('lbITEMSNAME', '取消数量')" :width="56">
          <el-input class="!w-[124px]" v-model="form.UPDUSER" readonly />
        </FieldItem>
      </div>

      <div class="mt-1 whitespace-nowrap">
        <FieldItem :label="t('lbPROTYPE11', '当前状态')" :width="56">
          <el-input class="!w-[180px]" v-model="form.PROTYPE11" type="number" />
        </FieldItem>
        <FieldItem class="!align-top" :label="t('lbUPDDTTM', '计划完工日期')" :width="80">
          <el-date-picker
            class="!w-[180px]"
            v-model="form.UPDDTTM"
            type="date"
            :editable="false"
            value-format="YYYY-MM-DD"
            readonly
          />
        </FieldItem>
      </div>
      <div class="mt-1 whitespace-nowrap">
        <FieldItem :label="t('lbITEMNAME', '工业区')" :width="56">
          <OptionInput
            :label-width="60"
            :value-width="120"
            value-key="JOBNO"
            v-model="form.JOBNO"
            v-model:labelValue="form.JOBNAME"
          />
        </FieldItem>
        <FieldItem :label="t('lbITEMNAME', '工厂')" :width="80">
          <OptionInput
            :label-width="60"
            :value-width="120"
            value-key="JOBNO"
            v-model="form.JOBNO"
            v-model:labelValue="form.JOBNAME"
          />
        </FieldItem>
      </div>

      <div class="mt-1 whitespace-nowrap">
        <FieldItem :label="t('lbITEMNAME', '当前产线')" :width="56">
          <OptionInput
            :label-width="60"
            :value-width="120"
            value-key="JOBNO"
            v-model="form.JOBNO"
            v-model:labelValue="form.JOBNAME"
          />
        </FieldItem>
        <FieldItem :label="t('lbITEMNAME', '线长/带班长')" :width="80">
          <OptionInput
            :label-width="60"
            :value-width="120"
            value-key="JOBNO"
            v-model="form.JOBNO"
            v-model:labelValue="form.JOBNAME"
          />
        </FieldItem>
      </div>

      <div class="mt-1 relative">
        <FieldItem :label="t('lbRMK', '取消原因')" :width="56">
          <el-input class="!w-[854px]" type="textarea" v-model="form.RMK" :rows="2" />
        </FieldItem>
      </div>

      <div class="mt-2 min-h-[300px] h-full">
        <div class="relative flex">
          <AceFieldset class="flex-1" :legend="t('lgRecipeEntry', '取消明细')">
            <CancelTable
              ref="recipeTableRef"
              :data="recipeList"
              :row-initializer="recipeRowInitializer"
              @cell-value-change="handleCellValueChanged"
              @footer-row-updated="handleFooterRowUpdated"
            />
          </AceFieldset>
        </div>
      </div>
    </div>
  </StdFormWrapper>
</template>

<script setup lang="tsx" root>
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import StdFormWrapper from '@/components/StdForm/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import CancelTable from './components/CancelTable/index.vue'
import { parseImgSrc, sleep } from '@/utils'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { useUserStore } from '@/store/modules/user'
import { formRelation } from './relations/form'
import { recipeRelation } from './relations/bom'
import { useArrayRefManager, useRefManager } from '@/hooks/nameson/useRefManager'
import { formRules, recipeEntryRules } from './validationRules'
import { searchList, searchObject } from '@/api/nameson/index'
import NsTabPane from '@/components/ElementPlusProxy/NsTabPane.vue'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useSetupStdFormMeta } from '@/hooks/nameson/useSetupStdFormMeta'
import { useModal } from '@/plugins/dialog'
import AceUpload, { type FileInfo } from '@/components/AceUpload/index.vue'
import { formatString } from '@/utils'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import type { ToolbarButton } from '@/components/StdForm/toolbar.vue'
import { OrderStatus } from '@/components/StdForm/types/stdForm'
import { cloneDeep } from 'lodash-es'
import { toFixedPlus } from '@/utils/Sqlutils/utils'
import { VxeTableDefines } from 'vxe-table'

defineOptions({
  objectName: 'VUE_HOTEL_MATERIAL_PRD'
})

// 创建StdForm单例
const stdForm = useStdForm()
stdForm.toolbar.add = false
stdForm.toolbar.delete = false
stdForm.toolbar.draft = false
stdForm.toolbar.print = false
stdForm.toolbar.submit = false
stdForm.toolbar.finish = false
// 设置表单原数据
useSetupStdFormMeta(stdForm)
// 获取翻译函数
const { t } = useStdFormI18n()

// 明细组件ref
const recipeTableRef = ref<InstanceType<typeof RecipeInfo>>()

// ref响应值管理器
const [form, formManager] = useRefManager<DishesDTO>(() => ({
  PROTYPE11: 1,
  PROTYPE13: 1,
  MATCLASS: 6,
  TAX: 16,
  STFG: 'BL_D',
  STDT: dayjs().format('YYYY-MM-DD'),
  STAFF: useUserStore().userInfo?.username
}))
const [recipeList, recipeListManager] = useArrayRefManager<RecipeItemDTO>([])

const searchText = ref('')
const activeName = ref('first')

// 设置规则
formManager.setRules(formRules)
recipeListManager.setRules(recipeEntryRules)

// 数据 ref 绑定table ref
recipeListManager.ref = recipeTableRef

// 表单关系和明细关系绑定、查询语句绑定
formRelation.manager = formManager
formRelation.sqlQuery = (item) => ({
  sql: stdForm.sqlMap['菜品列表查询语句'].DBQUERY,
  params: Object.keys(item).reduce((pre, key) => {
    pre[`A.${key}`] = item[key]
    return pre
  }, {}),
  orderby: stdForm.sqlMap['菜品列表查询语句'].SORTBYCONTENT
})

recipeRelation.parentId = formRelation.id
recipeRelation.manager = recipeListManager
recipeRelation.sqlQuery = (item: DishesDTO) => ({
  sql: formatString(stdForm.sqlMap['菜品原料明细表'].DBQUERY, item.LSTSEQ),
  params: {},
  orderby: stdForm.sqlMap['菜品原料明细表'].SORTBYCONTENT
})

// 注册关系
stdForm.relationRegister.register(formRelation)
stdForm.relationRegister.register(recipeRelation)

stdForm.onInitDone(() => {
  // 查完单则清空查询内容
  searchText.value = ''
})

stdForm.onBeforeSubmit(async () => {
  if (!form.value.ITEMNO) {
    if (!form.value.DEPT) throw new Error('部門不能為空！')
    const ITEMNO = await fetchOrderNo(form.value.DEPT)
    if (!ITEMNO) throw new Error('生成單號失敗，請重試！')
    form.value.ITEMNO = ITEMNO
  }

  const costrate = Number(form.value.TAXPRC || 0)
    ? (form.value.COSTPRC || 0) / (Number(form.value.TAXPRC) / 1.166)
    : 0
  form.value.COSTRATE = toFixedPlus(costrate || 0, 7, true) as number

  const currentCOSTPRC = toFixedPlus(getTotalCOSTPRC(), 2, true) as number
  if (
    form.value.PROTYPE13 !== formManager.old?.PROTYPE13 ||
    currentCOSTPRC !== formManager.old?.COSTPRC
  ) {
    await recalcCost()
  }

  return true
})

stdForm.onCustomActionClick((action: string) => {
  if (action === 'selectOrder') {
    recipeSearchRef.value?.open()
  }
})

const fetchOrderNo = async (deptId: string | undefined) => {
  const remoteSql = stdForm.sqlMap['部门菜品编码生成查询']
  const res = await searchObject<{ ITEMNO: string }>({
    sql: formatString(remoteSql.DBQUERY, deptId),
    sortby: remoteSql.SORTBYCONTENT
  })

  return res ? res.ITEMNO : ''
}

const recipeRowInitializer = (row: RecipeItemDTO, utils) => {
  if (!form.value.LSTSEQ) throw new Error(t('msgOrdException', '单据异常请重新创建'))
  row.LSTSEQ = form.value.LSTSEQ
  row.BOMSEQ = utils.getMax('BOMSEQ') + 1
  row.ISCOMPUTE = 'Y'
  return row
}

const openForm = () => {
  useModal({
    modalProps: {
      title: '销售商品',
      width: '1220px',
      height: '764px'
    },
    component: () => (
      <iframe
        width="100%"
        height="100%"
        style="border: none;"
        src={
          window.location.origin +
          '/#/dynamic?to=' +
          encodeURIComponent(
            '@dynamic/views/hotel/dishesManage/dishes/index?identity=VUE_HOTEL_MATERIAL_PRD'
          )
        }
      />
    )
  })
}

const openMaterialForm = () => {
  useModal({
    modalProps: {
      title: '物品详情',
      width: '1280px',
      height: '620px'
    },
    component: () => (
      <iframe
        width="100%"
        height="100%"
        style="border: none;"
        src={
          window.location.origin +
          '/#/dynamic?to=' +
          encodeURIComponent(
            `@dynamic/views/hotel/materialManage/material/index?identity=VUE_HOTEL_MATERIAL_MAT`
          )
        }
      />
    )
  })
}

const handleImageImport = (file: FileInfo[]) => {
  form.value.IMGSEQ = file[0].base64 as unknown as number
}

const handelRecipeOrderPicked = async (item: DishesDTO) => {
  const copyItem: Partial<DishesDTO> = cloneDeep(item)
  delete copyItem.LSTSEQ
  delete copyItem.ITEMNO
  delete copyItem.TAXPRC
  delete copyItem.STFG
  delete copyItem.STDT
  delete copyItem.STREASON
  delete copyItem.ADDUSER
  delete copyItem.ADDDTTM
  delete copyItem.UPDUSER
  delete copyItem.UPDDTTM
  copyItem.PROTYPE13 = 1
  form.value = Object.assign({}, form.value, copyItem)
  await coverRecipeEntrise(item)
}

const handelRecipePicked = async (item: DishesDTO) => {
  await coverRecipeEntrise(item)
}

const coverRecipeEntrise = async (item: DishesDTO) => {
  let recipeList: RecipeItemDTO[] = []
  if (item && item.LSTSEQ) {
    const remoteSql = stdForm.sqlMap['复制单据明细的查询语句']
    recipeList = await searchList<RecipeItemDTO[]>({
      sql: formatString(remoteSql.DBQUERY, item.LSTSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })
  }

  recipeList = recipeList.map((item) => {
    item.ADDUSER = ''
    item.ADDDTTM = ''
    item.UPDUSER = ''
    item.UPDDTTM = ''
    item.LSTSEQ = form.value.LSTSEQ!
    return item
  })
  recipeListManager.cover(recipeList)
}

const coefficientOptionsLoader = () => {
  return [
    { CNAME: '例', CODE: 1 },
    { CNAME: '中', CODE: 1.5 },
    { CNAME: '大', CODE: 2 }
  ]
}

const getTotalCOSTPRC = () => {
  return recipeList.value.reduce((acc, item) => (acc += item.COSTPRC || 0), 0)
}

const recalcCost = async () => {
  // 计算比例系数
  const ratio = (form.value.PROTYPE13 || 0) / (formManager.old?.PROTYPE13 || 1)
  const COSTPRC = form.value.COSTPRC || 0
  const COSTRATE = form.value.COSTRATE || 0
  const TAXPRC = Number(form.value.TAXPRC || 0)

  const costrate = COSTRATE || (TAXPRC ? COSTPRC / (TAXPRC / 1.166) : 0)
  form.value.COSTPRC = toFixedPlus((COSTPRC || 0) * ratio, 2, true) as number
  form.value.COSTRATE = toFixedPlus((costrate || 0) * ratio, 7, true) as number

  form.value.COSTDATE = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const recipeRecords = recipeListManager.records
  recipeRecords.forEach((record) => {
    record.QTY1 = toFixedPlus((record.QTY1 || 0) * ratio, 10, true) as number
    record.QTY2 = toFixedPlus((record.QTY2 || 0) * ratio, 10, true) as number
    record.COSTPRC = toFixedPlus((record.COSTPRC || 0) * ratio, 10, true) as number
    record.COSTDATE = form.value.COSTDATE
  })
  recipeListManager.cover(recipeRecords)
}

const checkDraftAuthorization = async () => {
  while (Object.keys(stdForm.sqlMap['获取有草拟权限的用户清单']).length === 0) {
    console.log('empty')
    await sleep(300)
  }
  const remoteSql = stdForm.sqlMap['获取有草拟权限的用户清单']
  const authList = await searchList<{ TMPLNO: string }[]>({
    sql: remoteSql.DBQUERY,
    sortby: remoteSql.SORTBYCONTENT
  })

  const userStore = useUserStore()
  const hasAuth = authList.some(
    (item: { TMPLNO: string }) => item.TMPLNO === userStore.userInfo?.username
  )
  if (hasAuth) stdForm.toolbar.draft = true
}

const handleCellValueChanged = async (
  params: VxeTableDefines.CellClickEventParams<RecipeItemDTO>
) => {
  const { column, row } = params
  if (column) {
    if (column.field === 'QTY2' || column.field === 'DESIGNCOSTPRC') {
      recipeTableRef.value?.updateRowField(
        row,
        'COSTPRC',
        toFixedPlus(Number(row.QTY2 || 0) * (row.DESIGNCOSTPRC || row.COSTUNITPRC || 0), 2, true)
      )
    }
    // if (column.field === 'QTY1' || column.field === 'QTY2') {
    //   recipeTableRef.value?.updateRowField(
    //     row,
    //     'LOSSRATE',
    //     toFixedPlus(Number(row.QTY2) - (row.QTY1 || 0), 7, true)
    //   )
    // }
  }
}

const handleFooterRowUpdated = (map: any) => {
  const COSTPRC_TOTAL = map['COSTPRC'] ? map['COSTPRC'].replace(',', '') : 0
  const COSTPRC = toFixedPlus(Number(COSTPRC_TOTAL), 2, true) as number

  if (COSTPRC !== form.value.COSTPRC) {
    form.value.COSTPRC = COSTPRC ? COSTPRC : undefined
  }
}

// onMounted(async () => {
//   await checkDraftAuthorization()
// })
</script>

<style lang="scss" scoped>
.photo {
  position: absolute;
  top: 2px;
  left: 900px;
  z-index: 1;
}

.avatar-uploader,
.avatar-uploader .avatar {
  width: 262px;
  height: 216px;
  display: block;
  overflow: hidden;
}

.avatar-uploader .avatar {
  object-fit: contain;
}

.avatar-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 262px;
  height: 216px;
  text-align: center;
}
</style>
