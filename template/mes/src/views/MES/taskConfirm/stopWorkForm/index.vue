<template>
  <StdFormWrapper>
    <div class="!min-w-[660px] relative">
      <div class="whitespace-nowrap">
        <FieldItem :label="t('lbV_ORDNO', '批号')" :width="56">
          <el-input class="!w-[200px]" v-model="form.ORDNO" readonly />
        </FieldItem>
        <FieldItem :label="t('lbV_PMNO', '合约号')" :width="56">
          <el-input class="!w-[120px]" v-model="form.PMNO" readonly />
        </FieldItem>
        <FieldItem :label="t('lbMIN_WKDATE', '计划开工日期')" :width="80">
          <el-date-picker
            class="!w-[120px]"
            v-model="form.MIN_WKDATE"
            type="date"
            :editable="false"
            readonly
            value-format="YYYY-MM-DD"
          />
        </FieldItem>
      </div>
      <div class="whitespace-nowrap mt-1">
        <FieldItem :label="t('lbJOBNAME', '工序')" :width="56">
          <OptionInput
            :label-width="80"
            :value-width="120"
            v-model="form.JOBNO"
            v-model:labelValue="form.JOBNAME"
            readonly
          />
        </FieldItem>
        <FieldItem :label="t('lbQTY', '数量')" :width="56">
          <el-input class="!w-[120px]" v-model="form.QTY" readonly />
        </FieldItem>

        <FieldItem :label="t('lbMAX_WKDATE', '计划完工日期')" :width="80">
          <el-date-picker
            class="!w-[120px]"
            v-model="form.MAX_WKDATE"
            type="date"
            :editable="false"
            readonly
            value-format="YYYY-MM-DD"
          />
        </FieldItem>
      </div>

      <template v-if="!form.V_STRENAME">
        <div class="mt-1 relative">
          <FieldItem :label="t('lbSTFGREQBY', '申请人')" :width="56">
            <el-input class="!w-[200px]" v-model="form.STFGREQBY" readonly />
          </FieldItem>
          <FieldItem :label="t('lbSTFGREQDATE', '申请日期')" :width="56">
            <el-date-picker
              class="!w-[120px]"
              v-model="form.STFGREQDATE"
              type="date"
              :editable="false"
              readonly
              value-format="YYYY-MM-DD"
            />
          </FieldItem>
        </div>

        <div class="mt-1 relative">
          <FieldItem :label="t('lbAPPROVALBY', '批核人')" :width="56">
            <el-input class="!w-[200px]" v-model="form.APPROVALBY" readonly />
          </FieldItem>
          <FieldItem :label="t('lbAPPROVALDATE', '批核日期')" :width="56">
            <el-date-picker
              class="!w-[120px]"
              v-model="form.APPROVALDATE"
              type="date"
              :editable="false"
              readonly
              value-format="YYYY-MM-DD"
            />
          </FieldItem>
        </div>
      </template>

      <div class="mt-1 relative">
        <FieldItem :label="t('lbSTFG', '状态')" :width="56">
          <div class="!w-[200px]">
            <el-tag v-if="form.V_STRENAME" type="danger" disable-transitions
              >{{ form.V_STRENAME }}
            </el-tag>
            <el-tag v-else type="success" disable-transitions>{{ form.STFGNAME }}</el-tag>
            <span class="inline-block mx-2">改为</span>
            <el-tag v-if="form.V_STRENAME" type="success" disable-transitions>排产</el-tag>
            <el-tag v-else type="danger" disable-transitions>停工</el-tag>
          </div>
        </FieldItem>
        <FieldItem
          v-if="!form.V_STRENAME"
          :label="t('lbV_STFGTYPE', '停工类型')"
          :width="56"
          required
        >
          <RemoteSelect
            class="!w-[120px]"
            autoLoad
            transfer
            value-key="TMPLNO"
            v-model="form.V_STFGTYPE"
            :sql="stdForm.sqlMap['停工状态查询语句'].DBQUERY"
            :orderby="stdForm.sqlMap['停工状态查询语句'].SORTBYCONTENT"
          />
        </FieldItem>
      </div>

      <div class="mt-1 relative">
        <FieldItem :label="t('lbSTREASON', '状态原因')" :width="56" required>
          <el-input class="!w-[612px]" type="textarea" v-model="form.STREASON" :rows="5" />
        </FieldItem>
      </div>
    </div>
  </StdFormWrapper>
