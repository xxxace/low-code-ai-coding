import { UnwrapRef } from 'vue'
import { StdFormHooks, StdFormHooksEmit, StdFormHooksOn } from './hooks'
import { OrderStatus, StdFormProps } from './stdForm'
import { EventHookTrigger } from '@vueuse/core'
import { RelationRegister } from '../utils/relation'
import type { RemoteSqlMapRef } from '@/hooks/nameson/useFetchSql'

export enum StdFormAction {
  RADEONLY = 'Readonly',
  ADD = 'Add',
  EDIT = 'Edit',
  SAVING = 'Saving',
  DELETING = 'Deleting',
  RESETTING = 'Resetting',
  BEING_SUBMMITED = 'Being Submitted'
}

export enum ToolbarAction {
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
  SAVE = 'save',
  ROLLBACK = 'rollback',
  DRAFT = 'draft',
  SUBMIT = 'submit',
  AUDIT = 'audit',
  DISAUDIT = 'disaudit',
  PRINT = 'print',
  REPORT = 'report',
  FINISH = 'finish',
  ARCHIVE = 'archive',
  CANCEL = 'cancel'
}

export type StateMetaProps = {
  objectName: string
  objectId: number
  objectType: string
  objectParentId: number | null
  reportUrl: string
  ISADD: 'Y' | 'N'
  ISAUD: 'Y' | 'N'
  ISDEL: 'Y' | 'N'
  ISQRY: 'Y' | 'N'
  ISUPD: 'Y' | 'N'
  ISFREQUENTLYUSED: 'Y' | 'N' | null
}

export type ToolbarVisibleMap = {
  add: boolean
  edit: boolean
  delete: boolean
  save: boolean
  rollback: boolean
  draft: boolean
  submit: boolean
  audit: boolean
  disaudit: boolean
  print: boolean
  report: boolean
  finish: boolean
  archive: boolean
  cancel: boolean
}

export interface State extends Omit<StdFormProps, 'id' | 'tableRelation'> {
  readonly hooks: StdFormHooks
  loading: boolean
  readonly: boolean
  actionType: StdFormAction
  orderStatus: OrderStatus
  meta: StateMetaProps
  initialized: boolean
  toolbar: ToolbarVisibleMap
}

export type SetState = (
  state: Partial<StdFormProps & State> | ((state: State) => Partial<StdFormProps & State>)
) => void

// type EventHookTriggerRestricted<T = any> = (param: T) => Promise<unknown[]>
// type EventHookTriggerFn<T = any> = T extends undefined
//   ? EventHookTrigger<T>
//   : EventHookTriggerRestricted<T>
export type ChangeStatusParams = {
  status: OrderStatus
  message?: string
}

export interface StdFormMainHooks {
  readonly init: EventHookTrigger<string | number | object | undefined>
  readonly submit: EventHookTrigger<undefined>
  readonly reset: EventHookTrigger<undefined>
  readonly rollback: EventHookTrigger<undefined>
  readonly validate: EventHookTrigger<undefined>
  readonly delete: EventHookTrigger<undefined>
  readonly changeStatus: EventHookTrigger<ChangeStatusParams>
  readonly print: EventHookTrigger<Record<string, any>>
  readonly registerInit: (
    fn: (param: string | number | object | undefined) => Promise<boolean>
  ) => void
  readonly registerSubmit: (fn: () => void) => void
  readonly registerReset: (fn: () => void) => void
  readonly registerRollback: (fn: () => void) => void
  readonly registerValidate: (fn: () => void) => void
  readonly registerDelete: (fn: () => void) => void
  readonly registerChangeStatus: (fn: (param: ChangeStatusParams) => void) => void
  readonly registerPrint: (fn: (param: any) => void) => void
}

export interface Actions {
  setState: SetState
}

export type StdFormStore = {
  readonly id: string
  readonly emits: StdFormHooksEmit
  readonly relationRegister: RelationRegister
  readonly sqlMap: UnwrapRef<RemoteSqlMapRef>
  readonly $destroy: () => void
} & StdFormHooksOn &
  State &
  StdFormMainHooks &
  Actions
