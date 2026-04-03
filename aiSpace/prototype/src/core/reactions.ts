/**
 * @file core/reactions.ts
 * @description 联动引擎
 *
 * 职责：
 * - 监听字段依赖变化，自动执行联动规则
 * - 在安全沙箱中求值条件表达式和副作用表达式
 * - 防止循环联动导致无限递归
 *
 * 设计原则：
 * - 使用 Vue 3 watchEffect 实现响应式联动，无自研响应式系统
 * - 沙箱求值：使用 new Function 创建隔离上下文，限制可访问变量
 * - 支持被动联动（在目标字段声明依赖）和主动联动（在源字段声明目标）
 */

import { watchEffect, type WatchStopHandle } from 'vue'
import type { Reaction, ReactionEffect, ObjectFieldSchema, FieldSchema } from './schema'
import type { FormModel, FieldState } from './model'

// ============================================================
// 循环检测
// ============================================================

const MAX_EXECUTION_DEPTH = 10

class CycleDetector {
  private readonly _counts = new Map<string, number>()

  enter(key: string): boolean {
    const count = (this._counts.get(key) ?? 0) + 1
    this._counts.set(key, count)
    if (count > MAX_EXECUTION_DEPTH) {
      console.warn(`[ReactionsEngine] 检测到可能的循环联动，已中断: ${key}`)
      return false
    }
    return true
  }

  exit(key: string): void {
    const count = this._counts.get(key) ?? 1
    if (count <= 1) {
      this._counts.delete(key)
    } else {
      this._counts.set(key, count - 1)
    }
  }

  reset(): void {
    this._counts.clear()
  }
}

// ============================================================
// 沙箱安全配置
// ============================================================

/**
 * 危险全局对象黑名单
 *
 * 作为 new Function 的参数传入但赋值 undefined，
 * 使表达式内部无法访问这些全局对象。
 *
 * 注意：strict mode 下 eval/arguments 不能作为形参名，
 * 改用 __sandbox_eval__ / __sandbox_arguments__ 替代。
 */
const SANDBOX_BLOCKED_GLOBALS: readonly string[] = [
  'window', 'document', 'globalThis', 'self', 'top', 'parent',
  '__sandbox_eval__', 'Function', 'XMLHttpRequest', 'fetch', 'WebSocket',
  'setTimeout', 'setInterval', 'require', 'module', 'exports',
  '__webpack_require__',
] as const

// ============================================================
// 表达式沙箱
// ============================================================

/**
 * 沙箱上下文变量
 * 联动表达式中可访问的变量白名单
 */
interface SandboxContext {
  $self: FieldState             // 当前字段状态（只读视图）
  $form: FormModel              // 整个表单模型
  $deps: any[]                  // 依赖值数组（对应 dependencies）
  $values: Record<string, any>  // 整个表单当前值
  $globalState: Record<string, any> // 表单全局变量
  [key: string]: any
}

/**
 * 构造沙箱函数（内部共享）
 * 将受限全局变量屏蔽，将上下文变量注入为函数参数
 */
function buildSandboxFn(body: string, context: SandboxContext): (...args: any[]) => any {
  const contextKeys = Object.keys(context)
  const contextValues = contextKeys.map((k) => context[k])
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    ...SANDBOX_BLOCKED_GLOBALS,
    ...contextKeys,
    body
  )
  return () => fn(...new Array(SANDBOX_BLOCKED_GLOBALS.length).fill(undefined), ...contextValues)
}

/**
 * 安全求值表达式（有返回值）
 */
function evalExpression(expression: string, context: SandboxContext): any {
  try {
    return buildSandboxFn(`"use strict"; return (${expression})`, context)()
  } catch (e) {
    console.error(`[ReactionsEngine] 表达式求值失败: "${expression}"`, e)
    return undefined
  }
}

/**
 * 安全执行副作用表达式（不需要返回值）
 */
function execExpression(expression: string, context: SandboxContext): void {
  try {
    buildSandboxFn(`"use strict"; ${expression}`, context)()
  } catch (e) {
    console.error(`[ReactionsEngine] 副作用执行失败: "${expression}"`, e)
  }
}

// ============================================================
// 联动引擎
// ============================================================

export class ReactionsEngine {
  private readonly _formModel: FormModel
  private readonly _stopHandles: WatchStopHandle[] = []
  private readonly _cycleDetector = new CycleDetector()

  constructor(formModel: FormModel) {
    this._formModel = formModel
  }

  /**
   * 初始化：解析所有字段的联动规则，建立响应式监听
   * 同时立即执行一轮，确保初始状态（display/pattern 等）被正确设置
   */
  init(): void {
    this._walkSchema(this._formModel.schema.schema.properties)
    this._runAllReactionsOnce()
  }

  private _runAllReactionsOnce(): void {
    this._walkAndExecuteOnce(this._formModel.schema.schema.properties)
  }

