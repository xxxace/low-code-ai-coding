<template>
  <StdFormWrapper :toolbar="form.BLTY !== 'PLORD'">
    <div class="!min-w-[700px] relative">
      <div class="whitespace-nowrap mt-1">
        <FieldItem :label="t('lbPLNNO', '编号')" :width="56">
          <el-input class="!w-[120px]" v-model="form.PLNNO" readonly/>
        </FieldItem>

        <FieldItem :label="t('lbREQSTAFF', '营业')" :width="56">
          <el-input class="!w-[120px]" v-model="form.STAFF" readonly/>
        </FieldItem>
        <FieldItem :label="t('lbTEAM', '队伍')" :width="56">
          <RemoteSelect
              ref="teamSelectRef"
              class="!w-[120px]"
              v-model="form.TEAM"
              v-model:content-value="form.V_TEAMNAME"
              value-key="TEAMNO"
              label-key="TEAMNAME"
              :data-loader="getTeamList"
              default-first
          />
        </FieldItem>

        <FieldItem :label="c('common.query','查单')" :width="28" independent>
          <el-input
              class="!w-[120px] mr-1"
              v-model.trim="searchText"
              :disabled="!stdForm.readonly"
              @keyup.enter="handleSearchOrder"
          />
        </FieldItem>
      </div>

      <div class="whitespace-nowrap mt-4">
        <FieldItem :label="t('lbCLNT', '客户')" :width="56" required>
          <OptionInput
              :label-width="100"
              :value-width="214"
              v-model="form.CLNT"
              v-model:labelValue="form.V_CLNTNAME"
              :dialog-compoent="CustomerDialog"
              autoLoad
              height="450px"
              @change="handleCLNTChange"
          />
        </FieldItem>
      </div>

      <div class="whitespace-nowrap mt-1">
        <FieldItem :label="t('lbCORPNO', '公司')" :width="56" required>
          <RemoteSelect
              ref="companySelectRef"
              class="!w-[314px]"
              v-model="form.CORPNO"
              v-model:content-value="form.V_CORPNAME"
              :data-loader="getCompanyList"
          />
        </FieldItem>

        <FieldItem :label="t('lbV_FTYNAME', '工厂')" :width="56">
          <OptionInput
              :label-width="80"
              :value-width="206"
              v-model="form.FTYNO"
              v-model:labelValue="form.V_FTYNAME"
              :disabled="!form.CLNT"
              :dialog-compoent="FactoryDialog"
              autoLoad
              :CLNT="form.CLNT"
              height="450px"
          />
        </FieldItem>
      </div>

      <div class="whitespace-nowrap mt-4">
        <FieldItem :label="t('lbSTYNO', '款号')" :width="56">
          <el-input class="!w-[120px]" v-model="form.STYNO" @keyup.enter="handleSTYNOEnter"/>
        </FieldItem>
        <FieldItem :label="t('lbCLNTSTYNO', '客款号')" :width="56">
          <el-input class="!w-[120px]" v-model="form.CLNTSTYNO" :title="form.CLNTSTYNO" readonly/>
        </FieldItem>
        <FieldItem :label="t('lbV_JOBNAME', '工序')" :width="56" required>
          <RemoteSelect
              class="!w-[120px]"
              v-model="form.JOBNO"
              v-model:content-value="form.V_JOBNAME"
              value-key="JOBNO"
              :data-loader="getJobList"
          />
        </FieldItem>
      </div>

      <div class="whitespace-nowrap mt-1">

        <FieldItem :label="t('lbWKHRS', '织工')" :width="56">
          <el-input class="!w-[120px]" v-model="form.WKHRS" type="number">
            <template #suffix>分钟/件</template>
          </el-input>
        </FieldItem>
        <FieldItem :label="t('lbWKHRS_FP', '缝工')" :width="56">
          <el-input class="!w-[120px]" v-model="form.WKHRS_FP" type="number">
            <template #suffix>分钟/件</template>
          </el-input>
        </FieldItem>
        <FieldItem :label="t('lbWKHRS_TZ', '挑工')" :width="56">
          <el-input class="!w-[120px]" v-model="form.WKHRS_TZ" type="number">
            <template #suffix>分钟/件</template>
          </el-input>
        </FieldItem>
      </div>

      <div class="mt-1 whitespace-nowrap">
        <FieldItem :label="t('lbFTYNO', '数量')" :width="56" required>
          <el-input class="!w-[120px]" v-model="form.QTY" type="number"/>
        </FieldItem>
        <FieldItem :label="t('lbBEGFR', '预计开机')" :width="56" required>
          <el-date-picker
              class="!w-[120px]"
              v-model="form.BEGFR"
              type="date"
              :editable="false"
              value-format="YYYY-MM-DD"
          />
        </FieldItem>
        <FieldItem :label="t('lbENDTO', '预计货期')" :width="56" required>
          <el-date-picker
              class="!w-[120px]"
              v-model="form.ENDTO"
              type="date"
              :editable="false"
              value-format="YYYY-MM-DD"
          />
        </FieldItem>
      </div>

      <div class="mt-1 whitespace-nowrap">
        <FieldItem :label="t('lbEQMCAT', '针种')" :width="56" required>
          <RemoteSelect class="!w-[120px]" v-model="form.EQMCAT" :data-loader="getEQMCATList"
                        @change="handleEQMCATChange"/>
        </FieldItem>
        <FieldItem :label="t('lbEQMMODEL', '电脑机')" :width="56" required>
          <RemoteSelect class="!w-[120px]"
                        v-model="form.EQMMODEL"
                        v-model:content-value="form.V_EQMNAME"
                        :params="{args:[form.EQMCAT]}"
                        :data-loader="getEQMMODList" :disabled="!form.EQMCAT"/>
        </FieldItem>
        <FieldItem :label="t('lbREPLYDT', '复单期限')" :width="56">
          <el-date-picker
              class="!w-[120px]"
              v-model="form.REPLYDT"
              type="date"
              :editable="false"
              value-format="YYYY-MM-DD"
          />
        </FieldItem>
      </div>

      <div class="whitespace-nowrap mt-4">
        <FieldItem :label="t('lbSTFG', '状态')" :width="56">
          <BillStatusInput class="!w-[120px]" :value="form.STFG" :label="form.V_STFGNAME"/>
        </FieldItem>
        <FieldItem :label="t('lbSTDT', '状态日期')" :width="56">
          <el-date-picker
              class="!w-[120px]"
              v-model="form.STDT"
              type="date"
              :editable="false"
              readonly
              value-format="YYYY-MM-DD"
          />
        </FieldItem>
        <FieldItem :label="t('lbSTREASON', '状态原因')" :width="56">
          <el-input class="!w-[288px]" v-model="form.STREASON" :title="form.STREASON" readonly/>
        </FieldItem>
      </div>
      <div class="mt-4 relative">
        <FieldItem :label="t('lbRMK', '备注')" :width="56">
          <el-input class="!w-[676px]" type="textarea" v-model="form.RMK" :rows="8"/>
        </FieldItem>
      </div>
    </div>
  </StdFormWrapper>
