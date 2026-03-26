<script setup lang="ts">
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useAppStore } from '@/store/modules/app'
import { Footer } from '@/components/Footer'
import { computed } from 'vue'
import { CacheComponent } from './utils'

const appStore = useAppStore()

const footer = computed(() => appStore.getFooter)

const tagsViewStore = useTagsViewStore()

const getCaches = computed((): string[] => {
  return tagsViewStore.getCachedRoutes
})
</script>

<template>
  <section
    :class="[
      'flex-1 p-[var(--app-content-padding)] w-[calc(100%-var(--app-content-padding)-var(--app-content-padding))] bg-[var(--app-content-bg-color)] dark:bg-[var(--el-bg-color)]'
    ]"
  >
    <router-view>
      <template #default="{ Component, route }">
        <keep-alive :include="getCaches">
          <component
            :is="CacheComponent(Component, route.fullPath, getCaches)"
            :key="route.fullPath"
          />
        </keep-alive>
      </template>
    </router-view>
  </section>
  <Footer v-if="footer" />
</template>
