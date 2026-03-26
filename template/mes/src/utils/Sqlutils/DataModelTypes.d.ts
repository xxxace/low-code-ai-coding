export type Coldatasource = Record<string, any> | null | undefined

export type ColdataDataType = 'NUMBER' | 'DATE'

export type Coldata = {
  Colname: string
  OldData: string | number | null | undefined
  NewData: string | number | null | undefined
  DataType?: ColdataDataType
}

export type KeyTypeMapConfig = {
  NUMBER?: string[]
  DATE?: string[]
}

export type KeyTypeMap = {
  [key: string]: ColdataDataType
}

export interface IDataModel {
  user: string
  Tablename: string
  DataType: DataType
  PKvalues: Record<string, string | number>
  Coldatas: Coldata[]
  exclude: string[]
  keyTypeMap: KeyTypeMap
}

export type ColdataModel = {
  Tablename: string
  DataType: DataType
  PKvalues: string
  Coldatas: string
}

export type MetadataField = {
  ADDUSER?: string
  ADDDTTM?: string
  UPDUSER?: string
  UPDDTTM?: string
}