</template>
<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import dayjs from 'dayjs'
import StdFormWrapper from '@/components/StdForm/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import {useStdForm} from '@/components/StdForm/composeble/useStdForm'
import {formRelation} from './relations/form'
import {formRules} from './validationRules.ts'
import {useRefManager} from '@/hooks/useRefManager'
import {useSetupStdFormMeta} from '@/hooks/useSetupStdFormMeta'
import {useNsI18n} from "@/hooks/useNsI18n";
import {
  fetchInquiryOrder,
  getFactoryList,
  getCompanyList,
  getEQMCATList,
  getEQMMODList,
  getJobList,
  getTeamList,
  getInquiryOrderNo, getStyleNoList
} from "@/api/modules/nameson/inquiryOrder";
import type {InquiryOrderVO} from "@/api/modules/nameson/inquiryOrder";
import RemoteSelect from "@/components/RemoteSelectV2/index.vue";
import {ElMessageBox} from "element-plus";
import {useUser} from '@/store/useUser'
import CustomerDialog from "@/views/InquiryOrder/dialogs/customerDialog.vue";
import FactoryDialog from "@/views/InquiryOrder/dialogs/factoryDialog.vue";
import BillStatusInput from '@/components/Nameson/BillStatusInput/index.vue'
// import {OrderStatus} from '@/components/StdForm/types/stdForm'
// import type {ToolbarButton} from "@/components/StdForm/toolbar.vue";

defineOptions({
  objectName: 'VUE_INQUIRY'
})

// 创建StdForm单例
const stdForm = useStdForm()
stdForm.toolbar.print = false

// 设置表单原数据
useSetupStdFormMeta(stdForm)
// 获取翻译函数
const {t, c} = useNsI18n('VUE_INQUIRY')

const userStore = useUser()

