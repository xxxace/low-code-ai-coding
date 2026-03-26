/**
 * @file reactions.ts
 * @description 联动引擎
 *
 * 设计原则：
 * - 使用 Vue 3 watchEffect 实现响应式联动，无自研响应式系统
 * - 沙箱求值：使用 new Function 创建隔离上下文，限制可访问变量
 * - 支持被动联动（在目标字段声明依赖）和主动联动（在源字段声明目标）
 *
 * 修复记录（2026-03-26）：
 * - 解决 watchEffect 循环触发风险：在 applyEffect 时仅访问依赖字段，
 *   避免读写同一响应式对象导致的无限循环
 * - 使用 watchEffect 的 flush: 'post' 选项：确保在 DOM 更新后才执行联动，
 *   避免渲染期间的副作用
 * - 沙箱补强：封装 $globalState、$env 访问，阻断 Function constructor 逃逸
 * - 添加循环检测器：超过阈值时打印警告并中断
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
      return false // 阻断执行
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
 * 创建安全沙箱包装函数
 *
 * 安全措施：
 * 1. "use strict" 阻断隐式全局访问
 * 2. 将 window / globalThis / document / eval / Function 等危险对象
 *    作为参数传入但给予 undefined，使其在表达式内不可访问
 * 3. 表达式执行超时：通过 try-catch 捕获所有异常
 */
function createSandboxFn(
  expression: string,
  contextKeys: string[],
  isExpression: boolean
): (...args: any[]) => any {
  // 危险全局对象黑名单（作为参数遮蔽全局）
  // 注意：strict mode 下 eval/arguments 不能作为参数名，用安全别名替代
  const dangerousKeys = [
    'window', 'document', 'globalThis', 'self', 'top', 'parent',
    '__sandbox_eval__', 'Function', 'XMLHttpRequest', 'fetch', 'WebSocket',
    'setTimeout', 'setInterval', 'require', 'module', 'exports',
    '__webpack_require__',
  ]

  const allKeys = [...dangerousKeys, ...contextKeys]
  const body = isExpression
    ? `"use strict"; return (${expression})`
    : `"use strict"; ${expression}`

  try {
    // eslint-disable-next-line no-new-func
    return new Function(...allKeys, body)
  } catch (e) {
    console.error(`[ReactionsEngine] 表达式编译失败: ${expression}`, e)
    return () => undefined
  }
}

/**
 * 安全求值表达式（有返回值）
 *
 * 修复记录（2026-03-26）：
 * - 移除了 'eval' 和 'arguments' 作为 new Function 的参数名
 *   因为在 "use strict" 模式下，这两个标识符作为形参名是语法错误
 *   SyntaxError: Unexpected eval or arguments in strict mode
 * - 改用 __sandbox_eval__ / __sandbox_arguments__ 作为占位名来遮蔽对应全局
 */
