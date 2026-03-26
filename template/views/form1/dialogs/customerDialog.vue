<template>
  <DialogPicker
      ref="dialogPickerRef"
      :title="t('ttCustomerQuery', '客户查询')"
      width="580px"
      height="600px"
      mode="confirm"
      lock-view
      footer
      v-bind="attrs"
      :columns="columns"
      :manager="queryParamsManager"
      :loader="dataLoader"
      @confirm="handleConfirm"
  >
    <template #search="{ onSearch, onReset }">
      <FieldItem :label="t('lbCLNT', '编码')" :width="28">
        <el-input class="w-[120px]!" v-model="queryParams['A.CODE__like']"/>
      </FieldItem>

      <FieldItem :label="t('lbV_CLNTNAME', '名称')" :width="28">
        <el-input class="w-[120px]!" v-model="queryParams['A.CNAME__like']"/>
      </FieldItem>

      <FieldItem class="align-bottom">
        <el-button type="primary" size="small" @click="() => handleSearch(onSearch)"
        >{{ c('common.search', '查询') }}
        </el-button>
        <el-button size="small" @click="onReset">{{ c('common.reset', '重置') }}</el-button>
      </FieldItem>
    </template>
  </DialogPicker>
</template>
<script setup lang="ts">
import {useAttrs} from 'vue'
import DialogPicker from '@/components/Nameson/Dialog/DialogPicker.vue'
import {useParamsRefManager} from '@/hooks/useRefManager'
import {VxeGridPropTypes} from 'vxe-table'
import {useNsI18n} from "@/hooks/useNsI18n";
import {useNsI18nColumns} from "@/hooks/useNsI18nColumns";
import {ref} from 'vue'
import {getResizeModelExposeProxy} from '@/utils/util'
import {getCustomerList} from "@/api/modules/nameson/inquiryOrder";

const attrs = useAttrs()
const emit = defineEmits(['confirm'])

const {t, c} = useNsI18n('VUE_INQUIRY')
const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    ['A.CODE__like']: '',
    ['A.CNAME__like']: ''
  }
})

// 列配置
const columns = useNsI18nColumns<VxeGridPropTypes.Columns<any>>({
  scope: '',
  columns: [
    {type: 'seq', width: 50},
    {field: 'CODE', title: '编码', i18nKey: 'lbCLNT', width: 100},
    {field: 'CNAME', title: '名称', i18nKey: 'lbV_CLNTNAME'}
  ]
})
// 查询语句
const dataLoader = async (params?: Record<string, any>) => {
  return getCustomerList({
    where: params
  })
}

const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  onSearch()
}
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
