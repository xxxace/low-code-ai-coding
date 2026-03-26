import { VxeTableDefines, VxeTableInstance } from 'vxe-table'

export type PresetMenuItem = 'removeRow'
export type PresetMenuItemGetter = () => {
  code: PresetMenuItem
  visibleMethod: (row: any) => boolean
}
export type PresetKeyOrMenuItemOption =
  | PresetMenuItem
  | PresetMenuItemGetter
  | VxeTableDefines.MenuFirstOption

export type EditableTableInstance<T> = VxeTableInstance<any> & {
  getCurrentRow: () => T
  addRow: (row: T, targetRow?: any) => Promise<T>
  remove: (rows: T[]) => Promise<T[] | undefined>
  removeRow: () => void
  removeVisibleRow: () => Promise<any[] | undefined>
  refreshCurrentRow: () => void
  registerMenuItem: (keyOrItem: PresetKeyOrMenuItemOption) => void
  updateRowField: (row: T, field: keyof T | string, value: any) => void
  filter: (params: Partial<T>) => void
  init: () => void
  setCurrentCell: (
    row: any,
    fieldOrColumn: string | VxeTableDefines.ColumnInfo<any>
  ) => Promise<void>
}
