import { toRef, type Ref } from 'vue'
import { postAction, SearchDatafy_new, searchData_new } from '@/api/nameson/index'
import { requestCache } from './useRequestCache'
import { useNamesonUserStore } from '@/store/modules/ns-user'

export type FetchSqlParams = {
  objectId: number
  tabseq: number
}

export type FetchSqlParamsWithObjectName = {
  objectName: string
}

export type Prjobjds = {
  DSNAME: string
  OBJECTID: number
  PK_COLNAMES: string
  RMK: string
  TABSEQ: number
}

export type RemoteSqlMap = Record<string, Prjobjds>
export type RemoteSqlMapRef = Ref<RemoteSqlMap>

export async function fetchSql(params: FetchSqlParams) {
  const sqls: Record<string, Prjobjds> = {}
  return await requestCache('new_' + params.objectId + '_' + (params.tabseq || 0), async () => {
    const res = (await postAction('/SearchPrjobjds_new', {
      p_Objectid: params.objectId,
      p_Tabseq: params.tabseq || 0
    })) as any
    console.log(res)
    if (res.statusCode == '1' && res.data.length) {
      res.data.forEach((item) => {
        sqls[item.DSNAME] = item
      })
      console.log(sqls)
      return sqls
    } else {
      return sqls
    }
  })
}

export const useFetchSqlEffect = (
  option: FetchSqlParams | FetchSqlParamsWithObjectName | string
) => {
  const remoteSqlMap = toRef(
    new Proxy(
      {},
      {
        get(target, prop) {
          return target[prop] || {}
        },
        has(target, prop) {
          console.log('has:', prop)
          return prop in target
        }
      }
    )
  )
  const loader = async () => {
    if (typeof option === 'string') {
      option = { objectName: option }
    }

    if ((option as FetchSqlParams).objectId) {
      remoteSqlMap.value = await fetchSql(option as FetchSqlParams)
    } else if ((option as FetchSqlParamsWithObjectName).objectName) {
      const objectId = useNamesonUserStore().getObjectId(
        (option as FetchSqlParamsWithObjectName).objectName
      )
      remoteSqlMap.value = await fetchSql({ objectId: objectId!, tabseq: 0 })
    }
  }

  return [remoteSqlMap, loader] as const
}

export const useFetchSql = (option: FetchSqlParams | FetchSqlParamsWithObjectName) => {
  const [remoteSqlMap, remoteSqlMapLoader] = useFetchSqlEffect(option)
  remoteSqlMapLoader()
  return remoteSqlMap as RemoteSqlMapRef
}

export type PaginationParams = {
  pageNo: number
  pageSize: number
}

// 分别定义带分页和不带分页的参数类型
export type WithPaginationParams = {
  pageNo: number
  pageSize: number
} & Record<string, any>
export type WithoutPaginationParams = Record<string, any> & {
  [K in 'pageNo' | 'pageSize']?: never
}

// 参数联合类型 - 供外部使用
export type SearchParamsUnion = WithPaginationParams | WithoutPaginationParams

export type PaginationResponse = {
  pagecur: string
  pagesize: string
  totalsize: string
}

export type NamesonResponse<T> = {
  statusCode: string
  message: string
  data: T
}

// 使用泛型和条件类型来精确推断返回类型
export interface SearchDataHandler {
  <T, P extends SearchParamsUnion>(
    method: string,
    params?: P
  ): P extends WithPaginationParams
    ? Promise<NamesonResponse<T> & PaginationResponse>
    : Promise<NamesonResponse<T>>
}

export function useNsSearchData(moduleName: string): SearchDataHandler {
  return async function <T, P extends SearchParamsUnion>(method: string, params?: P) {
    const objectId = useNamesonUserStore().getObjectId(moduleName)
    const remoteSqlMap = await fetchSql({ objectId: objectId!, tabseq: 0 })
    const { OBJECTID, TABSEQ } = remoteSqlMap[method]

    // 检查是否包含分页参数
    const hasPagination =
      params &&
      Object.prototype.hasOwnProperty.call(params, 'pageNo') &&
      Object.prototype.hasOwnProperty.call(params, 'pageSize')

    if (hasPagination) {
      const paramsCopy = { ...params }
      const pagination = {
        pageNo: paramsCopy.pageNo,
        pageSize: paramsCopy.pageSize
      }

      delete paramsCopy.pageNo
      delete paramsCopy.pageSize

      const result = await SearchDatafy_new({
        objectId: OBJECTID,
        tabseq: TABSEQ,
        params: paramsCopy || {},
        ...pagination
      })

      return result as unknown as NamesonResponse<T> & PaginationResponse
    } else {
      const result = await searchData_new({
        objectId: OBJECTID,
        tabseq: TABSEQ,
        params: params || {}
      })

      return result as unknown as NamesonResponse<T>
    }
  } as SearchDataHandler
}
