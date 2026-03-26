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
import { ref, useAttrs, watch, onMounted, ComputedRef, inject, computed } from 'vue'
import { searchList } from '@/api/nameson'
import { requestCache } from '@/hooks/nameson/useRequestCache'
import type { VxeSelectConstructor } from 'vxe-pc-ui'
import { stdFormContextKey } from '@/constants/key'

export interface RemoteSelectProps {
  labelKey?: string
  valueKey?: string
  sql?: string | Function
  dataLoader?: Function
  params?: Record<string, any>
  orderby?: string
  cacheId?: string
  contentValue?: string | number
  autoLoad?: boolean
  noEmpty?: boolean
  defaultFirst?: boolean
}

const props = withDefaults(defineProps<RemoteSelectProps>(), {
  labelKey: 'CNAME',
  valueKey: 'CODE'
})

const emit = defineEmits(['change'])
const attrs = useAttrs()
const modelValue = defineModel<string | number>()
const labelValue = ref('')

const parentContext = inject(stdFormContextKey)
const editableDisabled = inject<ComputedRef<boolean>>('editableTableDisabled')

const isLoaded = ref(false)
const selectRef = ref<VxeSelectConstructor>()
const loading = ref(false)
const options = ref<any[]>([])

const disabled = computed(() => parentContext?.disabled || editableDisabled?.value)

const loadOptions = async () => {
  if (loading.value) return
  loading.value = true
  try {
    let dataLoader = props.dataLoader
    if (!dataLoader) {
      dataLoader = async () => {
        const sqlStr = typeof props.sql === 'function' ? props.sql() : props.sql
        if (!sqlStr) return []
        const [sql, orderby] = sqlStr.toUpperCase().split('ORDER BY')
        let orderbyStr = props.orderby ? props.orderby : orderby
        if (orderbyStr && orderbyStr.toUpperCase().indexOf('ORDER BY') === -1) {
          orderbyStr = `ORDER BY ${orderbyStr}`
        }
        return await searchList({
          sql: sql,
          params: props.params,
          sortby: orderbyStr
        })
      }
    }
    if (props.cacheId) {
      const loader = dataLoader
      dataLoader = async () =>
        await requestCache(props.cacheId as string, async () => await loader())
    }
    const list = await dataLoader()
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
    if (props.defaultFirst) {
      modelValue.value = listData[0][props.valueKey]
    }
  } catch (e) {
    console.log(e)
  }
  loading.value = false
}

const handleClick = async () => {
  if (!isLoaded.value || options.value.length === 0) {
    await loadOptions()
    selectRef.value?.showPanel()
  }
}

const handleSelect = (e) => {
  const item = options.value.find((opt) => opt[props.valueKey] === e.value)
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
  () => props.params,
  () => {
    options.value = []
    setDefaultOption()
  }
)

watch(
  () => props.contentValue,
  () => {
    if (options.value.length === 1 && options.value[0][props.valueKey] !== modelValue.value) {
      options.value = []
    }
    setDefaultOption()
  }
)

watch(
  () => [props.autoLoad, props.sql],
  async () => {
    if (props.autoLoad && (props.sql || props.dataLoader)) loadOptions()
  },
  { immediate: true }
)

watch(options, () => {
  if (options.value) {
    const currentItem = options.value.find((opt) => opt[props.valueKey] === modelValue.value)
    labelValue.value = currentItem ? currentItem[props.labelKey] : ''
  }
})

onMounted(() => {
  setDefaultOption()
})

defineExpose({
  getOptions: () => options.value,
  setOptions: (opts) => {
    options.value = opts
    isLoaded.value = true
    selectRef.value?.refreshOption()
  }
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
    }
  }
}
</style>
