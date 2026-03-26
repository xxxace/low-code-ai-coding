<template>
  <StdFormWrapper>
    <div class="!min-w-[300px] relative flex flex-col h-full overflow-hidden">
      <div class="whitespace-nowrap flex">
        <FieldItem class=" flex w-[220px] min-w-[220px]" label="分组类型" :width="62" required>
          <RemoteSelect
              class="flex-1"
              ref="anchorGroupTypeRef"
              v-model="form.TMPLTY"
              value-key="TMPLNO"
              :data-loader="fetchAnchorGroupTypeList"
              default-first
              no-empty
          />
        </FieldItem>
        <FieldItem class="flex flex-1 min-w-[300px]!" label="平台" :width="64" required>
          <RemoteSelect
              class="flex-1"
              v-model="form.REF1"
              value-key="TYPE_NAME"
              label-key="TYPE_NAME"
              :data-loader="fetchPlatformList"
          />
        </FieldItem>
      </div>

      <div class="whitespace-nowrap flex mt-1">
        <FieldItem class=" flex w-[220px] min-w-[220px]" label="分组编码" :width="62" required>
          <UppercaseInput class="flex-1" v-model="form.TMPLNO"/>
        </FieldItem>
        <FieldItem class="flex flex-1 min-w-[300px]!" label="分组名称" :width="64" required>
          <el-input class="flex-1" v-model="form.CNAME"/>
        </FieldItem>
      </div>

      <div class="mt-1 mb-4 relative flex">
        <FieldItem class="flex flex-1" label="备注" :width="62">
          <el-input class="flex-1" type="textarea" v-model="form.RMK" :rows="3"/>
        </FieldItem>
      </div>

      <AceFieldset class="flex-1" legend="达人明细">
        <template #legend>
          <div class="flex items-center mb-1">
            <span>达人明细</span>

            <div class="ml-4 flex items-center gap-4">
              <div class="cursor-pointer flex items-center gap-1" @click="handleBatchInsertOpen">
                <Icon icon="vi-ep:copy-document"/>
                <span>批量插入达人</span>
              </div>

              <div class="cursor-pointer flex items-center gap-1" @click="handleSelectAnchor">
                <Icon icon="vi-ep:search"/>
                <span>选择达人</span>
              </div>
            </div>
          </div>
        </template>
        <AnchorEntriesTable
            ref="anchorEntriesTableRef"
            :data="anchorList"
            :add-button="false"
            :row-initializer="anchorRowInitializer"
        />
      </AceFieldset>


      <BatchSearchDialog v-model:visible="batchInsertVisible" title="批量插入达人" width="600" :max-count="100"
                         label-text="达人ID" @confirm="handleBatchInsertConfirm"/>
      <AnchorDialog ref="anchorDialogRef" multi :platform="form.REF1" @confirm="handleAnchorSelectConfirm"/>
    </div>
  </StdFormWrapper>
</template>
<script setup lang="ts">
import {ref} from 'vue'
import StdFormWrapper from '@/nameson/components/StdForm/index.vue'
import {useStdForm} from '@/nameson/components/StdForm/composeble/useStdForm'
import {formRelation} from './relations/form'
import {anchorEntriesRelation} from "./relations/anchorEntries";
import {formRules, anchorEntriesRules} from './validationRules'
import {useArrayRefManager, useRefManager} from '@/hooks/nameson/useRefManager'
import {useSetupStdFormMeta} from '@/nameson/hooks/useSetupStdFormMeta'
import RemoteSelect from "@/nameson/components/RemoteSelectV2/index.vue";
import FieldItem from '@/nameson/components/FieldItem/index.vue'
import UppercaseInput from '@/nameson/components/UppercaseInput/index.vue'
import AceFieldset from '@/nameson/components/AceFieldset/index.vue'
import {ElMessageBox} from "element-plus";
import AnchorEntriesTable from "./components/anchorEntriesTable.vue";
import {
  fetchAnchorGroupList,
  fetchAnchorEntryList,
  fetchPlatformList,
  fetchAnchorGroupTypeList,
  fetchAnchorRecords
} from "@/api/nameson/services/basicData/anchorGroup";
import type {AnchorGroupVO, AnchorEntryVO, AnchorItemVO} from "@/api/nameson/services/basicData/anchorGroup";
import {Icon} from "@/nameson/components/Icon";
import BatchSearchDialog from "@/components/BatchSearchInput/BatchSearchDialog.vue";
import AnchorDialog from './dialogs/anchorDialog.vue'

