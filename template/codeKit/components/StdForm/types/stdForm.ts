import { RefManager, RefManagerArray } from '../../../hooks/useRefManager'
import { TableRelationManager } from '../../../hooks/useTableRelation'

export interface StdFormProps {
  id?: string
  tableRelation?: TableRelationManager
}

export enum OrderStatus {
  Idle = 'BL_IDLE',
  Draft = 'BL_D',
  Submitted = 'BL_S',
  Review = 'BL_R',
  Approved = 'BL_A',
  Finished = 'BL_F',
  Cancel = 'BL_C',
  Archived = 'BL_O',
  Sign = 'BL_E',
  Paid = 'BL_P'
}

export enum ColumnType {
  NUMBER = 'NUMBER',
  DATE = 'DATE'
}

export enum KeyType {
  PRIMARY = 'PRIMARY',
  FOREIGN = 'FOREIGN'
}

export interface DataColumn {
  field: string
  type?: ColumnType
  notNull?: boolean
  key?: KeyType
  defaultValue?: any
  description?: string
}

export interface DataTable {
  tableName: string
  columns: DataColumn[]
}

export interface SQLConfig {
  sql?: string
  sqlName?: string
  exclude?: string[]
  oderby?: string
}

export interface TableRelation {
  table: string
  primaryKey: string | string[]
  foreignKey: string | string[]
}

export type SQLQuery = {
  sql: string
  params: Record<string, any>
  orderby: string
}

export type DataLoader = {
  loader: ((params?: Record<string, any>) => object) | ((params?: Record<string, any>) => Promise<object>)
  params?: Record<string, any>
  options?: Record<string, any>
}

export type StdFormTableQuery =
  | SQLQuery
  | ((dataSource) => SQLQuery)
  | DataLoader
  | ((dataSource) => DataLoader)

export interface StdFormRelation<T> {
  id: string
  parentId?: string
  table: DataTable
  sqlQuery?: StdFormTableQuery
  manager?: RefManager<T> | RefManagerArray<T>
  relations?: TableRelation[]
}

export interface RelationTree<T> {
  relation: StdFormRelation<T>
  children: RelationTree<T>[]
}

export type ValueChange = {
  id: string
  oldValue: any
  newValue: any
}

export type StdFormValueChanges = ValueChange[]

// interface OrderStatusOperation {
//   status: OrderStatus
//   backward: () => OrderStatus
//   forward: () => OrderStatus
// }

// class StateMachine {
//   operation: OrderStatusOperation | null = null
//   operationMap: Map<OrderStatus, OrderStatusOperation> = new Map()

//   setOperation(operation: OrderStatusOperation) {
//     this.operation = operation
//   }

//   registerOperation(operation: OrderStatusOperation) {}

//   async forward() {
//     if (!this.operation) throw new Error('No operation')
//     try {
//       const status = this.operation.forward()
//       const forwardOperation = this.operationMap.get(status)
//       forwardOperation && this.setOperation(forwardOperation)
//     } catch (e) {
//       console.error(e)
//     }
//   }

//   async
// }
