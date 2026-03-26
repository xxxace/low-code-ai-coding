import { isDef } from '../utils/stroe'
import { Actions, State } from '../types/store'
import { storeOptionsToSkip } from './state'

export function useActions(state: State): Actions {
  const setState: Actions['setState'] = (options) => {
    const opts = options instanceof Function ? options(state) : options
    const exclude = ['hooks']

    for (const o of Object.keys(opts)) {
      const key = o as keyof State
      const option = opts[key]

      if (![...storeOptionsToSkip, ...exclude].includes(key) && isDef(option)) {
        ;(<any>state)[key] = option
      }
    }

    if (!state.initialized) {
      state.initialized = true
    }
  }

  return { setState }
}
