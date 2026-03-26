<template>
  <vxe-select
    ref="selectRef"
    v-model="modelValue"
    placeholder=" "
    size="mini"
    v-bind="attrs"
    :loading="loading"
    :disabled="disabled"
    @click.capture="(e) => handleClick(e as any)"
    @change="handleSelect"
    :title="labelValue"
    transfer
  >
    <template v-if="props.search" #header>
      <div style="box-sizing: border-box; padding: 0 3px">
        <vxe-input
          v-model="searchContent"
          size="mini"
          trim
          type="search"
          style="width: 100%; min-width: 80px"
        />
      </div>
    </template>

    <vxe-option
      v-for="opt in filteredOptions"
      :key="opt[props.valueKey]"
      :value="opt[props.valueKey]"
      :label="opt[props.labelKey]"
    >
      {{ getLabelContent(opt) }}
    </vxe-option>
  </vxe-select>
</template>

<script setup lang="ts">
import { ref, useAttrs, watch, onMounted, ComputedRef, inject, computed } from 'vue'
import { clearCacheValue, requestCache } from '@/hooks/nameson/useRequestCache'
import type { VxeSelectConstructor } from 'vxe-pc-ui'
import { stdFormContextKey } from '@/constants/key'
import isEqual from 'lodash.isequal'

export type RecordOrFunction = Record<string, any> | (() => Record<string, any>)

export interface RemoteSelectProps {
  labelKey?: string
  valueKey?: string
  params?: RecordOrFunction
  dataLoader?: Function
  cacheId?: string
  contentValue?: string | number
  autoLoad?: boolean
  noEmpty?: boolean
  defaultFirst?: boolean
  disabled?: boolean
  // 值和名称一起显示在label中 格式："{valueKey} {labelKey}"
  labelParttern?: string
  search?: boolean
  searchKey?: string
}

const props = withDefaults(defineProps<RemoteSelectProps>(), {
  labelKey: 'CNAME',
  valueKey: 'CODE'
})

const emit = defineEmits(['update:contentValue', 'change'])
const attrs = useAttrs()
const modelValue = defineModel<string | number>()
const labelValue = ref('')
const searchContent = ref('')

const parentContext = inject(stdFormContextKey)
const editableDisabled = inject<ComputedRef<boolean>>('editableTableDisabled')

const isLoaded = ref(false)
const selectRef = ref<VxeSelectConstructor>()
const loading = ref(false)
const options = ref<any[]>([])

const params = ref<Record<string, any> | null>(null)
const disabled = computed(
  () => parentContext?.disabled || editableDisabled?.value || props.disabled
)

const filteredOptions = computed(() => {
  if (!searchContent.value) return options.value
  // 去重的keys, 防止用户传入重复的key判断两次，浪费性能
  const searchKeys = Array.from(
    new Set(props.searchKey ? props.searchKey.split(',') : [props.valueKey, props.labelKey])
  )

  return options.value.filter((opt) =>
    searchKeys.some((key) => opt[key].toLowerCase().includes(searchContent.value.toLowerCase()))
  )
})

const getLabelContent = (option: any) => {
  if (!props.labelParttern) return option[props.labelKey]
  // {valueKey} {labelKey}  用户可以传入格式各样的模版
  // 首先要提取出有的{xxx}
  const keys = props.labelParttern.match(/\{(\w+)\}/g) || ([] as any)
  return keys.reduce((prev, cur) => {
    return prev.replace(cur, option[cur.replace('{', '').replace('}', '')])
  }, props.labelParttern)
}

const loadOptions = async () => {
  if (loading.value) return
  loading.value = true
  try {
    let dataLoader = props.dataLoader
    if (!dataLoader) throw new Error('dataLoader is required')
    if (props.cacheId) {
      const loader = dataLoader
      dataLoader = async () =>
        await requestCache(props.cacheId as string, async () => await loader(params.value))
    }
    const list = await dataLoader(params.value)
    const listData = JSON.parse(JSON.stringify(list))
    if (
      !props.noEmpty &&
      listData.length &&
      listData[0][props.labelKey] !== '' &&
      listData[0][props.valueKey] !== ''
    ) {
      listData.unshift({
        [props.labelKey]: '',
        [props.valueKey]: ''
      })
    }

    options.value = listData
    isLoaded.value = true
    if (props.defaultFirst && !modelValue.value) {
      const index = props.noEmpty ? 0 : 1
      modelValue.value = listData[index][props.valueKey]
    }
  } catch (e) {
    console.log(e)
  }
  loading.value = false
}

const getValue = (val) => (val && typeof val === 'function' ? val() : val)

const handleClick = async (noShow?: boolean | MouseEvent) => {
  const paramsValue = getValue(props.params)
  const paramsIsChange = !isEqual(params.value, paramsValue)

  if (isLoaded.value && paramsIsChange) {
    isLoaded.value = false
    clearCacheValue(props.cacheId)
  }

  if (!isLoaded.value || options.value.length === 0) {
    params.value = paramsValue
    await loadOptions()

    if (noShow !== false) {
      selectRef.value?.showPanel()
    }
  }
}

const handleSelect = (e) => {
  const item = options.value.find((opt) => opt[props.valueKey] === e.value)
  emit('update:contentValue', item[props.labelKey])
  emit('change', e.value, Object.assign({}, item))
  searchContent.value = ''
}

const setDefaultOption = () => {
  if (
    (!options.value.length && !isLoaded.value && props.contentValue) ||
    typeof props.contentValue === 'number'
  ) {
    options.value.push({
      [props.labelKey]: props.contentValue,
      [props.valueKey]: modelValue.value
    })
    selectRef.value?.refreshOption()
  }
}

watch(
  () => props.contentValue,
  () => {
    if (options.value.length === 1 && options.value[0][props.valueKey] !== modelValue.value) {
      options.value = []
    }
    setDefaultOption()
  }
)

watch(options, () => {
  if (options.value) {
    const currentItem = options.value.find((opt) => opt[props.valueKey] === modelValue.value)
    labelValue.value = currentItem ? currentItem[props.labelKey] : ''
  }
})

onMounted(() => {
  setDefaultOption()
  if (props.autoLoad) {
    setTimeout(() => {
      handleClick(false)
    }, 1000)
  }
})

defineExpose({
  getOptions: () => options.value,
  setOptions: (opts) => {
    options.value = opts
    isLoaded.value = true
    selectRef.value?.refreshOption()
  },
  load: async () => await handleClick(false)
})
</script>

<style lang="scss">
.vxe-select {
  --vxe-ui-font-size-mini: 14px;

  .vxe-input.size--mini {
    --vxe-ui-base-border-radius: 0px !important;
    --vxe-ui-input-height-mini: 22px !important;

    .vxe-input--inner {
      padding: 0 3px;
      border: none !important;
    }
  }
}

.vxe-select--panel {
  --vxe-ui-font-color: #1b1a1a;
  --vxe-ui-font-size-mini: 14px;
}
</style>
