import { toRef, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { postAction, searchData_new } from '@/api/nameson/index'
import { getCacheValue, requestCache } from './useRequestCache'
import { useUserStore } from '@/store/modules/user'
import { useNamesonUserStore } from '@/store/modules/ns-user'
import { getObjectId } from '@/api/nameson/auth'

export type FetchSqlParams = {
  objectId: number
  tabseq: number
}

export type FetchSqlParamsWithObjectName = {
  objectName: string
}

export type Prjobjds = {
  TABNAME: string
  ORIGIN_DBQUERY: string
  DBQUERY: string
  SORTBYCONTENT: string
  PK_COLNAMES: string
  RMK: string
}

export type RemoteSqlMap = Record<string, Prjobjds>
export type RemoteSqlMapRef = Ref<RemoteSqlMap>

function removeOracleCommentsAndNewlines(sqlString: string) {
  if (!sqlString || typeof sqlString !== 'string') return sqlString
  // 正则表达式匹配 Oracle 单行注释、多行注释和换行符
  const regex = /(--.*$)|(\/\*[\s\S]*?\*\/)|(\n)/gm

  // 使用 replace 方法替换匹配的内容为空字符串
  return sqlString.replace(regex, ' ')
}

export async function fetchSql(params: FetchSqlParams) {
  const sqls: Record<string, Prjobjds> = {}
  return await requestCache<typeof sqls>(params.objectId + '_' + (params.tabseq || 0), async () => {
    const res = await postAction<Prjobjds[]>('/SearchPrjobjds', {
      p_Objectid: params.objectId,
      p_Tabseq: params.tabseq || 0
    })
    if (res.statusCode === '1' && res.data.length) {
      const { userInfo } = useUserStore()

      res.data.forEach((item) => {
        sqls[item.TABNAME] = item
        sqls[item.TABNAME].ORIGIN_DBQUERY = item.DBQUERY

        let sql = removeOracleCommentsAndNewlines(item.DBQUERY)
        if (sql && sql.toUpperCase().indexOf(`USERNO='{0}'`) !== -1) {
          sql = sql.replace(/\{0\}/g, userInfo?.username as string)
        }
        sqls[item.TABNAME].DBQUERY = sql
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
      const objectId = await getObjectId((option as FetchSqlParamsWithObjectName).objectName)
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

export const useFetchSqlByObjectId = (objectId: number) => {
  const option: FetchSqlParams = { objectId: objectId, tabseq: 0 }

  return useFetchSql(option)
}

export const useFetchSqlByRoute = () => {
  const route = useRoute()

  const option: FetchSqlParams = { objectId: route.meta.objectId as number, tabseq: 0 }

  return useFetchSql(option)
}

export const useFetchSqlByObjectName = (objectName: string) => {
  const option: FetchSqlParamsWithObjectName = { objectName }
  return useFetchSql(option)
}

export const useFetchSqlByRouteAsync = async () => {
  const route = useRoute()
  const option: FetchSqlParams = { objectId: route.meta.objectId as number, tabseq: 0 }
  return await fetchSql(option)
}

export const useRemoteSqlMap = (params: { objectId?: number; objectName?: string }) => {
  if (!params.objectId && !params.objectName) {
    throw new Error('objectId or objectName is required')
  }
  let objectId = params.objectId
  if (!objectId) {
    const prjobj = useNamesonUserStore().permissionList.find(
      (item) => item.ENAME === params.objectName
    )
    objectId = prjobj?.OBJECTID
  }

  return getCacheValue(`${objectId}_${0}`) as RemoteSqlMap
}

export async function fetchSqlNew(params: FetchSqlParams) {
  const sqls: Record<
    string,
    {
      OBJECTID
      TABSEQ
    }
  > = {}
  return await requestCache(params.objectId + '_' + (params.tabseq || 0), async () => {
    const res = await postAction<any>('/SearchPrjobjds_new', {
      p_Objectid: params.objectId,
      p_Tabseq: params.tabseq || 0
    })
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

export function useNsSearchData(moduleName: string) {
  return async function SearchDataHandler<T>(method: string, params: object) {
    const objectId = await getObjectId(moduleName)
    const remoteSqlMap = await fetchSqlNew({ objectId: objectId!, tabseq: 0 })
    const { OBJECTID, TABSEQ } = remoteSqlMap[method]
    return await searchData_new<T>({
      objectId: OBJECTID,
      tabseq: TABSEQ,
      params
    })
  }
}
