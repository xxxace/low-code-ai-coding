import dayjs from 'dayjs'
import isequal from 'lodash.isequal'
import type {
  IDataModel,
  Coldatasource,
  Coldata,
  ColdataDataType,
  KeyTypeMap,
  KeyTypeMapConfig,
  ColdataModel,
  MetadataField
} from './DataModelTypes.d.ts'
import { copy, isNotEmptyObject } from './utils'
import { ColdatasFactory } from './generateDataModel'

export enum DataType {
  ADD = 'I',
  UPDATE = 'U',
  DELETE = 'D'
}

export class DataModel implements IDataModel {
  user = ''
  Tablename = ''
  DataType = DataType.ADD
  PKvalues = {} as Record<string, string | number>
  Coldatas = [] as Coldata[]
  exclude = [] as string[]
  keyTypeMap = {} as KeyTypeMap

  constructor(Tablename: string, user?: string) {
    this.Tablename = Tablename
    this.user = user || ''
  }

  setColdatas(data: Coldatasource, oldData: Coldatasource) {
    data = data ? Object.assign({}, data) : data
    oldData = copy(oldData)

    if (isNotEmptyObject(data) && isNotEmptyObject(oldData)) {
      // 防止删除后新增因为主键相同而导致元数据为空被断定为更新
      if (!data.ADDUSER) data.ADDUSER = oldData.ADDUSER
      if (!data.ADDDTTM) data.ADDDTTM = oldData.ADDDTTM
      if (!data.UPDUSER) data.UPDUSER = oldData.UPDUSER
      if (!data.UPDDTTM) data.UPDDTTM = oldData.UPDDTTM
      this.setDataType(DataType.UPDATE)
    } else if (!isNotEmptyObject(data) && isNotEmptyObject(oldData)) {
      this.setDataType(DataType.DELETE)
    } else {
      // 新增时设置主键值
      this.updateData(data!)
      this.setDataType(DataType.ADD)
    }

    const coldatas = ColdatasFactory(data, oldData, this.keyTypeMap, this.exclude)
    if (coldatas.length) {
      const { UPDUSER, UPDDTTM } = oldData || {}
      const [metadataField, metaDataFieldColdatas] = this.getMetadataFieldColdatas(
        this.DataType,
        UPDUSER,
        UPDDTTM
      )
      data && Object.assign(data, metadataField)
      metaDataFieldColdatas && coldatas.push(...metaDataFieldColdatas)
    }

    this.Coldatas = coldatas
  }

  updateData(data: NonNullable<Coldatasource>) {
    Object.assign(data, this.PKvalues)
  }

  // 设置元数据字段 创建人 创建日期 修改人 修改日期
  getMetadataFieldColdatas(operationType: DataType, oldUPDUSER: string, oldUPDDTTM: string) {
    if (!operationType || !this.user) return []
    const data: MetadataField = {}

    if (operationType !== DataType.DELETE) {
      const currentDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      if (operationType === DataType.ADD) {
        data.ADDUSER = this.user
        data.ADDDTTM = currentDateTime
      }

      data.UPDUSER = this.user
      data.UPDDTTM = currentDateTime
    }

    return [
      data,
      ColdatasFactory(
        data,
        { UPDUSER: oldUPDUSER, UPDDTTM: oldUPDDTTM },
        { ADDDTTM: 'DATE', UPDDTTM: 'DATE' }
      )
    ] as const
  }

  setUser(user: string) {
    this.user = user
  }

  setKeyTypeMap(map: KeyTypeMapConfig) {
    const keyTypeMap: KeyTypeMap = {}
    if (map) {
      Object.keys(map).forEach((type) => {
        map[type as ColdataDataType]?.forEach((key) => {
          keyTypeMap[key] = type as ColdataDataType
        })
      })
    }
    this.keyTypeMap = keyTypeMap
  }

  setExclude(exclude: string[]) {
    this.exclude = exclude || []
  }

  setDataType(dataType: DataType) {
    this.DataType = dataType
  }

  setPKvalues(name: string | object, value?: any) {
    let pkValueMap: Record<string, string | number> = {}
    if (typeof name === 'string') {
      pkValueMap[name] = value
    } else {
      pkValueMap = Object.assign({}, name) as Record<string, string | number>
    }
    this.PKvalues = pkValueMap
  }

  getPKvaluesStr() {
    const strs: string[] = []
    Object.keys(this.PKvalues).forEach((key) => {
      let value = this.PKvalues[key]
      if (this.keyTypeMap[key] !== 'NUMBER') {
        value = `'${value}'`
      }
      strs.push(`${key}:${value}`)
    })

    return strs.join(',')
  }

  isEqual(newData: Coldatasource, oldData: Coldatasource) {
    return isequal(newData, oldData)
  }

  hasColdatas() {
    return this.DataType === DataType.DELETE || (this.Coldatas && this.Coldatas.length)
  }

  build(): ColdataModel {
    return {
      Tablename: this.Tablename,
      DataType: this.DataType,
      PKvalues: this.getPKvaluesStr(),
      Coldatas: JSON.parse(JSON.stringify(this.Coldatas))
    }
  }
}
