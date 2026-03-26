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
import {useAttrs, ref, computed, watch} from 'vue'
import ResizeModal from '../../components/ResizeModal/index.vue'
import EditableTable from '../../components/EditableTable/index.vue'
import {getResizeModelExposeProxy} from '../../utils'
import FieldItemGroup from '../../components/FieldItemGroup/index.vue'
import type {EditableTableInstance} from '../../components/EditableTable/types'
import type {ResizeModalInstance} from '../../components/ResizeModal/types'
import {RefManager} from '@/hooks/nameson/useRefManager'
import {ElMessageBox} from "element-plus";

export type Loader<T = any> = (params?: Record<string, any>) => T[] | Promise<T[]>

export interface DialogPickerProps {
  objectName?: string
  manager: RefManager<any>
  columns: any[]
  loader: Loader
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
  const addonColumn = {type: '', width: 30, align: 'center', fixed: 'left'}
  addonColumn.type = props.multi ? 'checkbox' : 'radio'
  return [addonColumn, ...props.columns]
})

const loading = ref(false)
const data = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const params = props.manager.value
    data.value = await props.loader(params)
  } catch (err) {
    ElMessageBox.alert(`Error loading data: ${err.message || JSON.stringify(err)}`)
  }
  loading.value = false
}

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

const handleCellDblclick = ({row}) => {
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
  // try {
  //   await loadMessageByObjectName(props.objectName)
  //   isLoaded.value = true
  // } catch (e: any) {
  //   ElMessageBox.alert(`获取翻译失败：${e.message || JSON.stringify(e)}`, 'Error', {
  //     type: 'error'
  //   })
  // }
}

const clear = () => {
  data.value = []
}

defineExpose(
    getResizeModelExposeProxy(rmRef, {
      open,
      clear
    })
)
</script>
