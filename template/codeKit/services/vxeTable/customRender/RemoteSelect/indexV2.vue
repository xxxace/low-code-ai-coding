<template>
  <RemoteSelect
      v-if="currRow && currColumn"
      ref="remoteSelectRef"
      v-model="currRow[currentField]"
      v-bind="attrs"
      :params="requestParams"
      :contentValue="currRow[attrs.contentKey]"
      @change="handleChange"
  />
</template>

<script lang="ts" setup>
import {computed, PropType, ref, watch, onMounted, onBeforeUnmount, nextTick} from 'vue'
import {VxeGlobalRendererHandles} from 'vxe-pc-ui'
import {VxeTableDefines} from 'vxe-table'
import RemoteSelect from '../../../../components/RemoteSelectV2/index.vue'

const props = defineProps({
  options: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderDefaultOptions>,
    default: () => ({})
  },
  params: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
    default: () => ({})
  }
})

const remoteSelectRef = ref<InstanceType<typeof RemoteSelect>>()
const currColumn = ref<VxeTableDefines.ColumnInfo<any>>()
const currRow = ref()
const attrs = ref()
const requestParams = ref()
const currentField = computed(() => currColumn.value?.field)

const load = () => {
  const {options, params} = props
  const {row, column} = params
  currRow.value = row
  currColumn.value = column as any
  const originAttrs = Object.assign({}, options.attrs || {})

  if (options.attrs) {
    delete options.attrs.valueMappings

    const {params} = options.attrs

    if (params) {
      requestParams.value = typeof params === 'function' ? () => params(currRow.value) : params
      delete originAttrs.params
    }
  }

  attrs.value = originAttrs
}

watch(
    () => props.params,
    () => {
      load()
    },
    {immediate: true}
)

const handleChange = async (_val, item) => {
  const valueMappings = attrs.value.valueMappings
  if (currColumn.value && valueMappings) {
    if (valueMappings && valueMappings.length > 0) {
      await nextTick()
      valueMappings.forEach((valueMapping) => {
        if (typeof valueMapping !== 'function') {
          const [targetKey, sourceKey] = valueMapping.split(':')
          currRow.value[targetKey] = item[sourceKey]
        } else {
          const [key, value] = valueMapping(currRow.value, item)
          currRow.value[key] = value
        }
      })
    }
  }
}

const getOptionCacheKey = () => {
  const {params} = props
  const rowid = params.rowid
  const key = `@remote-select-${rowid}-${params.column.id}`
  return key
}

// 收集当前options
const collectSelectOptions = () => {
  if (attrs.value.cacheId) return
  const options = remoteSelectRef.value?.getOptions()
  if (options && options.length > 0) {
    if (currColumn.value) {
      const key = getOptionCacheKey()
      currColumn.value.params = Object.assign(currColumn.value?.params || {}, {[key]: options})
    }
  }
}

// 初始化
const initWithStoreCache = () => {
  if (attrs.value.cacheId) return
  if (currColumn.value) {
    if (currColumn.value.params) {
      const key = getOptionCacheKey()
      const options = currColumn.value.params[key]

      if (options && options.length) {
        setTimeout(() => {
          remoteSelectRef.value?.setOptions(options)
        }, 40)
      }
    }
  }
}

onMounted(() => {
  initWithStoreCache()
})

onBeforeUnmount(() => {
  collectSelectOptions()
})
</script>
