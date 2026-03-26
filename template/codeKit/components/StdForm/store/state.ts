import { OrderStatus, StdFormProps } from '../types/stdForm'
import { State, StdFormAction } from '../types/store'
import { createHooks } from './hooks'

export function useState(): State {
  return {
    hooks: createHooks(),
    loading: false,
    readonly: true,
    actionType: StdFormAction.RADEONLY,
    orderStatus: OrderStatus.Idle,
    initialized: false,
    meta: {
      objectId: -1,
      objectName: '',
      objectType: '',
      objectParentId: null,
      reportUrl: '',
      ISADD: 'N',
      ISAUD: 'N',
      ISDEL: 'N',
      ISQRY: 'N',
      ISUPD: 'N',
      ISFREQUENTLYUSED: null
    },
    toolbar: {
      add: true,
      edit: true,
      delete: true,
      save: true,
      rollback: true,
      draft: true,
      submit: true,
      audit: true,
      disaudit: true,
      print: true,
      report: true,
      finish: true,
      archive: true,
      cancel: true
    }
  }
}

export const storeOptionsToSkip: (keyof Partial<StdFormProps & State>)[] = ['id']
