import {EventHookExtended} from '../utils/createExtendedEventHook'
import {StdFormRelation, StdFormValueChanges} from './stdForm'
import {InvalidtedFieldInfo} from '../register/submitHandler'
import {DefaultValueItem} from '../register/initHandler'
import type {ColdataModel} from '@nameson/sqlutils'
import {ChangeStatusParams} from './store'

export interface StdFormEvents {
    beforeInit: undefined
    init: [string | number | object | undefined, DefaultValueItem[]]
    afterInit: any
    initDone: undefined
    beforeSubmit: [undefined, boolean]
    collectSubmitData: [StdFormRelation<any>[], StdFormValueChanges]
    validateSubmission: [StdFormValueChanges, InvalidtedFieldInfo[]]
    checkChanged: [StdFormValueChanges, boolean]
    customValidate: [undefined, boolean]
    submit: [StdFormValueChanges, void]
    preData: [StdFormValueChanges, void]
    postData: [ColdataModel[], void]
    afterSubmit: undefined
    beforeDelete: [undefined, boolean]
    delete: undefined
    afterDelete: undefined
    beforeChangeStatus: [undefined, boolean]
    changeStatus: [ChangeStatusParams, undefined]
    afterChangeStatus: undefined
    createURLParams: [undefined, any]
    customActionClick: [string, any]
    beforeRollback: undefined
    rollback: [undefined, void]
    afterRollback: undefined
}

export type StdFormHooks = Readonly<{
    [key in keyof StdFormEvents]: EventHookExtended<StdFormEvents[key]>
}>

type ExtractType<T, I extends number = 0> = T extends any[] ? T[I] : I extends 1 ? void : T

export type StdFormHooksOn = Readonly<{
    [key in keyof StdFormEvents as `on${Capitalize<key>}`]: (
        fn: (
            param?: ExtractType<StdFormEvents[key]>
        ) => ExtractType<StdFormEvents[key], 1> | Promise<ExtractType<StdFormEvents[key], 1>>,
        isUnshift?: boolean
    ) => void
}>

type EventHookTrigger<T = any> = (param?: T) => void;
type EventHookTriggerPromise<T = any> = (param?: T) => Promise<void>;
export type StdFormHooksEmit = Readonly<{
    [key in keyof StdFormEvents]: EventHookTrigger<ExtractType<StdFormEvents[key]>> | EventHookTriggerPromise<ExtractType<StdFormEvents[key]>>
}>
