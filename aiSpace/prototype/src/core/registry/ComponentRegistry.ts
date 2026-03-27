/**
 * @file core/registry/ComponentRegistry.ts
 * @description 组件注册表核心类
 *
 * 职责：
 * - 管理 Widget 组件（渲染用：Input/Select/DatePicker 等）
 * - 管理 Decorator 组件（包装用：FormItem/Card/Tabs 等）
 * - 提供 Vue provide/inject 机制给子组件注入
 *
 * 设计：
 * - 全局单例 + 局部覆盖（通过 provide 传入不同实例实现局部物料集）
 * - 与 FieldRenderer 解耦：FieldRenderer 通过 inject 获取 Registry
 *
 * 扩展点：
 * - 后续可加 registerSetter()，支持自定义 Setter 编辑器（插件体系第二层）
 */

import { inject, type App, type Component, type InjectionKey } from 'vue'
import type {
  WidgetMeta,
  WidgetRegistration,
  DecoratorRegistration,
} from './registryTypes'

// ============================================================
// 注入 Key
// ============================================================

export const COMPONENT_REGISTRY_KEY: InjectionKey<ComponentRegistry> =
  Symbol('ComponentRegistry')

// ============================================================
// ComponentRegistry 类
// ============================================================

export class ComponentRegistry {
  private readonly _widgets = new Map<string, WidgetRegistration>()
  private readonly _decorators = new Map<string, DecoratorRegistration>()

  // ============================================================
  // Widget 注册
  // ============================================================

  registerWidget(
    name: string,
    component: Component,
    meta: Omit<WidgetMeta, 'name'>
  ): this {
    this._widgets.set(name, {
      component,
      meta: { name, ...meta },
    })
    return this
  }

  registerWidgets(
    widgets: Array<{ name: string; component: Component; meta: Omit<WidgetMeta, 'name'> }>
  ): this {
    for (const w of widgets) {
      this.registerWidget(w.name, w.component, w.meta)
    }
    return this
  }

  getWidget(name: string): Component | null {
    return this._widgets.get(name)?.component ?? null
  }

  getWidgetMeta(name: string): WidgetMeta | null {
    return this._widgets.get(name)?.meta ?? null
  }

  getAllWidgetMetas(): WidgetMeta[] {
    return Array.from(this._widgets.values()).map((r) => r.meta)
  }

  getWidgetMetasByCategory(): Record<string, WidgetMeta[]> {
    const result: Record<string, WidgetMeta[]> = {}
    for (const { meta } of this._widgets.values()) {
      if (!result[meta.category]) {
        result[meta.category] = []
      }
      result[meta.category].push(meta)
    }
    return result
  }

  // ============================================================
  // Decorator 注册
  // ============================================================

  registerDecorator(name: string, component: Component): this {
    this._decorators.set(name, { name, component })
    return this
  }

  getDecorator(name: string): Component | null {
    return this._decorators.get(name)?.component ?? null
  }

  // ============================================================
  // Vue provide/inject 集成
  // ============================================================

  install(provideFunc: (key: InjectionKey<ComponentRegistry>, value: ComponentRegistry) => void): void {
    provideFunc(COMPONENT_REGISTRY_KEY, this)
  }

  asPlugin(): { install: (app: App) => void } {
    return {
      install: (app: App) => {
        app.provide(COMPONENT_REGISTRY_KEY, this)
      },
    }
  }
}

// ============================================================
// useComponentRegistry —— 在 Vue 组件内获取注入的注册表
// ============================================================

export function useComponentRegistry(): ComponentRegistry {
  const registry = inject(COMPONENT_REGISTRY_KEY)
  if (!registry) {
    if (import.meta.env?.DEV) {
      console.warn(
        '[ComponentRegistry] 未找到注入的 ComponentRegistry，请确保已在根组件 provide。\n' +
          '使用 createDefaultRegistry() 创建并在 FormRenderer/LowcodeDesigner 的父组件 provide。'
      )
    }
    return new ComponentRegistry()
  }
  return registry
}
