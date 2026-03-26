export interface IDataColumns {}

export interface IDataRow {}

export interface IDataTable {
  TableName: string
  Columns: IDataColumns[]
  Rows: IDataRow[]
  PrimaryKey: IDataColumns
}

export interface IDataSet {
  name: string
  Table: IDataTable[]
  Add: (table: IDataTable | string) => IDataTable
}
