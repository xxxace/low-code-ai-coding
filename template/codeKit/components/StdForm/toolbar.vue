<template>
  <div class="ace-toolbar">
    <template v-for="(buttons, side) of renderButtons" :key="side">
      <div :class="[(side as unknown as string) === 'left' ? 'justify-start flex-1' : 'justify-end']">
        <template v-for="(group, index) in buttons" :key="index">
          <el-divider v-if="(side as unknown as string) === 'right'" direction="vertical" style="margin: 0 1px"/>
          <template v-for="button in group" :key="button.name">
            <template v-if="button.visible ? button.visible() : true">
              <el-button
                  class="px-[6px]!"
                  size="small"
                  text
                  :type="button.type"
                  v-permission="button.perm"
                  :disabled="(button.isDisabled ? button.isDisabled() : false) || stdForm.loading"
                  @click="handleClick(button)"
              >
                <template v-if="button.icon" #icon>
                  <Icon :icon="button.icon"/>
                </template>
                <span>{{ button.name }}</span>
              </el-button>
            </template>
          </template>
          <el-divider v-if="(side as unknown as string) === 'left'" direction="vertical" style="margin: 0 1px"/>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {Icon} from '../../components/Icon'
import {useStdForm} from './composeble/useStdForm'
import {StdFormAction, ToolbarAction} from './types/store'
import {useI18nReactive} from '../../hooks/useI18nReactive'
import {OrderStatus} from './types/stdForm'
import cloneDeep from 'lodash/cloneDeep'

export interface ToolbarButton {
  name: string
  action: ToolbarAction | string
  icon?: string
  perm: ('ADD' | 'AUD' | 'DEL' | 'QRY' | 'UPD')[]
  needLoading?: boolean
  isDisabled?: () => boolean
  visible?: () => boolean
  type?: 'primary' | 'success' | 'warning' | 'danger'
}

const props = defineProps<{
  editabled?: boolean
  buttons?: ToolbarButton[]
}>()

