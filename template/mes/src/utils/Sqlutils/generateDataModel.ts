import { DataModel } from './DataModel'
import { Coldata, Coldatasource, KeyTypeMap } from './DataModelTypes'
import { isDef } from './utils'

export function ColdatasFactory(
  data: Coldatasource | Coldatasource[],
  oldData: Coldatasource | Coldatasource[],
  keyTypeMap: KeyTypeMap,
  exclude?: string[]
) {
  if (data instanceof Array || oldData instanceof Array) {
    // 这个情况可能没用，但又不想删除，所以在此做个记号
    // return [diffItem(data as Coldatasource[], oldData as Coldatasource[])]
    return []
  } else {
    return generateColdatas(data, oldData, keyTypeMap, exclude)
  }
}

export function generateDataModel(db: { tableName: string; user?: string }) {
  return new DataModel(db.tableName, db.user)
}

function unionKeys<T extends object>(...args: T[]) {
  return Array.from(new Set(args.map((item) => Object.keys(item)).flat()))
}

function generateColdatas(
  newObj: Coldatasource,
  oldObj: Coldatasource,
  keyTypeMap: KeyTypeMap,
  exclude?: string[]
) {
  if (!newObj) return []
  if (!oldObj) oldObj = {}

  const coldatas: Coldata[] = []
  const keys = unionKeys(newObj, oldObj)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    // 跳过exclude包含的key
    if (exclude && exclude.includes(key)) continue
    const keyType = keyTypeMap[key]
    let newVal = isDef(newObj[key]) ? newObj[key] : ''
    let oldVal = isDef(oldObj[key]) ? oldObj[key] : ''

    // 将文本转数字
    if (keyType === 'NUMBER') {
      newVal = typeof newVal !== 'number' && newVal ? Number(newVal) : newVal
      oldVal = typeof oldVal !== 'number' && oldVal ? Number(oldVal) : oldVal
    }

    // 2024-12-04 = 2024-12-04 00:00 = 2024-12-04 00:00:00
    if (keyType === 'DATE') {
      if (newVal && newVal.indexOf('00:00') > 0) newVal = newVal.split(' ')[0]
      if (oldVal && oldVal.indexOf('00:00') > 0) oldVal = oldVal.split(' ')[0]
    }

    if (newVal !== oldVal) {
      const coldata: Coldata = {
        Colname: key,
        OldData: oldVal,
        NewData: newVal
      }
      if (keyType) coldata.DataType = keyType
      coldatas.push(coldata)
    }
  }

  return coldatas
}
