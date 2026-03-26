<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data" v-bind="attrs">
    <template #PLNNO="{ row }">
      <el-button v-if="row.PLNNO" size="small" type="primary" link style="color: #007bff;padding: 0"
                 @click="() => toEditForm(row)">{{
          row.PLNNO
        }}
      </el-button>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import {ref, useAttrs, h} from 'vue'
import {getEditableTableExposeProxy} from '@/utils/util'
import {useNsI18nColumns} from "@/hooks/useNsI18nColumns";

const attrs = useAttrs()
const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = useNsI18nColumns({
  scope: '',
  columns: [
    {title: '#', type: 'seq', align: 'center', width: '60px', fixed: 'left'},
    {
      field: 'PLNNO',
      title: '单号',
      i18nKey: 'lbPLNNO',
      width: 90,
      fixed: 'left',
      slots: {default: 'PLNNO'}
    }, {
      field: 'V_BLTYNAME',
      title: '单类',
      i18nKey: 'lbV_BLTYNAME',
      width: 60,
      align: 'center',
      fixed: 'left',
    }, {
      field: 'CLNT',
      title: '客户',
      i18nKey: 'lbCLNT',
      width: 60,
      fixed: 'left'
    }, {
      field: 'V_CLNTNAME',
      title: '客户名称',
      i18nKey: 'lbV_CLNTNAME',
      width: 160,
      fixed: 'left'
    }, {
      field: 'STYNO',
      title: '款号',
      i18nKey: 'lbSTYNO',
      width: 100
    }, {
      field: 'V_JOBNAME',
      title: '工序',
      i18nKey: 'lbV_JOBNAME',
      width: 80
    }, {
      field: 'WKHRS',
      title: '织工',
      i18nKey: 'lbWKHRS',
      width: 50,
      align: 'right'
    }, {
      field: 'WKHRS_FP',
      title: '缝工',
      i18nKey: 'lbWKHRS_FP',
      width: 50,
      align: 'right'
    }, {
      field: 'WKHRS_TZ',
      title: '挑工(分钟/件)',
      i18nKey: 'lbWKHRS_TZ',
      width: 90,
      align: 'right'
    }, {
      field: 'QTY',
      title: '数量',
      i18nKey: 'lbQTY',
      width: 80,
      align: 'right'
    }, {
      field: 'BEGFR',
      title: '预计开机',
      i18nKey: 'lbBEGFR',
      width: 80,
      align: 'center',
      formatter: 'date'
    }, {
      field: 'ENDTO',
      title: '预计货期',
      i18nKey: 'lbENDTO',
      width: 80,
      align: 'center',
      formatter: 'date'
    }, {
      field: 'REPLYDT',
      title: '复单期限',
      i18nKey: 'lbREPLYDT',
      width: 80,
      align: 'center',
      formatter: 'date'
    }, {
      field: 'EQMCAT',
      title: '针种',
      i18nKey: 'lbEQMCAT',
      width: 60
    }, {
      field: 'V_EQMNAME',
      title: '电脑机',
      i18nKey: 'lbV_EQMNAME',
      width: 110
    }, {
      field: 'V_FTYNAME',
      title: '工厂名称',
      i18nKey: 'lbV_FTYNAME',
      width: 120,
      align: 'center'
    }, {
      field: 'RMK',
      title: '备注',
      i18nKey: 'lbRMK',
      width: 160
    }, {
      field: 'V_STFGNAME',
      title: '单据状态',
      i18nKey: 'lbV_STFGNAME',
      width: 90
    }
  ]
})

const toEditForm = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
