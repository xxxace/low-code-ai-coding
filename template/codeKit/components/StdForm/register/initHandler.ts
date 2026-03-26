import { RelationTree, StdFormRelation, StdFormTableQuery } from '../types/stdForm'
import { StdFormAction, StdFormStore } from '../types/store'
import { fetchPrimaryKey, searchList, searchObject } from '@/api/nameson'
import {toRaw} from "vue";

export type DefaultValueItem = {
  '@@target': string
  data: { [key: string]: any } | any[]
}

export async function createHandler(store: StdFormStore): Promise<DefaultValueItem[]> {
  const root = store.relationRegister.root
  if (!root) throw new Error('relationRegister.root is not defined')
  const primaryKeyCol = store.relationRegister.getPrimaryKey(root.relation)

  if (!primaryKeyCol) throw new Error('primaryKey is not defined')
  let primaryKeyValue: number | undefined = undefined
  if (store.actionType !== StdFormAction.RESETTING) {
    const primaryKeyList = await fetchPrimaryKey(root.relation.table.tableName)
    primaryKeyValue = primaryKeyList[0]
  }
  const defaultValue = store.relationRegister.getDefaultValue(root.relation)

  return [
    {
      '@@target': root.relation.id,
      data: {
        [primaryKeyCol?.field]: primaryKeyValue,
        ...defaultValue
      }
    }
  ]
}

export async function editHandler(id: any, store: StdFormStore): Promise<DefaultValueItem[]> {
  const root = store.relationRegister.root
  if (!root) throw new Error('relationRegister.root is not defined')
  const primaryKeyCol = store.relationRegister.getPrimaryKey(root.relation)

  if (!primaryKeyCol) throw new Error('primaryKey is not defined')

  let queryParams = id as object

  if (typeof id !== 'object') {
    queryParams = {
      [primaryKeyCol.field]: id
    }
  }

  return await requestHandler(store, root, queryParams)
}

async function requestHandler<T>(
  store: StdFormStore,
  root: RelationTree<T>,
  queryParams: T
): Promise<DefaultValueItem[]> {
  if (!root.relation.sqlQuery) throw new Error('sqlQuery is not defined')
  if (!root.relation.manager) throw new Error('manager is not defined')

  const defaultValues: DefaultValueItem[] = []

  const mainFormData = await fetchAndLoad(
    root.relation.manager,
    root.relation.sqlQuery,
    queryParams
  )

  if (!mainFormData || (mainFormData as []).length === 0) throw new Error('数据为空！')

  store.actionType = StdFormAction.RADEONLY

  defaultValues.push({
    '@@target': root.relation.id,
    data: mainFormData as any
  })

  const entryRelations = store.relationRegister.relations.filter((_r, i) => i > 0)
  for (const relation of entryRelations) {
    if (!relation.sqlQuery) throw new Error('sqlQuery is not defined')
    if (!relation.manager) throw new Error('manager is not defined')
    const entryData = await fetchAndLoad(relation.manager, relation.sqlQuery, mainFormData)
    defaultValues.push({
      '@@target': relation.id,
      data: entryData as any
    })
  }

  return defaultValues
}

async function fetchAndLoad<T>(
  manager: NonNullable<StdFormRelation<T>['manager']>,
  sqlQuery: StdFormTableQuery,
  queryParams: T
) {
  const queryState = typeof sqlQuery === 'function' ? sqlQuery(queryParams) : sqlQuery

  if ('loader' in queryState) {
    const { loader, params: loaderParams } = queryState
    return loader(toRaw(loaderParams))
  } else {
    const request = manager.type === 'object' ? searchObject : searchList
    return request({
      sql: queryState.sql,
      params: queryState.params,
      sortby: queryState.orderby
    })
  }
}

export function setupData(store: StdFormStore, dataGroup: DefaultValueItem[]) {
  const setupMethod = store.actionType === StdFormAction.ADD ? 'init' : 'update'

  store.relationRegister.relations.forEach((relation) => {
    const defaultData = dataGroup.find((data) => data['@@target'] === relation.id)
    if (relation.manager) {
      let initData: any

      if (defaultData) {
        if (defaultData.data instanceof Array) {
          initData =
            setupMethod === 'update' ? [...defaultData.data] : [...relation.manager.defaultValue()]
        } else if (typeof defaultData.data === 'object') {
          initData = Object.assign({}, relation.manager.defaultValue(), defaultData.data)
        }
      }

      relation.manager[setupMethod](initData)
      // ;(relation.manager as RefManagerArray<any>).ref
    }
  })
}
