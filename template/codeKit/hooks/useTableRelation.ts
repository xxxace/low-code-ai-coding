import { reactive } from 'vue'
import type { Ref } from 'vue'

export interface TableRelation {
  name?: string
  ref: Ref<any>
  primaryKey: string | string[]
  foreignKey: string | string[]
  children?: TableRelation[]
}

export interface TableRelationManager {
  state: TableRelation
  init: () => Promise<void>
  removeChild: <R>(ref: R, parentRows: any[]) => Promise<void>
}

export function useTableRelation(relation: TableRelation): TableRelationManager {
  const state = reactive({
    ...relation
  })

  const init = async () => {
    if (!state.children) return
    for (const child of state.children) {
      await child.ref.init()
    }
  }

  const removeChild = async <R>(ref: R, parentRows: any[]) => {
    const currentRelation = findRef<R>(ref)
    if (currentRelation && currentRelation.children && currentRelation.children.length) {
      const primaryKeys = Array.isArray(currentRelation.primaryKey)
        ? currentRelation.primaryKey
        : [currentRelation.primaryKey]
      const foreignKeys = Array.isArray(currentRelation.foreignKey)
        ? currentRelation.foreignKey
        : [currentRelation.foreignKey]
      const allKeys = [...primaryKeys, ...foreignKeys]

      for (const row of parentRows) {
        for (const child of currentRelation.children) {
          const { fullData } = child.ref.getTableData()

          if (!fullData.length) continue

          const removeRows: any[] = fullData.filter((item) =>
            allKeys.every((key) => row[key] === item[key])
          )

          await child.ref.remove(removeRows)
        }
      }
    }
  }

  const findRef = <R>(ref: R) => {
    if (state.ref === ref) {
      return state
    }

    if (!state.children || !state.children.length) return

    function walk(children: TableRelation[]) {
      for (const child of children) {
        if (child.ref === ref) {
          return child
        }
        if (child.children && child.children.length) {
          return walk(child.children)
        }
      }
    }

    return walk(state.children)
  }

  return { state, init, removeChild }
}
