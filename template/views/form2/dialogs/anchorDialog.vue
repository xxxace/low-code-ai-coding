<template>
  <DialogPicker
      ref="dialogPickerRef"
      :title="`选择达人-${props.platform}`"
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
      <div class="mt-2">
        <FieldItem label="达人ID" :width="50">
          <el-input class="w-[120px]!" v-model="queryParams['TMPLNO__like']"/>
        </FieldItem>

        <FieldItem label="达人名称" :width="56">
          <el-input class="w-[190px]!" v-model="queryParams['CNAME__like']"/>
        </FieldItem>

        <FieldItem class="align-bottom">
          <el-button type="primary" size="small" @click="() => handleSearch(onSearch)"
          >查询
          </el-button>
          <el-button size="small" @click="onReset">重置</el-button>
        </FieldItem>
      </div>
    </template>
  </DialogPicker>
</template>
<script setup lang="ts">
import {useAttrs} from 'vue'
import DialogPicker from '@/nameson/components/DialogPicker/index.vue'
import FieldItem from '@/nameson/components/FieldItem/index.vue'
import {useParamsRefManager} from '@/hooks/nameson/useRefManager'
import type {VxeGridPropTypes} from 'vxe-table'
import {ref} from 'vue'
import {getResizeModelExposeProxy} from '@/nameson/utils'
import {type AnchorItemVO, fetchAnchorRecords} from "@/api/nameson/services/basicData/anchorGroup";

const attrs = useAttrs()
const emit = defineEmits(['confirm'])
const props = defineProps<{
  platform: string
}>()

const dialogPickerRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    ['CODE__like']: '',
    ['CNAME__like']: ''
  }
})

// 列配置
const columns: VxeGridPropTypes.Columns<AnchorItemVO> = [
  {type: 'seq', width: 50},
  {field: 'TMPLNO', title: '编码', width: 100},
  {field: 'CNAME', title: '名称'}
]
// 查询语句
const dataLoader = async (params?: Record<string, any>) => {
  return fetchAnchorRecords({
    ...params,
    REF1: props.platform
  })
}

const handleConfirm = (row: any) => emit('confirm', row)

const handleSearch = (onSearch: () => void) => {
  onSearch()
}
// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(dialogPickerRef))
</script>
