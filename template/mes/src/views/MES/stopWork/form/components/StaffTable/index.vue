<template>
  <EditableTable
    ref="tableRef"
    :data="props.data"
    :columns="columns"
    :editRules="editRules"
    v-bind="attrs"
    height="348px"
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
import type { EXREQLSTItemDTO } from '$types/views/MES/stopWork'
import type { EditableTableInstance } from '@/components/EditableTable/types'

const attrs = useAttrs()
const stdForm = useStdForm()

const { t } = useStdFormI18n()

const tableRef = ref<any>()

const emits = defineEmits(['calc'])

const props = defineProps<{ data: Partial<EXREQLSTItemDTO>[] }>()

const editRules = {
  QTY2: [{ required: true, message: '' }]
}

const columns = useI18nReactive<VxeGridPropTypes.Column<EXREQLSTItemDTO>[]>(() => {
  return [
    { type: 'checkbox', align: 'center', width: 30, fixed: 'left' },
    { type: 'seq', align: 'center', width: 40, fixed: 'left' },
    {
      title: t('gvLevarList_WCSEQ', '产线编码'),
      field: 'WCSEQ',
      width: 80,
      align: 'center'
    },
    {
      title: t('gvLevarList_V_WCNAME', '产线名称'),
      field: 'V_WCNAME',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvLevarList_POSTNO', '职位编码'),
      field: 'POSTNO',
      width: 80,
      align: 'center'
    },
    {
      title: t('gvLevarList_V_POSTNAME', '职位名称'),
      field: 'V_POSTNAME',
      width: 80,
      align: 'center'
    },
    {
      title: t('gvLevarList_EMPNO', '工号'),
      field: 'EMPNO',
      width: 80,
      align: 'center'
    },
    {
      title: t('gvLevarList_V_EMPNAME', '姓名'),
      field: 'V_EMPNAME',
      width: 80,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvLevarList_BEGDT', '放假起始'),
      field: 'BEGDT',
      width: 140,
      align: 'center',
      formatter: ['datetime', 'YYYY-MM-DD HH:mm']
      // editRender: { name: 'VxeDatePicker', props: { type: 'datetime' } }
    },
    {
      title: t('gvLevarList_ENDDT', '放假结束'),
      field: 'ENDDT',
      width: 140,
      align: 'center',
      formatter: ['datetime', 'YYYY-MM-DD HH:mm']
      // editRender: { name: 'NSNumberInput' }
    },
    {
      title: t('gvLevarList_HRST', '放假时数'),
      field: 'HRS',
      width: 60,
      align: 'right',
      formatter: 'number'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef) as EditableTableInstance<EXREQLSTItemDTO>)
</script>

<style lang="scss">
.light-blue {
  background-color: #b2d0ff !important;
}
</style>
