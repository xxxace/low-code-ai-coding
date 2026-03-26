<template>
  <el-tab-pane v-bind="attrs">
    <template #label>
      <I18nLabel :label="props.label" :width="100" unit="%" />
    </template>
    <slot></slot>
  </el-tab-pane>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
import I18nLabel from '../Nameson/I18nLabel/index.vue'

const props = defineProps<{
  label: string
}>()

const attrs = useAttrs()
</script>
