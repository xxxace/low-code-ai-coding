import { DataColumn } from './DataColumn'
import { DataRow } from './DataRow'

export class DataTable {
  tableName: string = ''
  columns: DataColumn[] = []
  rows: DataRow[] = []
  primaryKey: DataColumn | null = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  newRow() {
    const row = new DataRow()
    row.setTable(this)
    return row
  }

  addRow(row: DataRow) {
    this.rows.push(row)
  }

  removeRow(row: DataRow) {
    const index = this.rows.indexOf(row)
    if (index !== -1) {
      this.rows.splice(index, 1)
    }
  }

  removeRowAt(index: number) {
    if (index >= 0 && index < this.rows.length) {
      this.rows.splice(index, 1)
    }
  }
}