const teamSelectRef = ref<InstanceType<typeof RemoteSelect> | null>(null)
const companySelectRef = ref<InstanceType<typeof RemoteSelect> | null>(null)
const searchText = ref('')
const stynoLoading = ref(false)
// ref响应值管理器
const [form, formManager] = useRefManager<InquiryOrderVO>(() => ({
  BLTY: 'IQYORD',
  ISLOCK: 'N',
  STAFF: (userStore.userInfo as any).USERNO,
  STFG: 'BL_D',
  STDT: dayjs().format('YYYY-MM-DD'),
  EXSTFG: 'EX_P'
}))
// 设置规则
formManager.setRules(formRules)
formRelation.manager = formManager

// 单据加载器
const inquiryOrderLoader = async (params) => {
  const whereParams = {
    ...params
  }

  const orderItem = await fetchInquiryOrder({
    where: whereParams
  })

  orderItem.FTYNO = orderItem.V_FTYNO

  return orderItem
}
formRelation.sqlQuery = (params) => {
  return {
    loader: inquiryOrderLoader,
    params: Object.keys(params).reduce((pre, key) => {
      pre[`A.${key}`] = params[key]
      return pre
    }, {}),
  }
}
// 注册关系
stdForm.relationRegister.register(formRelation)

stdForm.onInitDone(async () => {
  if (form.value.PLNSEQ) {
    // 查完单则清空查询内容
    searchText.value = ''
    await teamSelectRef.value?.load()
    await companySelectRef.value?.load()

    if (!form.value.PLNNO) {
      const teamOptions = teamSelectRef.value?.getOptions()

      if (teamOptions && teamOptions.length > 0) {
        form.value.TEAM = teamOptions[1].TEAMNO
      }
    }
  }
})

stdForm.onBeforeSubmit(async () => {
  if (form.value.BEGFR && form.value.ENDTO) {
    const diff = dayjs(form.value.ENDTO).diff(dayjs(form.value.BEGFR), 'day')
    if (diff < 5) {
      ElMessageBox.alert(`预计货期必须大于预计开机日期5个工作日以上！`, {type: 'warning'})
      return false
    }
  }

  // 获取单号
  if (!form.value.PLNNO) {
    const yearMonth = dayjs().format('YYMM')
    const EQMMODEL = form.value.EQMMODEL
    const FTYNO = form.value.FTYNO
    const PLNSEQ = form.value.PLNSEQ
    const orderNoItem = await getInquiryOrderNo({
      args: [yearMonth, EQMMODEL, FTYNO, PLNSEQ],
    })

    // 失败的话就跳过，下次获取，或者找开发人员修复
    if (orderNoItem.PLNNO) {
      form.value.PLNNO = orderNoItem.PLNNO
    }
  }

  if (form.value.ENDTO) {
    form.value.PLNMTH = dayjs(form.value.ENDTO).format('YYYYMM')
  }

  return true
})

// const customButtons = computed(() => {
//   return [
//     {
//       action: 'visitDetail',
//       name: t('btnVisitDetail', '查电脑机负荷详细'),
//       isDisabled: () =>
//           !form.value.PLNSEQ ||
//           (!form.value.EQMCAT && !form.value.EQMMODEL)
//     }
//   ] as ToolbarButton[]
// })
//
// stdForm.onCustomActionClick((action: string) => {
//   if (action === 'visitDetail') {
//       window.open()
//   }
// })

const handleSearchOrder = () => {
  const value = searchText.value
  const searchField = /^\d+$/.test(value) ? 'PLNSEQ' : 'PLNNO'
  stdForm.init({
    [searchField]: value
  })
}

const handleSTYNOEnter = () => {
  loadSTYNO()
}

const loadSTYNO = async () => {
  if (stynoLoading.value) return
  stynoLoading.value = true
  try {
    const stynoList = await getStyleNoList({
      where: {
        'S.STYNO': form.value.STYNO
      }
    })
    const item = stynoList[0]
    form.value.CLNTSTYNO = item.CLNTSTYNO
    form.value.WKHRS = item.WKHRS_ZJ
    form.value.WKHRS_FP = item.WKHRS_FP
    form.value.WKHRS_TZ = item.WKHRS_TZ
  } catch (e) {
    console.error(e)
  }
  stynoLoading.value = false
}

const handleCLNTChange = (item) => {
  form.value.FTYNO = ''
  form.value.V_FTYNAME = ''
  form.value.CORPNO = (item || {}).DEF_CORP
}
const handleEQMCATChange = () => {
  form.value.EQMMODEL = ''
}
</script>
