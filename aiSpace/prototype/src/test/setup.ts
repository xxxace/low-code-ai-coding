/**
 * @file test/setup.ts
 * @description Vitest 全局测试工具
 *
 * 提供：
 * - withSetup：在 Vue 组件上下文中运行函数（不需要挂载完整组件）
 * - flushPromises：等待所有微任务完成（用于 watchEffect/nextTick 测试）
 */

import { createApp, type App } from 'vue'

/**
 * 在一个独立的 Vue 应用上下文中执行 fn，并返回其结果。
 * 用途：测试依赖 reactive/ref/watchEffect 但不需要 DOM 挂载的纯逻辑。
 *
 * @example
 * const { result, app } = await withSetup(() => {
 *   const count = ref(0)
 *   return { count }
 * })
 * expect(result.count).toBe(0)
 * app.unmount()
 */
export async function withSetup<T>(fn: () => T): Promise<{ result: T; app: App }> {
  const app = createApp({})
  let result: T

  const setup = () => {
    result = fn()
    return () => {}
  }

  const rootComponent = { setup }
  app.component('Root', rootComponent)
  app.mount(document.createElement('div'))

  // 等待组件挂载完成
  await new Promise((resolve) => setTimeout(resolve, 0))

  return { result: result!, app }
}

/**
 * 等待所有微任务和 setTimeout 完成
 * 用于测试 watchEffect / nextTick 等异步响应式行为
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