defineOptions({
  objectName: 'VUE_JJZ_ANCHOR_GROUP'
})

// 创建StdForm单例
const stdForm = useStdForm()
stdForm.toolbar.print = false
stdForm.toolbar.audit = false
stdForm.toolbar.submit = false
stdForm.toolbar.cancel = false

// 设置表单原数据
useSetupStdFormMeta(stdForm)

const batchInsertVisible = ref(false)
const anchorDialogRef = ref<InstanceType<typeof AnchorDialog>>()
const anchorGroupTypeRef = ref<InstanceType<typeof RemoteSelect>>()
const anchorEntriesTableRef = ref<InstanceType<typeof AnchorEntriesTable>>()
// ref响应值管理器
const [form, formManager] = useRefManager<AnchorGroupVO>(() => ({
  TMPLTY: 'ANCHOR_SUPERVISOR',
}))
const [anchorList, anchorListManager] = useArrayRefManager<AnchorEntryVO>([])
// 设置Ref
anchorListManager.setRef(anchorEntriesTableRef)

// 设置规则
formManager.setRules(formRules)
anchorListManager.setRules(anchorEntriesRules)

// 单据加载器
const anchorLoader = async (params) => {
  const res = await fetchAnchorGroupList({
    ...params
  })

  const anchorInfo = res.data[0] as unknown as any
  // 没状态无法编辑（绕过校验）
  anchorInfo.STFG = 'BL_D'

  return anchorInfo
}
// 明细加载器
const anchorEntriesLoader = async (params) => {
  const res = await fetchAnchorEntryList({
    ...params
  })

  const entries = res.data as unknown as any

  return entries
}

formRelation.manager = formManager
formRelation.sqlQuery = (params) => {
  return {
    loader: anchorLoader,
    params: Object.keys(params).reduce((pre, key) => {
      pre[`A.${key}`] = params[key]
      return pre
    }, {}),
  }
}

anchorEntriesRelation.parentId = formRelation.id
anchorEntriesRelation.manager = anchorListManager
anchorEntriesRelation.sqlQuery = (item: AnchorGroupVO) => {
  return {
    loader: anchorEntriesLoader,
    params: {
      'A.TMPLNO': item.TMPLNO
    },
  }
}

// 注册关系
stdForm.relationRegister.register(formRelation)
stdForm.relationRegister.register(anchorEntriesRelation)

stdForm.onInitDone(async () => {
  if (form.value.TSEQ) {
    await anchorGroupTypeRef.value?.load()
  }
})

stdForm.onBeforeSubmit(async () => {
  return true
})

const anchorRowInitializer = (row: AnchorEntryVO, utils) => {
  if (!form.value.TSEQ) throw new Error('单据异常请重新创建')
  row.TMPLTY = form.value.TMPLTY
  row.TMPLNO = form.value.TMPLNO
  row.SORTBY = utils.getMax('SORTBY') + 1
  return row
}

const addRow = async (anchorRecords: AnchorItemVO[]) => {
  const records = anchorEntriesTableRef.value?.getTableData().visibleData as AnchorEntryVO[]
  for (const anchor of anchorRecords) {
    //去重
    if (records.some((record) => record.DTLNO === anchor.TMPLNO)) {
      continue
    }
    const newRow = {
      DTLNO: anchor.TMPLNO,
      V_ANCHOR_NAME: anchor.CNAME,
      V_PLATFORM: anchor.REF1,
    } as unknown as AnchorEntryVO
    await anchorEntriesTableRef.value?.addRow(newRow)
  }
}

const handleBatchInsertOpen = () => {
  if (stdForm.readonly) return
  batchInsertVisible.value = true
}

const handleBatchInsertConfirm = async (val) => {
  stdForm.loading = true
  try {
    const anchorRecords = await batchSearchAnchor(val)
    await addRow(anchorRecords)
  } catch
      (e) {
    console.error(e)
  }
  stdForm.loading = false
}

const handleAnchorSelectConfirm = (anchorRecords: AnchorItemVO[]) => {
  addRow(anchorRecords)
}

const handleSelectAnchor = () => {
  if (stdForm.readonly) return
  anchorDialogRef.value.open()
}

const batchSearchAnchor = async (anchorIdList: string[]) => {
  return await fetchAnchorRecords({
    'TMPLNO__in': anchorIdList,
    'REF1': form.value.REF1
  })
}
</script>
