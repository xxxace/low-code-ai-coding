import type { InjectionKey } from 'vue'

export const TRACE_PANEL_INJECTION_KEY = Symbol('TRACE_PANEL_INJECTION_KEY') as InjectionKey<{
  subItemEmit: (type: string, data: any) => void
}>
