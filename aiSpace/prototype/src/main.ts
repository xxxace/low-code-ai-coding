import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createDefaultRegistry } from './types/componentRegistry'
import { COMPONENT_REGISTRY_KEY } from './types/componentRegistry'

const app = createApp(App)

// 注册 Element Plus
app.use(ElementPlus)

// 注册所有 EP 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Pinia
app.use(createPinia())

// 注册组件注册表（全局提供）
const registry = createDefaultRegistry()
app.provide(COMPONENT_REGISTRY_KEY, registry)

app.mount('#app')
