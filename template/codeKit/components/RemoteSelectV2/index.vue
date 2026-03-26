<template>
  <vxe-select
      ref="selectRef"
      v-model="modelValue"
      placeholder=" "
      size="mini"
      v-bind="attrs"
      :loading="loading"
      :disabled="disabled"
      @click.capture="handleClick"
      @change="handleSelect"
      :title="labelValue"
      transfer
  >
    <vxe-option
        v-for="opt in options"
        :key="opt[props.valueKey]"
        :value="opt[props.valueKey]"
        :label="opt[props.labelKey]"
    />
  </vxe-select>
</template>

<script setup lang="ts">
import {ref, useAttrs, watch, onMounted, ComputedRef, inject, computed} from 'vue'
import {clearCacheValue, requestCache} from '../../hooks/useRequestCache'
import type {VxeSelectConstructor} from 'vxe-pc-ui'
import {stdFormContextKey} from '../../constants/key'
import isEqual from "lodash/isEqual";


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
}

const props = withDefaults(defineProps<RemoteSelectProps>(), {
  labelKey: 'CNAME',
  valueKey: 'CODE'
})

const emit = defineEmits(['update:contentValue', 'change'])
const attrs = useAttrs()
const modelValue = defineModel<string | number>()
const labelValue = ref('')

const parentContext = inject(stdFormContextKey)
const editableDisabled = inject<ComputedRef<boolean>>('editableTableDisabled')

const isLoaded = ref(false)
const selectRef = ref<VxeSelectConstructor>()
const loading = ref(false)
const options = ref<any[]>([])

const params = ref<Record<string, any> | null>(null)
const disabled = computed(() => parentContext?.disabled || editableDisabled?.value || props.disabled)

const loadOptions = async () => {
  if (loading.value) return
  loading.value = true
  try {
    let dataLoader = props.dataLoader
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

const getValue = (val) => val && typeof val === 'function' ? val() : val

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
</style>
