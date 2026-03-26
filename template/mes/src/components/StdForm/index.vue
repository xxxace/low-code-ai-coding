<template>
  <div class="view-container bg-white overflow-auto">
    <Toolbar :editabled="isEditabled" :buttons="props.buttons" @action="handleAction" />
    <BaseForm
      v-loading="stdForm.loading"
      element-loading-text="加载中"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    >
      <slot></slot>
    </BaseForm>
    <component v-if="isParamsForm" ref="paramsForm" :is="stdForm.meta.reportUrl" />
  </div>
</template>

<script lang="ts" setup>
import { provide, computed, reactive, ref, watch } from 'vue'
import BaseForm from './baseForm.vue'
import Toolbar from './toolbar.vue'
import { useStdForm } from './composeble/useStdForm'
import { ElMessageBox } from 'element-plus'
import { ChangeStatusParams, StdFormAction, ToolbarAction } from './types/store'
import { stdFormContextKey } from '@/constants/key'
import { initRegister } from './register/initRegister'
import { submitRegister } from './register/submitRegister'
import { deleteRegister } from './register/deleteRegister'
import { resetRegister } from './register/resetRegister'
import { changeStatusRegister } from './register/changeStatusRegister'
import { OrderStatus } from './types/stdForm'
import { ParamsFormInstance } from '../ResizeModal/types'
import { printRegister } from './register/printRegister'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import type { ToolbarButton } from './toolbar.vue'

const props = defineProps<{
  buttons?: ToolbarButton[]
}>()

initRegister()
resetRegister()
submitRegister()
deleteRegister()
changeStatusRegister()
printRegister()

const stdForm = useStdForm()

const { c } = useI18nProxy('')

const paramsForm = ref<ParamsFormInstance>()

const isReadOnly = computed(() => {
  return stdForm.actionType === StdFormAction.RADEONLY
})

const isParamsForm = computed(() => {
  return stdForm.meta.reportUrl && stdForm.meta.reportUrl.indexOf('http') === -1
})

const isEditabled = computed(() => {
  const { relationRegister } = stdForm
  const root = relationRegister.root
  const manager = root?.relation.manager
  if (manager) {
    if (manager.type === 'object') {
      const primaryKey = relationRegister.getPrimaryKey(root.relation)
      return primaryKey && manager.value && manager.old && !!manager.old[primaryKey.field]
    } else {
      return manager.value && manager.old && manager.old.length > 0
    }
  }
  return false
})

const handleAction = async (action: ToolbarAction | string) => {
  const oldActionType = stdForm.actionType
  switch (action) {
    case ToolbarAction.ADD:
      handleAdd()
      break
    case ToolbarAction.EDIT:
      stdForm.actionType = StdFormAction.EDIT
      break
    case ToolbarAction.DELETE:
      stdForm.actionType = StdFormAction.DELETING
      await handleDelete()
      stdForm.actionType = StdFormAction.RADEONLY
      break
    case ToolbarAction.SAVE:
      stdForm.actionType = StdFormAction.SAVING
      // eslint-disable-next-line no-case-declarations
      const isSubmitSuccess = await stdForm.submit()
      if (isSubmitSuccess && isSubmitSuccess[0]) {
        stdForm.actionType = StdFormAction.RADEONLY
      } else {
        stdForm.actionType = oldActionType
      }
      break
    case ToolbarAction.ROLLBACK:
      ElMessageBox.confirm('回滚当前数据，是否继续?', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        draggable: true
      })
        .then(async () => {
          await stdForm.rollback()
        })
        .catch(() => {})
      break
    case ToolbarAction.DRAFT:
      await handleChangeStatus({ status: OrderStatus.Draft })
      break
    case ToolbarAction.SUBMIT:
      await handleChangeStatus({ status: OrderStatus.Submitted })
      break
    case ToolbarAction.AUDIT:
      await handleChangeStatus({ status: OrderStatus.Approved })
      break
    case ToolbarAction.DISAUDIT:
      await handleChangeStatus({ status: OrderStatus.Submitted })
      break
    case ToolbarAction.FINISH:
      await handleChangeStatus({ status: OrderStatus.Finished })
      break
    case ToolbarAction.ARCHIVE:
      await handleChangeStatus({ status: OrderStatus.Archived })
      break
    case ToolbarAction.CANCEL:
      ElMessageBox.prompt('取消原因', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputType: 'textarea'
      }).then(async ({ value }) => {
        await handleChangeStatus({ status: OrderStatus.Cancel, message: value })
      })
      break
    case ToolbarAction.PRINT:
      handlePrint()
      break
    default:
      stdForm.emits.customActionClick(action)
      break
  }
}

const handleAdd = () => {
  const init = () => {
    stdForm.actionType = StdFormAction.ADD
    stdForm.init()
  }
  if (stdForm.actionType !== StdFormAction.RADEONLY) {
    ElMessageBox.confirm('当前单据未保存，是否继续?', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true
    })
      .then(init)
      .catch(() => {})
  } else {
    init()
  }
}

const handleDelete = async () => {
  ElMessageBox.confirm('删除当前单据及其子明细的数据，是否继续?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
    draggable: true
  })
    .then(async () => {
      await stdForm.delete()
    })
    .catch(() => {})
}

const handleChangeStatus = async (params: ChangeStatusParams) => {
  ElMessageBox.confirm(
    `${c(params.status, `status.${params.status}`)}当前数据，是否继续?`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true
    }
  )
    .then(async () => {
      await stdForm.changeStatus(params)
    })
    .catch(() => {})
}

const handlePrint = async () => {
  const reportUrl = stdForm.meta.reportUrl
  try {
    const urlParams = (await stdForm.emits.createURLParams()) as any
    if (reportUrl.indexOf('http') !== -1) {
      stdForm.print(urlParams[0])
    } else {
      paramsForm.value?.open(urlParams[0])
    }
  } catch (e: any) {
    ElMessageBox.alert(`打印异常：${e.message || JSON.stringify(e)}`, 'Error', {
      type: 'error'
    })
  }
}

watch(isReadOnly, () => {
  stdForm.readonly = isReadOnly.value
})
provide(stdFormContextKey, reactive({ disabled: isReadOnly }))
</script>
