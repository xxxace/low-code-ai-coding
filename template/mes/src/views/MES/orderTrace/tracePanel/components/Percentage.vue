<template>
  <span v-if="isShowPercentageComputed" class="inline-block ml-1">{{ props.percentage }}%</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  percentage: number
}>()

const isShowPercentageComputed = computed(() => props.percentage > 0 && props.percentage < 100)
</script>
