<template>
  <slot></slot>
</template>

<script lang="ts" setup>
import { provide, inject, computed } from 'vue'
import { stdFormContextKey } from '../../constants/key'

const props = defineProps<{ disabled?: boolean; independent?: boolean }>()
const parentState = inject(stdFormContextKey)
const state = computed(() => {
  if (props.independent) return props.disabled
  const disabled = props.disabled || (parentState && parentState.disabled)
  return { disabled: disabled }
})
provide(stdFormContextKey, state as any)
</script>
