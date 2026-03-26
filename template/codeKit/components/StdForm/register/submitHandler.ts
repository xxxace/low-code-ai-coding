import {RefManagerArray, ValidateErrorInfo} from '../../../hooks/useRefManager'
import {
    ColumnType,
    DataColumn,
    StdFormRelation,
    StdFormValueChanges,
    ValueChange
} from '../types/stdForm'
import {pick, isEqual, cloneDeep} from 'lodash'
import {StdFormStore} from '../types/store'
import {ColdataModel, generateDataModel, DataModel, diffItem, DataType} from '@nameson/sqlutils'
import {useUserStore} from '@/stores/modules/user'
import {saveData} from '@/api/nameson'

export async function collectSubmitDataHandler(relations: StdFormRelation<any>[]) {
    const submitData: StdFormValueChanges = []

    for (const relation of relations) {
        const manager = relation.manager

        if (!manager) throw new Error('No manager found')

        const newValue =
            manager.type === 'object' ? manager.value : (manager as RefManagerArray<any>).records
        const tableFields = relation.table.columns.map((col) => col.field)

        const newData = pickDataByObjectOrArray(cloneDeep(newValue), tableFields)
        const oldData = pickDataByObjectOrArray(cloneDeep(manager.old), tableFields)

        submitData.push({
            id: relation.id,
            oldValue: oldData,
            newValue: newData
        })
    }

    return submitData
}

export async function collectBackupDatas(relations: StdFormRelation<any>[]) {
    const submitData: StdFormValueChanges = []

    for (const relation of relations) {
        const manager = relation.manager

        if (!manager) throw new Error('No manager found')

        const newValue =
            manager.type === 'object' ? manager.value : (manager as RefManagerArray<any>).records

        const newData = cloneDeep(newValue)
        const oldData = cloneDeep(manager.old)

        submitData.push({
            id: relation.id,
            oldValue: oldData,
            newValue: newData
        })
    }

    return submitData
}

export function backupRestore(store: StdFormStore, backupDatas: StdFormValueChanges) {
    console.log('backupRestore:', backupDatas)
    for (const backup of backupDatas) {
        const relation = store.relationRegister.relations.find((r) => r.id === backup.id)
        console.log('restore', relation, backup)
        relation?.manager?.cover(backup.newValue)
    }
}

export type InvalidtedFieldInfo = {
    id: string
} & ValidateErrorInfo

export async function validateSubmissionHandler(
    store: StdFormStore,
    valueChanges: StdFormValueChanges
) {
    const invalidatedList: InvalidtedFieldInfo[] = []

    for (const valueChange of valueChanges) {
        const relation = store.relationRegister.relations.find((r) => r.id === valueChange.id)

        if (!relation) throw new Error('No relation found')

        const newValue =
            valueChange.newValue instanceof Array ? valueChange.newValue : [valueChange.newValue]

        if (newValue.length) {
            const errors = await relation?.manager?.validate()
            if (errors && errors.length)
                invalidatedList.push(...errors.map((error) => ({id: relation.id, ...error})))
        }
    }

    return invalidatedList
}

function pickDataByObjectOrArray(data: any, keys: string[]) {
    if (data instanceof Array) {
        return data.map((item) => pick(item, keys))
    }

    return pick(data, keys)
}

export async function checkChangedHandler(store: StdFormStore, valueChanges: StdFormValueChanges) {
    for (const valueChange of valueChanges) {
        const relation = store.relationRegister.relations.find((r) => r.id === valueChange.id)
        if (!relation) throw new Error('No relation found')

        const {newValue, oldValue} = valueChange

        if (!isEqual(newValue, oldValue)) return true
    }

    return false
}

export async function submitHandler(store: StdFormStore, valueChanges: StdFormValueChanges) {
    const relations = store.relationRegister.relations
    if (!relations) throw new Error('No relations found')

    const postList: ColdataModel[] = []

    await store.emits.preData(valueChanges)

    for (const valueChange of valueChanges) {
        const relation = relations.find((r) => r.id === valueChange.id)
        if (!relation) throw new Error('No relation found')
        const uploadData = serializeUploadData(relation, valueChange)
        uploadData && postList.push(...uploadData)
    }

    const insertOrUpdateList: ColdataModel[] = []
    const deleteList: ColdataModel[] = []
    postList.forEach((item) => {
        if (item.DataType === DataType.DELETE) {
            deleteList.unshift(item)
        } else {
            insertOrUpdateList.push(item)
        }
    })

    const uplodaData = [...deleteList, ...insertOrUpdateList]

    await store.emits.postData(uplodaData)

    if (uplodaData.length) {
        const res = await saveData(uplodaData)
        if (res.statusCode != '1') {
            throw new Error(res.message)
        }
    } else {
        // throw new Error('没有数据可以保存！')
        console.log('暂无数据变更')
    }
}

function serializeUploadData(relation: StdFormRelation<any>, valueChange: ValueChange) {
    const userStore = useUserStore()
    const dataModel = generateDataModel({
        tableName: relation.table.tableName,
        user: (userStore.userInfo as any).p_user
    })

    dataModel.setKeyTypeMap({
        NUMBER: relation.table.columns
            .filter((col) => col.type === ColumnType.NUMBER)
            .map((col) => col.field),
        DATE: relation.table.columns
            .filter((col) => col.type === ColumnType.DATE)
            .map((col) => col.field)
    })

    const indexColumns = relation.table.columns.filter((col) => !!col.key)

    const filledDataModel = fillDataModel(dataModel, indexColumns, valueChange)

    return filledDataModel
}

// 值填充
export function fillDataModel(
    dataModel: DataModel,
    indexColumns: DataColumn[],
    valueChange: ValueChange
) {
    function build(newItem, oldItem) {
        const baseItem = newItem || oldItem
        const pkValues = indexColumns.reduce((pre, next) => {
            pre[next.field] = baseItem[next.field]
            return pre
        }, {})

        dataModel.setPKvalues(pkValues)
        dataModel.setColdatas(newItem, oldItem)

        if (dataModel.hasColdatas()) return dataModel.build()
    }

    let temp
    const buildList: ColdataModel[] = []
    const {newValue, oldValue} = valueChange
    if ((newValue || oldValue) instanceof Array) {
        const diffList = diffItem(newValue, oldValue, (a, b) => {
            return indexColumns.every((col) => a[col.field] === b[col.field])
        })
        for (const diff of diffList) {
            const [newItem, oldItem] = diff
            temp = build(newItem, oldItem)
            if (temp) buildList.push(temp)
        }
    } else {
        temp = build(newValue, oldValue)
        if (temp) buildList.push(temp)
    }

    return buildList
}
