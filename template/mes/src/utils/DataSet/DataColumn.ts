import { DataTable } from './DataTable'

export class DataColumn {
  private table: DataTable | null = null
  name: string = ''
  title: string = ''
  type: string = 'string'

  setTable(table: DataTable) {
    this.table = table
  }
}