  private _walkAndExecuteOnce(
    properties: Record<string, FieldSchema>,
    pathPrefix = ''
  ): void {
    for (const [key, fieldSchema] of Object.entries(properties)) {
      const path = pathPrefix ? `${pathPrefix}.${key}` : key

      if (fieldSchema.type === 'void') {
        const voidSchema = fieldSchema as { properties?: Record<string, FieldSchema> }
        if (voidSchema.properties) {
          this._walkAndExecuteOnce(voidSchema.properties, pathPrefix)
        }
        continue
      }

      const reactions: Reaction[] = fieldSchema['x-reactions'] ?? []
      for (const reaction of reactions) {
        this._executeReaction(path, reaction)
      }

      if (fieldSchema.type === 'object' && (fieldSchema as ObjectFieldSchema).properties) {
        this._walkAndExecuteOnce((fieldSchema as ObjectFieldSchema).properties, path)
      }
    }
  }

  destroy(): void {
    this._stopHandles.forEach((stop) => stop())
    this._stopHandles.length = 0
    this._cycleDetector.reset()
  }

  // ============================================================
  // Schema 遍历
  // ============================================================

  private _walkSchema(
    properties: Record<string, FieldSchema>,
    pathPrefix = ''
  ): void {
    for (const [key, fieldSchema] of Object.entries(properties)) {
      const path = pathPrefix ? `${pathPrefix}.${key}` : key

      if (fieldSchema.type === 'void') {
        const voidSchema = fieldSchema as { properties?: Record<string, FieldSchema> }
        if (voidSchema.properties) {
          this._walkSchema(voidSchema.properties, pathPrefix)
        }
        continue
      }

      const reactions: Reaction[] = fieldSchema['x-reactions'] ?? []
      if (reactions.length > 0) {
        this._registerReactions(path, reactions)
      }

      if (fieldSchema.type === 'object' && (fieldSchema as ObjectFieldSchema).properties) {
        this._walkSchema((fieldSchema as ObjectFieldSchema).properties!, path)
      }
    }
  }

  // ============================================================
  // 联动注册与执行
  // ============================================================

  private _registerReactions(sourcePath: string, reactions: Reaction[]): void {
    for (const reaction of reactions) {
      /**
       * flush: 'post' 确保在 DOM 更新后执行联动，避免渲染期间的副作用。
       * watchEffect 自动追踪回调内访问的响应式依赖（只读取 dependencies 指定的字段，
       * 不读取 target 字段，避免"读A写A"的循环触发）。
       */
      const stop = watchEffect(
        () => {
          this._executeReaction(sourcePath, reaction)
        },
        { flush: 'post' }
      )
      this._stopHandles.push(stop)
    }
  }

  private _executeReaction(sourcePath: string, reaction: Reaction): void {
    if (reaction.enabled === false) return

    const cycleKey = `${sourcePath}:${reaction.target ?? 'self'}`
    if (!this._cycleDetector.enter(cycleKey)) return

    try {
      const sourceField = this._formModel.getField(sourcePath)
      if (!sourceField) return

      const deps = (reaction.dependencies ?? []).map((depPath) =>
        this._formModel.getFieldValue(depPath)
      )

      const context: SandboxContext = {
        $self: sourceField,
        $form: this._formModel,
        $deps: deps,
        $values: this._formModel.values,
        $globalState: this._formModel.schema.globalState ?? {},
      }

      const targets = reaction.target
        ? Array.isArray(reaction.target)
          ? reaction.target
          : [reaction.target]
        : [sourcePath]

      let conditionResult = true
      if (reaction.when) {
        conditionResult = Boolean(evalExpression(reaction.when, context))
      }

      const effect = conditionResult ? reaction.fulfill : reaction.otherwise
      if (effect) {
        for (const targetPath of targets) {
          this._applyEffect(targetPath, effect, context)
        }
      }
    } finally {
      this._cycleDetector.exit(cycleKey)
    }
  }

  private _applyEffect(
    targetPath: string,
    effect: ReactionEffect,
    context: SandboxContext
  ): void {
    if (effect.state) {
      const stateUpdate: Record<string, any> = {}

      for (const [key, val] of Object.entries(effect.state)) {
        if (typeof val === 'string' && val.includes('$')) {
          stateUpdate[key] = evalExpression(val, context)
        } else {
          stateUpdate[key] = val
        }
      }

      const normalizedState = this._normalizeState(stateUpdate)
      this._formModel.setFieldState(targetPath, normalizedState)
    }

    if (effect.props) {
      const field = this._formModel.getField(targetPath)
      if (field) {
        for (const [key, val] of Object.entries(effect.props)) {
          const resolvedVal = typeof val === 'string' && val.includes('$')
            ? evalExpression(val, context)
            : val
          field.componentProps[key] = resolvedVal
        }
      }
    }

    if (effect.run) {
      execExpression(effect.run, context)
    }
  }

  private _normalizeState(state: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, val] of Object.entries(state)) {
      switch (key) {
        case 'visible':
          result.display = val ? 'visible' : 'none'
          break
        case 'hidden':
          result.display = val ? 'hidden' : 'visible'
          break
        case 'disabled':
          if (!('readOnly' in state)) {
            result.pattern = val ? 'disabled' : 'editable'
          }
          break
        case 'readOnly':
          result.pattern = val ? 'readOnly' : 'editable'
          break
        case 'required':
          result.required = val
          break
        default:
          result[key] = val
          break
      }
    }

    return result
  }
}

// ============================================================
// 工厂函数
// ============================================================

export function createReactionsEngine(formModel: FormModel): ReactionsEngine {
  const engine = new ReactionsEngine(formModel)
  engine.init()
  return engine
}

export type { SandboxContext }
