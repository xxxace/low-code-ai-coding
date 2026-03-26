import { DataTable } from './DataTable'

export class DataSet {
  name: string = ''
  Tables: { [tableName: string]: DataTable } = {}

  constructor(name: string) {
    this.name = name
  }

  Add(table: DataTable | string): DataTable {
    if (typeof table === 'string') {
      table = new DataTable(table)
    }
    this.Tables[table.tableName] = table
    return table
  }
}
