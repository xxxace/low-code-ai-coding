import { createApp, markRaw } from 'vue'
import type { App } from 'vue'

// @ts-ignore
let instanceApp: App | null = null

export function setupMainApp(app: App) {
  instanceApp = app
}

export function getMainApp(): App | null {
  return instanceApp
}

/**
 * 创建一个继承主应用配置的子应用实例
 * @param {Object} component - 根组件
 * @param {Object} [options] - 可选配置
 * @returns {Object} 新的应用实例
 */
export function createChildApp(component) {
  // 创建新应用实例
  const childApp = createApp(component)
  const mainApp = instanceApp || childApp

  // 复用主应用的配置
  childApp.config.compilerOptions.isCustomElement = mainApp.config.compilerOptions.isCustomElement
  childApp.config.errorHandler = mainApp.config.errorHandler
  childApp.config.warnHandler = mainApp.config.warnHandler

  // 复用主应用的全局属性
  Object.assign(childApp.config.globalProperties, mainApp.config.globalProperties)

  // 创建一个插件来共享主应用的 provide
  const MainAppPlugin = {
    install(app) {
      // 使用 Reflect.ownKeys 获取所有键（包括 Symbol）
      const mainAppProvides = mainApp._context.provides
      const provideKeys = Reflect.ownKeys(mainAppProvides)

      // 将主应用的 provide 应用到子应用
      provideKeys.forEach((key) => {
        const value = mainAppProvides[key]
        // 检查是否为插件实例（有 install 方法）
        if (value && typeof value.install === 'function') {
          app.use(value)
        } else {
          // 普通 provide 值
          app.provide(key, value)
        }
      })

      // 提供主应用实例
      app.provide('mainApp', markRaw(mainApp))

      // 全局混入，使所有组件都能访问主应用
      app.mixin({
        beforeCreate() {
          this.$mainApp = mainApp
        }
      })
    }
  }

  // 使用插件
  childApp.use(MainAppPlugin)

  const childAppComponents = childApp._context.components
  const globalComponents = extractGlobalComponents(mainApp)
  globalComponents.forEach(({ name, component }: { name: string; component: any }) => {
    if (component.install && typeof component.install === 'function') {
      childApp.use(component)
    } else if (!childAppComponents[name]) {
      childApp.component(name, component)
    }
  })

  // 提供主应用实例的引用
  childApp.config.globalProperties.$mainApp = markRaw(mainApp)

  return childApp
}

/**
 * 辅助函数：从主应用提取所有全局组件
 * @param {Object} mainApp - 主应用实例
 * @returns {Array} 全局组件列表
 */
export function extractGlobalComponents(mainApp) {
  // 注意：这是内部属性，可能在未来版本中变化
  const globalComponents = mainApp._context.components

  return Object.entries(globalComponents).map(([name, component]) => ({
    name,
    component
  }))
}
