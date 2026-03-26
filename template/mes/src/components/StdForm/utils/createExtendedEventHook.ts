import type { EventHook } from '@vueuse/core'
import { tryOnScopeDispose } from '@vueuse/core'

export interface EventHookExtended<T> extends EventHook {
  hasListeners: () => boolean
  fns: Set<(param: T) => void>
}

function unshiftSet<T>(set: Set<T>, value: T) {
  const array = Array.from(set)
  array.unshift(value)
  set.clear()
  array.forEach((v) => set.add(v))
}

export function createExtendedEventHook<T = any>(
  defaultHandler?: (param: T) => void,
  onlyoneFn?: boolean,
  registerOnce?: boolean
): EventHookExtended<T> {
  const fns = new Set<(param: T) => void>()

  let hasDefaultHandler = false

  const hasListeners = () => fns.size > 0

  if (defaultHandler) {
    fns.add(defaultHandler)
    hasDefaultHandler = true
  }

  const off = (fn: (param: T) => void) => {
    fns.delete(fn)
  }

  const on = (fn: (param: T) => void, isUnshift?: boolean) => {
    if (defaultHandler && !hasDefaultHandler) {
      fns.delete(defaultHandler)
    }

    if (registerOnce && hasListeners()) {
      return {
        off: () => off(fns[0])
      }
    }

    if (onlyoneFn) {
      fns.clear()
    }

    if (isUnshift) {
      unshiftSet(fns, fn)
    } else {
      fns.add(fn)
    }

    const offFn = () => {
      off(fn)

      if (defaultHandler && hasDefaultHandler) {
        fns.add(defaultHandler)
      }
    }

    tryOnScopeDispose(() => {
      fns.clear()
    })

    return {
      off: offFn
    }
  }

  const trigger = async (param: T) => {
    return Promise.all(Array.from(fns).map((fn) => fn(param)))
  }

  return {
    on,
    off,
    trigger,
    hasListeners,
    fns
  }
}
