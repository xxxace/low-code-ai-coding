<template>
  <ResizeModal
    ref="rmRef"
    v-bind="attrs"
    :before-hide-method="handleBeforeHide"
    @confirm="confirmEvent"
    @hide="handleColse"
  >
    <div v-if="isLoaded" class="flex flex-col h-full vxe-table--ignore-clear">
      <FieldItemGroup :disabled="loading">
        <div class="mb-2 relative">
          <slot name="search" :onSearch="onSearch" :onReset="onReset"></slot>
        </div>
      </FieldItemGroup>

      <div class="flex-1 vxe-table--ignore-clear">
        <EditableTable
          ref="tableRef"
          :columns="computedColumns"
          :data="data"
          :tool-bar="false"
          :loading="loading"
          @cell-dbclick="handleCellDblclick"
        />
      </div>
    </div>
    <div v-else class="flex flex-col h-full vxe-table--ignore-clear" v-loading="true"></div>
  </ResizeModal>
</template>

<script setup lang="ts">
import { useAttrs, ref, computed, watch } from 'vue'
import ResizeModal from '@/components/ResizeModal/index.vue'
import EditableTable from '@/components/EditableTable/index.vue'
import { getResizeModelExposeProxy } from '@/utils'
import FieldItemGroup from '@/components/FieldItemGroup/index.vue'
import useCommonTable from '@/hooks/nameson/useCommonTable'
import type { EditableTableInstance } from '@/components/EditableTable/types'
import type { ResizeModalInstance } from '@/components/ResizeModal/types'
import { RefManager } from '@/hooks/nameson/useRefManager'
import { loadMessageByObjectName } from '@/plugins/vueI18n/lazyLoader'
import { ElMessageBox } from 'element-plus'

export interface DialogPickerProps {
  objectName?: string
  manager: RefManager<any>
  columns: any[]
  sql: string | (() => string)
  sortBy?: string | (() => string)
  multi?: boolean
  autoLoad?: boolean
  closeReset?: boolean
}

const props = defineProps<DialogPickerProps>()

const emit = defineEmits(['confirm'])
const attrs = useAttrs()

const rmRef = ref<ResizeModalInstance>()
const tableRef = ref<EditableTableInstance<any>>()

const isLoaded = ref(false)
const comfirmValueTemp = ref()

const computedColumns = computed(() => {
  const addonColumn = { type: '', width: 30, align: 'center', fixed: 'left' }
  addonColumn.type = props.multi ? 'checkbox' : 'radio'
  return [addonColumn, ...props.columns]
})

const { loading, data, loadData, setupParams, setSql, setSortby } = useCommonTable({
  sql: props.sql,
  sortby: props.sortBy
})

setupParams(() => {
  return () => {
    const params = {}
    if (props.manager && props.manager.value) {
      Object.keys(props.manager.value).forEach((key) => {
        const value = props.manager.value[key]
        const queryKey = key
        // let suffix = ''
        // if (key.indexOf('@')) {
        //   const [prev, next] = key.split('@')
        //   queryKey = prev
        //   suffix = next ? `@${next}` : ''
        // }

        // if (value instanceof Array) {
        //   params[`${queryKey}__gte${suffix}`] = value[0]
        //   params[`${queryKey}__lte${suffix}`] = value[1]
        // } else {
        //   params[queryKey] = value
        // }
        params[queryKey] = value
      })
    }

    return params
  }
})

const onSearch = () => {
  loadData()
}

const onReset = () => {
  props.manager && props.manager.reset()
}

const handleColse = () => {
  if (props.closeReset) {
    onReset()
    data.value = []
  }
}

const handleCellDblclick = ({ row }) => {
  emit('confirm', row)
  rmRef.value?.close()
}

const confirmEvent = () => {
  if (props.multi) {
    const result = tableRef.value?.getCheckboxRecords()
    comfirmValueTemp.value = result
    if (result) {
      emit('confirm', result)
    }
  } else {
    const result = tableRef.value?.getRadioRecord()
    comfirmValueTemp.value = result
    if (result) {
      emit('confirm', result)
    }
  }
}

const handleBeforeHide = (e) => {
  if (e.type === 'confirm') {
    if (comfirmValueTemp.value instanceof Array) {
      if (comfirmValueTemp.value.length === 0) {
        return Promise.reject()
      }
    } else if (!comfirmValueTemp.value) {
      return Promise.reject()
    } else {
      comfirmValueTemp.value = null
      return Promise.resolve()
    }
  }
}

const open = async () => {
  rmRef.value?.open()

  if (!isLoaded.value) {
    await load()
  }

  if (props.autoLoad) {
    await onSearch()
  }
}

const load = async () => {
  if (!props.objectName) {
    isLoaded.value = true
    return
  }
  try {
    await loadMessageByObjectName(props.objectName)
    isLoaded.value = true
  } catch (e: any) {
    ElMessageBox.alert(`获取翻译失败：${e.message || JSON.stringify(e)}`, 'Error', {
      type: 'error'
    })
  }
}

const clear = () => {
  data.value = []
}

watch(
  () => props.sql,
  (newSql) => {
    setSql(newSql)
  }
)

watch(
  () => props.sortBy,
  (newSortby: any) => {
    setSortby(newSortby)
  }
)

defineExpose(
  getResizeModelExposeProxy(rmRef, {
    open,
    clear
  })
)
</script>
