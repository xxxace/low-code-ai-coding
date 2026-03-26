<template>
  <div class="h-full flex flex-col">
    <div class="mb-1">
      <el-button size="small" type="primary" @click="onConfirm">确认</el-button>
    </div>
    <EditableTable
      ref="tableRef"
      class="h-full"
      :columns="columns"
      :data="props.data"
      :toolBar="false"
      footer
      v-bind="attrs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { useNsI18nColumns } from '@/hooks/nameson/useNsI18nColumns'
import { fetchFtyOptions } from '../api'

const attrs = useAttrs()
const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const emits = defineEmits(['confirm'])

const tableRef = ref<any>()
const columns = useNsI18nColumns<any>({
  scope: 'VUE_MES_POFTY',
  columns: [
    { title: '#', type: 'seq', align: 'center', width: '60px', fixed: 'left' },
    {
      field: 'BILLNO',
      title: '客PO',
      i18nKey: 'lbBILLNO',
      width: 220
    },
    {
      field: 'FTYNO',
      title: '工厂编码',
      i18nKey: 'lbFTYNO',
      width: 90,
      headerClassName: 'editable-col',
      cellRender: {
        name: 'RemoteSelectV2',
        attrs: {
          dataLoader: fetchFtyOptions,
          noEmpty: true,
          search: true,
          valueKey: 'FTYNO',
          labelKey: 'FTYNO',
          labelParttern: '{FTYNO} {FTYNAME}',
          searchKey: 'FTYNO,FTYNAME',
          valueMappings: ['FTYNAME']
        }
      }
    },
    {
      field: 'FTYNAME',
      title: '工厂名称',
      i18nKey: 'lbFTYNAME',
      width: 180
    },
    {
      field: 'QTY',
      title: '数量',
      i18nKey: 'lbQTY',
      width: 110,
      align: 'right',
      formatter: 'number',
      summary: true
    }
    // ,
    // {
    //   field: 'STFG',
    //   title: '状态',
    //   i18nKey: 'lbSTFG',
    //   width: 110,
    //   align: 'center'
    // }
  ]
})

const onConfirm = () => {
  emits('confirm')
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>

<style lang="scss">
.editable-col {
  background-color: #d7e4ff;

  .vxe-cell .vxe-cell--title,
  .vxe-cell--title {
    color: blue !important;
  }
}
</style>
