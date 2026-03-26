<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <div class="absolute top-0 left-[16px]" style="z-index: 1">
      <el-segmented v-model="currentTab" :options="['批号齐套检查', '毛料齐套检查']" size="small" />
    </div>
    <MaterialReadinessAnalysis v-show="currentTab === '批号齐套检查'" />
    <MaterialsAnalysis v-show="currentTab === '毛料齐套检查'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MaterialsAnalysis from '../materialAnalysis/index.vue'
import MaterialReadinessAnalysis from '../materialReadinessAnalysis/index.vue'

const currentTab = ref('批号齐套检查')
</script>
