<template>
  <ParamsForm
    ref="paramsFormRef"
    :object-name="objectName"
    :title="t('ttCartonTapePrint', '纸箱胶带列印')"
    width="300px"
    height="120px"
    lock-view
    :manager="queryParamsManager"
  >
    <template #search="{ onPrint, onReset, onClose }">
      <div class="flex">
        <FieldItem class="w-[100%]" :label="t('lbOrdno', '单号')" :width="28">
          <el-input v-model="queryParams.p_ordno" />
        </FieldItem>
      </div>

      <div class="flex justify-between mt-3">
        <el-button type="primary" size="small" @click="onPrint">
          {{ c('打印', 'common.print') }}
        </el-button>
        <el-button type="primary" size="small" @click="onReset">
          {{ c('重置', 'common.reset') }}
        </el-button>
        <el-button size="small" @click="onClose">
          {{ c('关闭', 'common.close') }}
        </el-button>
      </div>
    </template>
  </ParamsForm>
</template>
<script setup lang="ts" root>
import ParamsForm from './index.vue'
import { useRefManager } from '@/hooks/nameson/useRefManager'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { ref } from 'vue'
import { getResizeModelExposeProxy } from '@/utils'

defineOptions({
  objectName: 'VUE_CLNTSEARCH1'
})

const objectName = 'VUE_CLNTSEARCH1'
const { t, c } = useI18nProxy(objectName)
const paramsFormRef = ref(null)
// 过滤参数
const [queryParams, queryParamsManager] = useRefManager(() => {
  return {
    p_ordno: ''
  }
})

// 暴露给父组件调用
defineExpose(getResizeModelExposeProxy(paramsFormRef))
</script>
