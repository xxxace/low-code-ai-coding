<template>
  <el-input
    spellcheck="false"
    v-bind="{ ...$props, ...$attrs }"
    v-on="$attrs"
    v-model="currentValue"
    @input="handleInput"
    @change="handleChange"
  >
    <!-- 内置插槽：前缀 -->
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>

    <!-- 内置插槽：后缀 -->
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>

    <!-- 内置插槽：前置内容（输入框前的块级区域） -->
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <!-- 内置插槽：后置内容（输入框后的块级区域） -->
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>

    <!-- 默认插槽（通常不需要，el-input 主要使用具名插槽） -->
    <slot />
  </el-input>
</template>

<script setup lang="ts">
import { ref, watch, useAttrs, useSlots } from 'vue'
import type { InputProps } from 'element-plus/es/components/input'

// 显式关闭属性继承（避免父组件非 prop 属性被错误附加到组件根元素）
defineOptions({ inheritAttrs: false })

const $attrs = useAttrs()
const $slots = useSlots()

const props = defineProps<
  {
    modelValue?: string | number
  } & Omit<Partial<InputProps>, 'modelValue'>
>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'change', value: string): void
}>()

const currentValue = ref<string>(props.modelValue?.toString() || '')

watch(
  () => props.modelValue,
  (newVal) => {
    currentValue.value = newVal?.toString().toUpperCase() || ''
  },
  { immediate: true }
)

const handleInput = (value: string) => {
  const upperValue = value.toUpperCase()
  currentValue.value = upperValue
  emit('update:modelValue', upperValue)
}

const handleChange = (value: string) => {
  emit('change', value.toUpperCase())
}
</script>
