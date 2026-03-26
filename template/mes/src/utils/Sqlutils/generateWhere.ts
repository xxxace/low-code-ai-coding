import { isDef } from './utils'

export interface OperatorMap {
  [key: string]: { operator: string; value: (key: string, val: string | number) => string }
}

const operator: OperatorMap = {
  __like: { operator: 'LIKE', value: (key, val) => `${key} LIKE '%${val}%'` },
  __lt: { operator: '<', value: (key, val) => `${key} < '${val}'` },
  __lte: { operator: '<=', value: (key, val) => `${key} <= '${val}'` },
  __ne: { operator: '<>', value: (key, val) => `${key} <> '${val}'` },
  '__lte@date': { operator: '<=', value: (key, val) => `TO_CHAR(${key},'YYYY-MM-DD') <= '${val}'` },
  __gt: { operator: '>', value: (key, val) => `${key} > '${val}'` },
  __gte: { operator: '>=', value: (key, val) => `${key} >= '${val}'` },
  '__gte@date': { operator: '>=', value: (key, val) => `TO_CHAR(${key},'YYYY-MM-DD') >= '${val}'` },
  __is: { operator: 'IS', value: (key, val) => `${key} IS ${val}` }
}

export function generateWhere(query: Record<string, string | number>): string {
  return Object.entries(query)
    .filter(([_, val]) => isDef(val))
    .map(([key, val], i, arr) => {
      const suffix = i === arr.length - 1 ? '' : ' AND '
      if (key === '$$SQL') return `${val}${suffix}`

      const [field, mark] = key.split('__')
      const op = operator[`__${mark}`]
      return op ? `${op.value(field, val)}${suffix}` : `${field} = '${val}'${suffix}`
    })
    .join('')
}