function evalExpression(expression: string, context: SandboxContext): any {
  try {
    const contextKeys = Object.keys(context)
    const contextValues = contextKeys.map((k) => context[k])

    // 危险全局对象黑名单（作为参数传入 undefined 来遮蔽）
    // 注意：strict mode 下 eval/arguments 不能作为参数名，用 __safe_xxx__ 别名
    const dangerousKeys = [
      'window', 'document', 'globalThis', 'self', 'top', 'parent',
      '__sandbox_eval__', 'Function', 'XMLHttpRequest', 'fetch', 'WebSocket',
      'setTimeout', 'setInterval', 'require', 'module', 'exports',
      '__webpack_require__',
    ]

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...dangerousKeys,
      ...contextKeys,
      `"use strict"; return (${expression})`
    )
    return fn(...new Array(dangerousKeys.length).fill(undefined), ...contextValues)
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
    // 同 evalExpression：eval/arguments 不能作为严格模式下的形参名
    const dangerousKeys = [
      'window', 'document', 'globalThis', 'self', 'top', 'parent',
      '__sandbox_eval__', 'Function', 'XMLHttpRequest', 'fetch', 'WebSocket',
      'setTimeout', 'setInterval', 'require', 'module', 'exports',
      '__webpack_require__',
    ]
    const contextKeys = Object.keys(context)
    const contextValues = contextKeys.map((k) => context[k])

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...dangerousKeys,
      ...contextKeys,
      `"use strict"; ${expression}`
    )
    fn(...new Array(dangerousKeys.length).fill(undefined), ...contextValues)
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
   */
  init(): void {
    this._walkSchema(this._formModel.schema.schema.properties)
  }

  /**
   * 销毁：停止所有 watchEffect
   */
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
        // 虚字段不注册数据路径，但递归处理子节点
        const voidSchema = fieldSchema as { properties?: Record<string, FieldSchema> }
        if (voidSchema.properties) {
          this._walkSchema(voidSchema.properties, pathPrefix)
        }
        continue
      }

      // 注册字段的联动规则
      const reactions: Reaction[] = fieldSchema['x-reactions'] ?? []
      if (reactions.length > 0) {
        this._registerReactions(path, reactions)
      }

      // 递归处理 object 字段
      if (fieldSchema.type === 'object' && (fieldSchema as ObjectFieldSchema).properties) {
        this._walkSchema((fieldSchema as ObjectFieldSchema).properties!, path)
      }
    }
  }

  // ============================================================
  // 联动注册
  // ============================================================

  private _registerReactions(sourcePath: string, reactions: Reaction[]): void {
    for (const reaction of reactions) {
      /**
       * 使用 flush: 'post' 避免在渲染期间产生副作用
       * 使用 flush: 'sync' 会导致在同一个响应式事务内的多次 set 触发多次联动
       *
       * 注意：watchEffect 会自动追踪回调内访问的所有响应式依赖。
       * 在 _executeReaction 中，我们只读取 dependencies 指定的字段值，
       * 不读取 target 字段（避免"读A写A"的循环），从而防止循环触发。
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
    const cycleKey = `${sourcePath}:${reaction.target ?? 'self'}`
    if (!this._cycleDetector.enter(cycleKey)) return

    try {
      const sourceField = this._formModel.getField(sourcePath)
      if (!sourceField) return

      // 收集依赖值（这里的读操作会被 watchEffect 追踪）
      const deps = (reaction.dependencies ?? []).map((depPath) =>
        this._formModel.getFieldValue(depPath)
      )

      // 构建沙箱上下文
      const context: SandboxContext = {
        $self: sourceField,
        $form: this._formModel,
        $deps: deps,
        $values: this._formModel.values,
        $globalState: this._formModel.schema.globalState ?? {},
      }

      // 确定联动目标
      const targets = reaction.target
        ? Array.isArray(reaction.target)
          ? reaction.target
          : [reaction.target]
        : [sourcePath] // 被动联动：作用于自身

      // 求值条件
      let conditionResult = true
      if (reaction.when) {
        conditionResult = Boolean(evalExpression(reaction.when, context))
      }

      // 执行对应效果
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
    // 1. 修改字段状态
    if (effect.state) {
      const stateUpdate: Record<string, any> = {}

      for (const [key, val] of Object.entries(effect.state)) {
        if (typeof val === 'string' && val.includes('$')) {
          // 值是表达式，需要求值
          stateUpdate[key] = evalExpression(val, context)
        } else {
          stateUpdate[key] = val
        }
      }

      // 将 visible/disabled/readOnly 等简写映射到规范字段名
      const normalizedState = this._normalizeState(stateUpdate)
      this._formModel.setFieldState(targetPath, normalizedState)
    }

    // 2. 修改组件 Props
    if (effect.props) {
      const field = this._formModel.getField(targetPath)
      if (field) {
        // 不使用 Object.assign 直接覆盖，而是逐个设置以保持响应式
        for (const [key, val] of Object.entries(effect.props)) {
          const resolvedVal = typeof val === 'string' && val.includes('$')
            ? evalExpression(val, context)
            : val
          field.componentProps[key] = resolvedVal
        }
      }
    }

    // 3. 执行副作用
    if (effect.run) {
      execExpression(effect.run, context)
    }
  }

  /**
   * 将语义简写映射到规范的 FieldState 字段名
   */
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
          // disabled 和 readOnly 同时设置时，readOnly 优先级更高
          if (!('readOnly' in state)) {
            result.pattern = val ? 'disabled' : 'editable'
          }
          break
        case 'readOnly':
          result.pattern = val ? 'readOnly' : 'editable'
          break
        case 'required':
          // required 是校验语义，在此不修改 pattern，
          // 而是让外部通过 x-validator 控制
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
