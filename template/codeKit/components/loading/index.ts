import { ref, onMounted } from 'vue'
import type { App } from 'vue'
import type { LoadingApp } from './loading'
import { LoadingService, type LoadingOptions } from './service'
import { loadingDirective } from './directive'

export const Loading = {
  install(app: App) {
    // 注册指令
    app.directive('ace-loading', loadingDirective) // 全局挂载服务
    app.config.globalProperties.$loading = LoadingService
  },
  directive: loadingDirective,
  setvice: LoadingService
}

export default Loading
export { loadingDirective, LoadingService }

export function useLoading(options: LoadingOptions) {
  const loadingRef = ref<LoadingApp | null>(null)

  onMounted(() => {
    loadingRef.value = LoadingService(options)
  })

  return loadingRef
}
