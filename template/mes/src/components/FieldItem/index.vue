<template>
  <div :class="['field-item inline-block', { 'flex-col': props.mode === 'vertical' }]">
    <I18nLabel
      :class="[
        'whitespace-nowrap mr-2 font-medium',
        {
          'font-bold': props.bold
        }
      ]"
      :style="`color: ${props.color}`"
      :label="props.label || ''"
      :width="props.width || 0"
      :required="props.required"
    />
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, Ref, reactive, provide } from 'vue'
import { formContextKey } from 'element-plus'
import { stdFormContextKey } from '@/constants/key'
import I18nLabel from '../Nameson/I18nLabel/index.vue'

interface PropsWithLabel {
  label?: string
  width: number
  color?: string
  bold?: boolean
  mode?: 'horizontal' | 'vertical'
  disabled?: boolean
  independent?: boolean
  required?: boolean
}

interface PropsWithoutLabel {
  label?: string
  width?: number
  color?: string
  bold?: boolean
  mode?: 'horizontal' | 'vertical'
  disabled?: boolean
  independent?: boolean
  required?: boolean
}

type FieldItemProps = PropsWithLabel | PropsWithoutLabel

const props = withDefaults(defineProps<FieldItemProps>(), {
  mode: 'horizontal'
})

const parentState = inject(stdFormContextKey, { disabled: false })
const isDisabled = computed(() => {
  if (props.independent) return props.disabled
  let parentDisabled = parentState.disabled
  if (parentDisabled === undefined) parentDisabled = (parentState as any).value.disabled
  if (typeof parentDisabled === 'object') {
    parentDisabled = (parentDisabled as Ref<boolean>).value
  }
  return (parentDisabled || props.disabled) === true
})

provide(
  formContextKey,
  reactive({
    disabled: isDisabled
  }) as any
)
</script>

<style lang="scss" scoped>
.field-item {
  display: inline-flex;
  font-size: 14px;
  align-items: center;
  vertical-align: middle;

  label {
    display: inline-block;
    height: 100%;
    text-align: right;
  }

  &.flex-col {
    align-items: normal;
  }
}

.field-item:nth-of-type(n + 2) {
  margin-left: 10px;
}

:deep(.a-checkbox) {
  height: 20px;
}

:deep(.ant-input) {
  width: auto;
}
</style>
