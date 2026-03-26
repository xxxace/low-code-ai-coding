import { Ref, ref } from 'vue'
import type { UnwrapRef } from 'vue'
import type { ColdataModel } from '@/utils/Sqlutils'
import Schema from 'async-validator'
import type { Rules, ValidateError } from 'async-validator'

// export type RequiredRule = {
//   required: boolean
//   message: string
// }

// export type ValidatorRule = {
//   validator: (value: any, source: any, callback: (error?: Error) => void) => void
// }

// export type TypeValidatorRule = {
//   type: string
//   message: string
// }

// export type Rules<T> = {
//   [key in keyof T]: Array<RequiredRule | ValidatorRule | TypeValidatorRule>
// }
export type ValidateErrorInfo = ValidateError & { index: number }
export type ValidateFunc<T> = (keys?: (keyof T)[]) => Promise<ValidateErrorInfo[]>

export interface RefManager<T> {
  type: 'object'
  value: T
  old: T | null
  rules: Rules | null
  defaultValue: () => T
  init: (initValue?: T) => void
  update: (initValue: T) => void
  cover: (value: T) => void
  reset: () => void
  empty: () => void
  sync: () => void
  dataGenerator?: (data: T, oldData: T) => ColdataModel | undefined
  setRules: (rules: Rules) => void
  validate: ValidateFunc<T>
}

export interface RefManagerArray<T> {
  type: 'array'
  records: T[]
  value: T[]
  old: T[] | null
  ref?: any
  rules: Rules | null
  defaultValue: () => T[]
  init: (initValue?: T[]) => void
  update: (initValue: T[]) => void
  cover: (value: T[]) => void
  push: (value: T[], update?: boolean) => void
  unshift: (value: T[], update?: boolean) => void
  reset: () => void
  empty: () => void
  sync: () => void
  dataGenerator?: (data: T[], oldData: T[]) => ColdataModel | undefined
  setRef: <R>(tableRef: R) => void
  setRules: (rules: Rules) => void
  validate: ValidateFunc<T>
}

function copy<T extends object | any[]>(val: T, defaultValue?: T) {
  return val ? (JSON.parse(JSON.stringify(val)) as T) : defaultValue || val
}

export function useRefManager<T extends object>(defaultValue: Partial<T> | (() => Partial<T>)) {
  if (typeof defaultValue !== 'function') {
    const temp = defaultValue
    defaultValue = () => temp
  }
  const r = ref<Partial<T>>({})

  const manager: RefManager<Partial<T>> = {
    type: 'object',
    value: null as any,
    old: null,
    rules: null,
    defaultValue: defaultValue,
    init(initValue) {
      if (!initValue) initValue = manager.defaultValue()
      r.value = copy(initValue, {}) as UnwrapRef<Partial<T>>
      manager.old = null
    },
    update(initValue) {
      r.value = copy(initValue, {}) as UnwrapRef<Partial<T>>
      manager.old = copy(initValue, {})
    },
    cover(value) {
      r.value = copy(value)
    },
    reset() {
      this.init()
    },
    empty() {
      this.init({})
    },
    sync() {
      manager.old = copy(r.value as any, {})
    },
    setRules(rules: Rules) {
      manager.rules = rules
    },
    async validate(keys?: (keyof Partial<T>)[]) {
      if (!manager.rules) return []

      let rules: Rules = manager.rules

      if (keys && keys.length) {
        rules = {}
        keys.forEach((key) => {
          rules[key as string] = manager.rules![key]
        })
      }

      const errors: ValidateErrorInfo[] = []
      const validator = new Schema(rules)

      try {
        await validator.validate(r.value || {})
      } catch (e: any) {
        if (e.errors) e.errors.forEach((error) => errors.push(Object.assign({ index: 0 }, error)))
      }

      return errors
    }
  }

  Object.defineProperty(manager, 'value', {
    get: () => r.value
  })

  return [r as Ref<Partial<T>>, manager] as const
}

export function useArrayRefManager<T extends object>(
  defaultValue: Partial<T>[] | (() => Partial<T>[])
) {
  if (typeof defaultValue !== 'function') {
    const temp = defaultValue
    defaultValue = () => temp
  }
  const r = ref<Partial<T>[]>([])

  const manager: RefManagerArray<Partial<T>> = {
    type: 'array',
    value: null as any,
    records: [],
    old: null,
    rules: null,
    defaultValue: defaultValue,
    init(initValue) {
      if (!initValue) initValue = manager.defaultValue()
      r.value = copy(initValue) as []
      manager.old = null
    },
    update(initValue) {
      r.value = copy(initValue) as []
      manager.old = copy(initValue)
    },
    cover(value) {
      r.value = copy(value) as []
    },
    push(value, update?: boolean) {
      const newItems = copy(value || [])
      r.value.push(...(newItems as any))

      if (!update) return
      if (!manager.old) manager.old = []
      const newOldItems = copy(value || [])
      manager.old.push(...(newOldItems as any))
    },
    unshift(value, update?: boolean) {
      const newItems = copy(value || []) as any
      r.value.unshift(...newItems)

      if (!update) return
      if (!manager.old) manager.old = []
      const newOldItems = copy(value || [])
      manager.old.unshift(...(newOldItems as any))
    },
    reset() {
      this.init()
    },
    empty() {
      this.init([])
    },
    sync() {
      manager.old = copy(r.value) as Partial<T>[]
    },
    setRef<R>(tableRef: R) {
      manager.ref = tableRef
    },
    setRules(rules: Rules) {
      manager.rules = rules
    },
    async validate(keys?: (keyof Partial<T>)[]) {
      if (!manager.rules) return []

      let rules: Rules = manager.rules

      if (keys && keys.length) {
        rules = {}
        keys.forEach((key) => {
          rules[key as string] = manager.rules![key]
        })
      }

      const errors: ValidateErrorInfo[] = []
      const validator = new Schema(rules)

      let index = 0
      for (const row of manager.records || []) {
        try {
          await validator.validate(row)
        } catch (e: any) {
          if (e.errors)
            e.errors.forEach((error) => errors.push(Object.assign({ index: index }, error)))
        }

        index++
      }

      return errors
    }
  }

  Object.defineProperty(manager, 'value', {
    get: () => r.value
  })

  Object.defineProperty(manager, 'records', {
    get: () =>
      manager.ref?.value.getTableData().fullData.map((item) => {
        const copyItem = { ...item }
        delete copyItem['_X_ROW_KEY']
        delete copyItem['isTrusted']
        delete copyItem['_vts']
        return copyItem
      })
  })

  return [r as Ref<Array<Partial<T>>>, manager] as const
}

export function useParamsRefManager<T extends object>(defaultValue: T | (() => T)) {
  const [r, manager] = useRefManager<T>(defaultValue)

  manager.init()

  return [r as Ref<T>, manager] as const
}
