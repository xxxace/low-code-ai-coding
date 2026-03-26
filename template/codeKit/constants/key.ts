import type { InjectionKey } from 'vue'

export const stdFormContextKey: InjectionKey<{
  disabled: boolean
}> = Symbol('stdFormContextKey')