</template>

<script setup lang="tsx" root>
import { onMounted, ref } from 'vue'
import StdFormWrapper from '@/components/StdForm/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { PSTASKJOBRelation } from './relations/PSTASKJOB'
import { useRefManager } from '@/hooks/nameson/useRefManager'
import { pstaskjobRules } from './validationRules'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useSetupStdFormMeta } from '@/hooks/nameson/useSetupStdFormMeta'
import { PSTASKJOB_StopWorkDTO } from '$types/views/MES/stopWork'
import { useModalExpose } from '@/plugins/dialog'
// import { pstaskjob_sql } from './sql'
import { OrderStatus } from '@/components/StdForm/types/stdForm'
import { StdFormAction } from '@/components/StdForm/types/store'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/modules/user'

defineOptions({
  objectName: 'VUE_MES_STOP'
})

const modalExpose = useModalExpose()
// 创建StdForm单例
const stdForm = useStdForm()
stdForm.toolbar.add = false
stdForm.toolbar.edit = false
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
const { t, c } = useStdFormI18n()

// ref响应值管理器
const [form, formManager] = useRefManager<PSTASKJOB_StopWorkDTO>(() => ({}))

// 自定义变量区
const searchText = ref('')
const leaveRange = ref([])

// 设置规则
formManager.setRules(pstaskjobRules)

// 表单关系和明细关系绑定、查询语句绑定
PSTASKJOBRelation.manager = formManager
PSTASKJOBRelation.sqlQuery = (item) => ({
  sql: stdForm.sqlMap['任务工序信息'].DBQUERY,
  params: Object.keys(item).reduce((pre, key) => {
    pre[`D.${key}`] = item[key]
    return pre
  }, {}),
  orderby: stdForm.sqlMap['任务工序信息'].SORTBYCONTENT
})

// 注册关系
stdForm.relationRegister.register(PSTASKJOBRelation)

stdForm.onInitDone(() => {
  setTimeout(() => {
    stdForm.orderStatus = OrderStatus.Draft
    stdForm.actionType = StdFormAction.EDIT
    //停工操作时默认
    if (form.value.STFG !== 'EX_D') {
      const userStore = useUserStore()
      form.value.STFGREQBY = userStore.getUserInfo?.username
      form.value.STFGREQDATE = dayjs().format('YYYY-MM-DD hh:mm:ss')
    }
  })
  // 查完单则清空查询内容
  form.value.STREASON = ''
  searchText.value = ''
  leaveRange.value = []
})

stdForm.onBeforeSubmit(async () => {
  if (form.value.V_STFGTYPE) {
    form.value.STFGTYPE = form.value.V_STFGTYPE
  }
  // 恢复操作时重置
  if (form.value.STFG === 'EX_D') {
    form.value.STFG = 'EX_S'
    form.value.STDT = dayjs().format('YYYY-MM-DD hh:mm:ss')
    form.value.STFGTYPE = ''
    form.value.STFGREQBY = ''
    form.value.STFGREQDATE = ''
    formManager.rules!['STFGTYPE'][0].required = false
  } else {
    form.value.STFG = 'EX_D'
    form.value.STDT = dayjs().format('YYYY-MM-DD hh:mm:ss')
    formManager.rules!['STFGTYPE'][0].required = true
  }
  return true
})

onMounted(() => {
  if (modalExpose.params) {
    const { PSSEQ, TSKSEQ, JOBSEQ } = modalExpose.params
    stdForm.init({
      PSSEQ,
      TSKSEQ,
      JOBSEQ
    })
  }
})
</script>

<style lang="scss" scoped></style>
