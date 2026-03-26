<template>
  <vxe-select
    class="bill-status-select"
    v-model="modelValue"
    placeholder="请选择"
    size="mini"
    disabled
    v-bind="attrs"
    :loading="loading"
    :class-name="getClassName"
  >
    <vxe-option v-for="opt in options" :key="opt.CODE" :value="opt.CODE" :label="opt.CNAME" />
  </vxe-select>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue'
import { searchList } from '@/api/nameson'
import { useRequestCache } from '@/hooks/nameson/useRequestCache'
import { useFetchSqlByRouteAsync } from '@/hooks/nameson/useFetchSql'

const props = defineProps({
  status: String
})

const attrs = useAttrs()

const modelValue = computed(() => props.status)

const { loading, response: options } = useRequestCache<{ CODE: string; CNAME: string }[] | null>(
  'billStatus',
  async () => {
    const remoteSqlMap = await useFetchSqlByRouteAsync()
    console.log(remoteSqlMap)
    const list = await searchList<{ CODE: string; CNAME: string }[]>({
      sql: remoteSqlMap['状态的下拉的查询语句'].DBQUERY,
      params: {},
      sortby: remoteSqlMap['状态的下拉的查询语句'].SORTBYCONTENT
    })

    return list && list.length ? list : (null as any)
  }
)

const getClassName = (e) => {
  switch (modelValue.value) {
    case 'BL_S':
      return 'text-blue'
    case 'BL_A':
      return 'text-red'
  }
}
</script>

<style lang="scss" scoped>
.bill-status-select {
  :deep(.vxe-input .vxe-input--suffix) {
    display: none;
  }

  &.text-blue {
    :deep(.vxe-input .vxe-input--wrapper) {
      .vxe-input--inner {
        color: blue !important;
      }

      .vxe-input--inner[disabled] {
        color: blue !important;
      }
    }
  }

  &.text-red {
    :deep(.vxe-input .vxe-input--wrapper) {
      .vxe-input--inner {
        color: red !important;
      }

      .vxe-input--inner[disabled] {
        color: red !important;
      }
    }
  }
}
</style>

<style>
.vxe-table.vxe-table--render-default.size--mini .vxe-cell .vxe-input,
.vxe-grid.size--mini .vxe-cell .bill-status-select .vxe-input {
  height: 24px !important;
}
</style>
