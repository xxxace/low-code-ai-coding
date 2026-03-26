import { RefManagerArray } from '@/hooks/nameson/useRefManager'
import { KeyType, RelationTree, StdFormRelation } from '../types/stdForm'

export class RelationRegister {
  readonly relations: StdFormRelation<any>[] = []
  root: RelationTree<any> | null = null
  private tempList: StdFormRelation<any>[] = []

  register<T>(relation: StdFormRelation<T>) {
    if (this.relations.some((r) => r.id === relation.id)) return

    let isAddSuccess = false

    if (this.root === null) {
      this.root = {
        relation,
        children: []
      }
      isAddSuccess = true
    } else {
      isAddSuccess = this.addChild(this.root, relation)
    }

    if (!isAddSuccess) {
      this.tempList.push(relation)
    } else {
      this.relations.push(relation)

      if (this.tempList.length > 0) this.register(this.tempList.shift()!)
    }
  }

  addChild<T>(parent: RelationTree<T>, relation: StdFormRelation<T>) {
    let flag = false

    if (parent.relation.id === relation.parentId) {
      parent.children.push({
        relation,
        children: []
      })
      flag = true
    }

    for (const child of parent.children) {
      flag = this.addChild(child, relation) || flag
    }

    return flag
  }

  getPrimaryKey(item: StdFormRelation<any>) {
    return item.table.columns.find((col) => col.key === KeyType.PRIMARY)
  }

  getPrimaryKeyList(item: StdFormRelation<any>) {
    return item.table.columns.filter((col) => col.key === KeyType.PRIMARY)
  }

  getDefaultValue(item: StdFormRelation<any>) {
    return item.table.columns.reduce((acc, cur) => {
      if (cur.defaultValue !== null && cur.defaultValue !== undefined) {
        acc[cur.field] = cur.defaultValue
      }
      return acc
    }, {})
  }

  getSqlQueryList(item: RelationTree<any>) {
    const sqlQueryList = [item.relation.sqlQuery]

    if (item.children.length > 0) {
      for (const child of item.children) {
        sqlQueryList.push(...this.getSqlQueryList(child))
      }
    }

    return sqlQueryList
  }

  getParentRelation(item: StdFormRelation<any>) {
    return this.relations.find((relation) => relation.id === item.parentId)
  }

  getIndexFields(item: StdFormRelation<any>) {
    return item.table.columns.filter((col) => col.key)
  }

  async tableRowRemove<R>(ref: R, sourceRows: any) {
    const node = this.findNode(this.root, (item: RelationTree<any>) => {
      const manager = item.relation.manager
      if (manager && manager.type === 'array') {
        return (manager as RefManagerArray<any>).ref === ref
      }
      return false
    })

    if (node && node.children.length > 0) {
      const indexColumns = this.getIndexFields(node.relation)
      const allKeys = indexColumns.map((col) => col.field)

      for (const row of sourceRows) {
        for (const child of node.children) {
          const manager = child.relation.manager
          if (!manager) throw new Error('manager is undefined')

          const vxeTableRef = (manager as RefManagerArray<any>).ref
          const { fullData } = vxeTableRef.getTableData()

          if (!fullData.length) continue

          const removeRows: any[] = fullData.filter((item) =>
            allKeys.every((key) => row[key] === item[key])
          )

          await vxeTableRef.remove(removeRows)
        }
      }
    }
  }

  findNode(
    item: RelationTree<any> | null,
    validator: (item: RelationTree<any>) => boolean
  ): RelationTree<any> | null {
    if (!item) return null
    if (validator(item)) return item

    for (const child of item.children) {
      const result = this.findNode(child, validator)

      if (result) return result
    }

    return null
  }

  getNestedProperty<T, K extends keyof T>(obj: T, key: K) {
    const value = obj[key]
    if (!value) {
      throw new Error(`Property ${key as string} not found in object`)
    }
    return value
  }
}
