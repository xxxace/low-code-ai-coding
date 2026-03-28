/**
 * @file core/injectionKeys.ts
 * @description 共享的 provide/inject InjectionKey 定义
 *
 * 所有跨组件注入的类型安全 key 集中在此管理，
 * 避免 string key 导致的类型丢失问题。
 */

import { inject, computed, type ComputedRef } from 'vue'
import type { DesignerEngine } from '../designer/engine/designerEngine'

// ============================================================
// 设计器引擎
// ============================================================

/**
 * designerEngine 注入 key
 *
 * provide 值类型：DesignerEngine（useDesignerEngine 返回值）
 * inject 返回：DesignerEngine | null
 */
export const DESIGNER_ENGINE_KEY: import('vue').InjectionKey<DesignerEngine> =
  Symbol('designerEngine')

/**
 * 注入 designerEngine 的便捷函数
 * @param defaultValue 默认值
 */
export function injectDesignerEngine(defaultValue: DesignerEngine | null = null): DesignerEngine | null {
  return inject(DESIGNER_ENGINE_KEY, defaultValue)
}

// ============================================================
// 设计模式
// ============================================================

/**
 * designMode 注入 key
 *
 * provide 值类型：ComputedRef<boolean>
 * inject 返回：ComputedRef<boolean>（Vue 模板中自动解包为 boolean）
 */
export const DESIGN_MODE_KEY: import('vue').InjectionKey<ComputedRef<boolean>> =
  Symbol('designMode')

/**
 * 注入 designMode 的便捷函数
 * @param defaultValue 默认值（当没有 provider 时使用）
 */
export function injectDesignMode(defaultValue = false): ComputedRef<boolean> {
  const injected = inject(DESIGN_MODE_KEY, null)
  if (injected) return injected
  // 无 provider 时返回 computed 包裹的默认值（真正的 ComputedRef，不是类型谎言）
  return computed(() => defaultValue)
}

// ============================================================
// 选中节点 ID
// ============================================================

/**
 * selectedNodeId 注入 key
 *
 * provide 值类型：ComputedRef<string | null>
 * inject 返回：ComputedRef<string | null>
 */
export const SELECTED_NODE_ID_KEY: import('vue').InjectionKey<ComputedRef<string | null>> =
  Symbol('selectedNodeId')

/**
 * 注入 selectedNodeId 的便捷函数
 * @param defaultValue 默认值
 */
export function injectSelectedNodeId(defaultValue: string | null = null): ComputedRef<string | null> {
  const injected = inject(SELECTED_NODE_ID_KEY, null)
  if (injected) return injected
  return computed(() => defaultValue)
}
