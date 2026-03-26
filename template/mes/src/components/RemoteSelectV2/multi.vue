<template>
  <vxe-select
    ref="selectRef"
    v-model="proxyValue"
    placeholder=" "
    size="mini"
    v-bind="attrs"
    :loading="loading"
    :disabled="disabled"
    @click.capture="(e) => handleClick(e as any)"
    @change="handleSelect"
    multiple
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
import { ref, useAttrs, onMounted, ComputedRef, inject, computed } from 'vue'
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
  autoLoad?: boolean
  seperator?: string
  noEmpty?: boolean
  defaultFirst?: boolean
  disabled?: boolean
  sortValue?: boolean
}

const props = withDefaults(defineProps<RemoteSelectProps>(), {
  labelKey: 'CNAME',
  valueKey: 'CODE'
})

const emit = defineEmits(['change'])
const attrs = useAttrs()
const modelValue = defineModel<string | number>()

const proxyValue = computed({
  get() {
    if (modelValue.value && props.seperator) {
      return String(modelValue.value).split(props.seperator)
    }
    return modelValue.value
  },
  set(val: Array<string | number> | string | number) {
    if (modelValue.value !== val) {
      const tempValue = props.sortValue
        ? val instanceof Array
          ? val.sort((a, b) => String(a).localeCompare(String(b)))
          : val
        : val
      if (props.seperator && tempValue instanceof Array) {
        modelValue.value = tempValue.join(props.seperator)
      } else {
        modelValue.value = tempValue as any
      }
    }
  }
})

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

const getValue = (val) => (val && typeof val === 'function' ? val() : val)

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
  if (e.value) {
    const selectItems = e.value.map((val) =>
      options.value.find((opt) => opt[props.valueKey] === val)
    )
    emit('change', selectItems, selectItems[selectItems.length - 1])
  } else {
    emit('change', null, null)
  }
}

onMounted(() => {
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
