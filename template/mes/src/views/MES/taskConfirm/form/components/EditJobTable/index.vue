<template>
  <EditableTable
    ref="tableRef"
    :data="props.data"
    :columns="columns"
    :editRules="editRules"
    footer
    :checkboxConfig="checkboxConfig"
    :treeConfig="treeConfig"
    :menuItem="menuItem"
    v-bind="attrs"
    height="280px"
  ></EditableTable>
</template>

<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import type { VxeGridPropTypes } from 'vxe-table'
import { getEditableTableExposeProxy } from '@/utils'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { EditableTableInstance } from '@/components/EditableTable/types'
import dayjs from 'dayjs'

const attrs = useAttrs()
const stdForm = useStdForm()

const { t } = useStdFormI18n()

const tableRef = ref<any>()

const emits = defineEmits(['calc'])

const props = defineProps<{ data: Partial<any>[] }>()

const menuItem = [
  () => {
    return {
      code: 'removeRow',
      visibleMethod: (row) => {
        return !!row.parentId
      }
    }
  }
]

const editRules = {
  BEGDT: [{ required: true, message: '' }],
  ENDDT: [{ required: true, message: '' }]
}

const treeConfig = {
  transform: true,
  showLine: true,
  expandAll: true,
  rowField: 'JOBSEQ'
}

const checkboxConfig = {
  checkStrictly: true,
  visibleMethod: ({ row }) => !row.parentId
}

const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'checkbox', align: 'center', width: 30, fixed: 'left' },
    // { type: 'seq', align: 'center', width: 40, fixed: 'left' },
    {
      title: t('gvPSTASKJOB_JOBSEQ', '序号'),
      field: 'JOBSEQ',
      width: 70,
      align: 'center',
      treeNode: true
    },
    {
      title: t('gvPSTASKJOB_CLNAME', '颜色'),
      field: 'CLNAME',
      width: 150,
      align: 'center'
    },
    // {
    //   title: t('gvPSTASKJOB_V_ORIGINNAME', '工业区'),
    //   field: 'V_ORIGINNAME',
    //   width: 100,
    //   align: 'center'
    // },
    // {
    //   title: t('gvPSTASKJOB_V_FTYNAME', '工厂'),
    //   field: 'V_FTYNAME',
    //   width: 100,
    //   align: 'center'
    // },
    {
      title: t('gvPSTASKJOB_V_WCNAME', '产线'),
      field: 'V_WCNAME',
      width: 120,
      align: 'center'
    },
    {
      title: t('gvPSTASKJOB_V_JOBNAME', '工序'),
      field: 'V_JOBNAME',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvPSTASKJOB_STFG', '状态'),
      field: 'STFG',
      width: 60,
      align: 'center',
      cellRender: {
        name: 'RemoteSelect',
        attrs: {
          sql() {
            return (
              stdForm.sqlMap['状态查询语句'].DBQUERY +
              ' ' +
              stdForm.sqlMap['状态查询语句'].SORTBYCONTENT
            )
          },
          noEmpty: true,
          cacheId: '@@EXSTFG-001',
          contentKey: 'V_STFGNAME',
          valueMappings: ['V_STFGNAME:CNAME', () => ['STDT', dayjs().format('YYYY-MM-DD HH:mm:ss')]]
        }
      }
    },
    {
      title: t('gvPSTASKJOB_BEGDT', '计划开工日期'),
      field: 'BEGDT',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeDatePicker', props: { editable: false } },
      formatter: 'date'
    },
    {
      title: t('gvPSTASKJOB_ENDDT', '计划完工日期'),
      field: 'ENDDT',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeDatePicker', props: { editable: false } },
      formatter: 'date'
    },
    {
      title: t('gvPSTASKJOB_QTY', '计划数量'),
      field: 'QTY',
      width: 80,
      align: 'right',
      formatter: 'number',
      summary: true
    },
    {
      title: t('gvPSTASKJOB_V_PRDQTY', '已完成数'),
      field: 'V_PRDQTY',
      width: 80,
      align: 'right',
      formatter: 'number',
      summary: true
    },
    {
      title: t('gvPSTASKJOB_HSQTY', '可调整数'),
      field: 'HSQTY',
      width: 80,
      align: 'right',
      editRender: { name: 'NSNumberInput' },
      summary: true
    },
    {
      title: t('gvPSTASKJOB_EDIT_QTY', '调整数量'),
      field: 'EDIT_QTY',
      width: 80,
      align: 'right',
      editRender: { name: 'NSNumberInput' },
      summary: true
    },
    {
      title: t('gvPSTASKJOB_RMK', '备注'),
      field: 'RMK',
      minWidth: 100,
      editRender: { name: 'NSInput' },
      align: 'left',
      headerAlign: 'center'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef) as EditableTableInstance)
</script>

<style lang="scss">
.light-blue {
  background-color: #b2d0ff !important;
}
</style>
