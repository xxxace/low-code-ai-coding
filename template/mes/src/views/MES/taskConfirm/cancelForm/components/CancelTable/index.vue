<template>
  <EditableTable
    ref="tableRef"
    :data="props.data"
    :columns="columns"
    :editRules="editRules"
    footer
    v-bind="attrs"
    height="280px"
  >
    <template #MATCLASS="{ row }">
      <div style="display: flex; align-items: center; justify-content: center; height: 24px">
        <Icon v-if="row.MATCLASS === 6" icon="vi-ep:select" style="color: #00cd19" />
      </div>
    </template>
    <template #ITEMNAME="{ row }">
      <span>
        {{ row.ITEMNAME }}
        <span v-if="row.SPECNAME">-{{ row.SPECNAME }}</span>
      </span>
    </template>
  </EditableTable>
</template>

<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import type { VxeGridPropTypes } from 'vxe-table'
import { toFixedPlus, getEditableTableExposeProxy } from '@/utils'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { Icon } from '@/components/Icon'

const attrs = useAttrs()
const stdForm = useStdForm()

const { t } = useStdFormI18n()

const tableRef = ref<any>()

const emits = defineEmits(['calc'])

const props = defineProps<{ data: Partial<RecipeItemDTO>[] }>()

const editRules = {
  QTY2: [{ required: true, message: '' }]
}

const columns = useI18nReactive<VxeGridPropTypes.Column<RecipeItemDTO>[]>(() => {
  return [
    { type: 'checkbox', align: 'center', width: 30, fixed: 'left' },
    // { type: 'seq', align: 'center', width: 40, fixed: 'left' },
    {
      title: t('gvHOL_INFRASYS_ITEMLSTBOM_SORTBY', '颜色'),
      field: 'SORTBY',
      width: 150,
      align: 'center',
      editRender: { name: 'NSNumberInput' }
    },
    {
      title: t('gvHOL_INFRASYS_ITEMLSTBOM_QTY2', '计划数'),
      field: 'QTY2',
      width: 80,
      align: 'right',
      summary: true,
      editRender: { name: 'NSNumberInput' }
    },
    {
      title: t('gvHOL_INFRASYS_ITEMLSTBOM_QTY2', '已完成数'),
      field: 'QTY2',
      width: 80,
      align: 'right',
      summary: true,
      editRender: { name: 'NSNumberInput' }
    },
    {
      title: t('gvHOL_INFRASYS_ITEMLSTBOM_QTY2', '可取消工数'),
      field: 'QTY2',
      width: 80,
      align: 'right',
      summary: true,
      editRender: { name: 'NSNumberInput' }
    },
    {
      title: t('gvHOL_INFRASYS_ITEMLSTBOM_QTY2', '取消牌号范围'),
      field: 'QTY2',
      width: 100,
      align: 'right',
      summary: true,
      editRender: { name: 'NSNumberInput' }
    },
    {
      title: t('gvHOL_INFRASYS_ITEMLSTBOM_QTY2', '取消数'),
      field: 'QTY2',
      width: 80,
      align: 'right',
      summary: true,
      editRender: { name: 'NSNumberInput' }
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>

<style lang="scss">
.light-blue {
  background-color: #b2d0ff !important;
}
</style>
