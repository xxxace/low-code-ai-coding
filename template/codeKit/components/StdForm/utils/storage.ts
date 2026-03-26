import { reactive } from 'vue'
import { useState } from '../store/state'
import { useActions } from '../store/actions'
import { StdFormStore } from '../types/store'
import { createExtendedEventHook } from './createExtendedEventHook'
import { StdFormProps } from '../types/stdForm'
import { RelationRegister } from './relation'

export class Storage {
  public currentId = 0
  public stdForms = new Map<string, StdFormStore>()
  static instance: Storage

  public static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage()
    }

    return Storage.instance
  }

  public set(id: string, stdForm: StdFormStore) {
    this.stdForms.set(id, stdForm)
  }

  public get(id: string) {
    return this.stdForms.get(id)
  }

  public remove(id: string) {
    this.stdForms.delete(id)
  }

  public getId() {
    return `std-form-${this.currentId++}`
  }

  public create(id: string, options: StdFormProps): StdFormStore {
    const state = useState()

    const relationRegister = new RelationRegister()

    const reactiveState = reactive(state)

    const actions = useActions(reactiveState)

    actions.setState({ ...reactiveState, ...options })

    const hooksOn = <any>{}
    for (const [n, h] of Object.entries(reactiveState.hooks)) {
      hooksOn[`on${n[0].toUpperCase() + n.slice(1)}`] = h.on
    }

    const emits = <any>{}
    for (const [n, h] of Object.entries(reactiveState.hooks)) {
      emits[n] = h.trigger
    }

    const mainMethods = <any>{}
    for (const key of [
      'init',
      'submit',
      'reset',
      'rollback',
      'validate',
      'delete',
      'changeStatus',
      'print'
    ]) {
      const extendedEventHook = createExtendedEventHook(undefined, true)
      mainMethods[key] = extendedEventHook.trigger
      mainMethods[`register${key[0].toUpperCase() + key.slice(1)}`] = extendedEventHook.on
    }

    const stdForm: StdFormStore = reactive({
      ...reactiveState,
      ...hooksOn,
      ...actions,
      ...mainMethods,
      relationRegister,
      emits,
      id,
      $destroy: () => {
        this.remove(id)
      }
    })

    this.set(id, stdForm)
    return stdForm
  }
}
