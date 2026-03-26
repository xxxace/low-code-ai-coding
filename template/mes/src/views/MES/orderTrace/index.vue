<template>
  <div class="view-container p-1 h-full box-border relative overflow-hidden">
    <div class="flex flex-row gap-2 w-full h-full overflow-hidden absolute top-0 left-0">
      <TracePanel class="w-[540px]" @sub-item-click="handleSubItemClick" />
      <SearchList v-if="currentType === '1'" ref="searchListRef" class="flex-1 bg-white" />
      <ColorSearchList v-if="currentType === '2'" ref="searchListRef" class="flex-1 bg-white" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import TracePanel from './tracePanel/index.vue'
import type { Order, OrderColorItem, OrderStep } from './tracePanel/index.vue'
import SearchList from './searchList/index.vue'
import ColorSearchList from './colorSearchList/index.vue'
import type { ProcessJobVO } from '$types/views/MES/orderTrac'
import { setupParentScope } from '@/hooks/nameson/useParentScope'

setupParentScope('orderTrace')

const searchListRef = ref<InstanceType<typeof SearchList>>()
const currentSubItem = ref<any>({})
const currentType = ref<string>('')

const handleSubItemClick = async (type: string, data: any) => {
  currentType.value = type
  if (type === '1') {
    const { root, color, ord, item } = data
    await handleType1(root, color, ord, item)
  } else if (type === '2') {
    const { color } = data
    await handleType2(color)
  }
}

const handleType1 = async (
  root: Order,
  color: OrderColorItem,
  ord: OrderStep,
  item: ProcessJobVO
) => {
  currentSubItem.value = { ...root, color, ord, item }

  await nextTick()
  setTimeout(() => {
    searchListRef.value?.updateQueryParams((query) => {
      query.value.ORDNO = root.ORDNO
      query.value.CLSEQ = Number(color.CCL)
      query.value.PMNO = item.PMNO
      query.value.JOBNO = item.JOBNO
      query.value.JOBNAME = item.CNAME
      query.value.MIN_P = item.MIN_TKTSEQ
      query.value.MAX_P = item.MAX_TKTSEQ
      query.value.MIN_J = item.MIN_LABSEQ
      query.value.MAX_J = item.MAX_LABSEQ

      query.value.ORDSEQ = root.ORDSEQ
      query.value.CLSEQ = color.CLSEQ
      query.value.PMSEQ = ord.PMSEQ
    })
  }, 50)
}

const handleType2 = async (color: OrderColorItem) => {
  currentSubItem.value = { color }

  await nextTick()
  setTimeout(() => {
    searchListRef.value?.updateQueryParams((query) => {
      query.value.ORDSEQ = color.ORDSEQ
      query.value.CLSEQ = color.CLSEQ
    })
  }, 50)
}
</script>
<style scoped></style>
