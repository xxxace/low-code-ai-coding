import { DataTable } from './DataTable'

export class DataRow {
  private table: DataTable | null = null
  private data: any = {}

  set(key: string, value: any) {
    this.data[key] = value
  }

  get(key: string) {
    return this.data[key]
  }

  setTable(table: DataTable) {
    this.table = table
  }

  valueOf() {
    return this.data
  }
}