const emits = defineEmits<{ action: [action: ToolbarAction | string] }>()
const stdForm = useStdForm()
const actionConfig = useI18nReactive<{
  left: ToolbarButton[][]
  right: ToolbarButton[][]
}>(({c}) => {
  return {
    left: [
      [
        {
          name: c('toolbar.add', '新增'),
          action: ToolbarAction.ADD,
          icon: 'vi-ep:document-add',
          perm: ['ADD'],
          isDisabled: () => {
            return stdForm.actionType === StdFormAction.ADD ||
                stdForm.actionType !== StdFormAction.RADEONLY
          },
          visible: () => stdForm.toolbar.add
        },
        {
          name: c('toolbar.edit', '编辑'),
          action: ToolbarAction.EDIT,
          icon: 'vi-ep:edit',
          perm: ['UPD'],
          isDisabled: () => {
            return (
                (stdForm.actionType !== StdFormAction.EDIT && !props.editabled) ||
                stdForm.actionType === StdFormAction.EDIT ||
                stdForm.orderStatus !== OrderStatus.Draft
            )
          },
          visible: () => stdForm.toolbar.edit
        },
        {
          name: c('toolbar.del', '删除'),
          action: ToolbarAction.DELETE,
          icon: 'vi-ep:delete',
          perm: ['DEL'],
          type: 'danger',
          isDisabled: () =>
              !props.editabled ||
              stdForm.actionType === StdFormAction.EDIT ||
              stdForm.orderStatus !== OrderStatus.Draft,
          visible: () => stdForm.toolbar.delete
        },
        {
          name: c('toolbar.save', '保存'),
          action: ToolbarAction.SAVE,
          icon: 'vi-oui:save',
          needLoading: true,
          perm: ['ADD', 'UPD'],
          isDisabled: () => stdForm.actionType === StdFormAction.RADEONLY,
          visible: () => stdForm.toolbar.save
        }
      ],
      [
        {
          name: c('toolbar.rollback', '回滚'),
          action: ToolbarAction.ROLLBACK,
          icon: 'vi-tdesign:rollback',
          perm: ['ADD', 'UPD'],
          isDisabled: () =>
              stdForm.actionType !== StdFormAction.ADD && stdForm.actionType !== StdFormAction.EDIT,
          visible: () => stdForm.toolbar.rollback
        }
      ],
      [
        {
          name: c('toolbar.print', '打印'),
          action: ToolbarAction.PRINT,
          icon: 'vi-ep:printer',
          perm: [],
          isDisabled: () => !props.editabled || !stdForm.meta.reportUrl,
          visible: () => stdForm.toolbar.print
        }
        // {
        //   name: c('报表', 'toolbar.report'),
        //   action: ToolbarAction.REPORT,
        //   icon: 'vi-ep:data-analysis',
        //   perm: [],
        //   isDisabled: () => !props.editabled
        // }
      ]
    ],
    right: [
      [
        {
          name: c('toolbar.draft', '草拟'),
          action: ToolbarAction.DRAFT,
          icon: 'vi-material-symbols:draft-outline-sharp',
          perm: ['AUD'],
          visible: () =>
              stdForm.toolbar.draft &&
              (stdForm.orderStatus === OrderStatus.Archived ||
                  stdForm.orderStatus === OrderStatus.Submitted ||
                  stdForm.orderStatus === OrderStatus.Approved ||
                  stdForm.orderStatus === OrderStatus.Cancel)
        },
        {
          name: c('toolbar.submit', '提交'),
          action: ToolbarAction.SUBMIT,
          icon: 'vi-ep:stamp',
          perm: ['ADD', 'UPD', 'AUD'],
          isDisabled: () => !props.editabled || stdForm.actionType !== StdFormAction.RADEONLY,
          visible: () => stdForm.toolbar.submit && stdForm.orderStatus === OrderStatus.Draft
        },
        {
          name: c('toolbar.audit', '批核'),
          action: ToolbarAction.AUDIT,
          icon: 'vi-ep:stamp',
          perm: ['AUD'],
          isDisabled: () =>
              !props.editabled ||
              stdForm.actionType !== StdFormAction.RADEONLY ||
              stdForm.orderStatus === OrderStatus.Approved ||
              stdForm.orderStatus === OrderStatus.Finished,
          visible: () =>
              stdForm.toolbar.audit &&
              (stdForm.orderStatus === OrderStatus.Submitted ||
                  (!stdForm.toolbar.submit && stdForm.orderStatus === OrderStatus.Draft))
        },
        {
          name: c('toolbar.finish', '完成'),
          action: ToolbarAction.FINISH,
          icon: 'vi-carbon:document-requirements',
          perm: ['AUD'],
          isDisabled: () => stdForm.orderStatus !== OrderStatus.Approved,
          visible: () => stdForm.toolbar.finish && stdForm.orderStatus === OrderStatus.Approved
        },
        {
          name: c('toolbar.archive', '归档'),
          action: ToolbarAction.ARCHIVE,
          icon: 'vi-iconoir:archive',
          perm: ['AUD'],
          isDisabled: () => stdForm.orderStatus !== OrderStatus.Finished,
          visible: () => stdForm.toolbar.archive && stdForm.orderStatus === OrderStatus.Finished
        },
        // {
        //   name: c('反批核', 'toolbar.disaudit'),
        //   action: ToolbarAction.DISAUDIT,
        //   icon: 'vi-tabler:rubber-stamp-off',
        //   perm: ['AUD'],
        //   type: 'danger',
        //   isDisabled: () => stdForm.orderStatus !== OrderStatus.Approved,
        //   visible: () => stdForm.orderStatus === OrderStatus.Approved
        // },
        {
          name: c('toolbar.cancel', '取消'),
          action: ToolbarAction.CANCEL,
          icon: 'vi-mdi:file-remove-outline',
          perm: ['ADD', 'UPD', 'AUD'],
          type: 'danger',
          isDisabled: () => stdForm.actionType !== StdFormAction.RADEONLY,
          visible: () =>
              stdForm.toolbar.cancel &&
              (stdForm.orderStatus === OrderStatus.Draft ||
                  stdForm.orderStatus === OrderStatus.Approved)
        }
      ]
    ]
  }
})

const renderButtons = computed(() => {
  const configButtons = cloneDeep(actionConfig)
  if (props.buttons && props.buttons.length > 0) {
    configButtons.left.push(props.buttons)
  }

  return configButtons
})

const handleClick = (button: ToolbarButton) => {
  emits('action', button.action)
}
</script>

<style lang="scss" scoped>
.el-divider--horizontal {
  margin: 8px 0;
}

.ace-toolbar {
  position: sticky;
  top: 0;
  display: flex;
  padding: 4px 8px;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0;
  z-index: 20;
  background-color: var(--el-bg-color);

  .el-button {
    --el-fill-color-light: #d0d5db;
    font-size: 14px;
    font-weight: 500;
  }

  // .el-button:not(.is-disabled) {
  //   color: #000;
  // }

  .el-button + .el-button {
    margin-left: 0px;
  }
}
</style>
