import { diffItem, generateDataModel, generateWhere } from '@nameson/sqlutils'
import qs from 'qs'
import Request from '../src/utils/axios'
import { Locale, type I18nData } from '@nameson/vite-plugin-t-extractor'

const request = new Request({
  baseURL: 'http://10.3.201.220:912/JsonService.asmx',
  timeout: 2 * 60 * 1000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  interceptors: {
    requestInterceptor: (config) => {
      if (config.method === 'post') {
        config.data.p_user = 'WEB'
        config.data.p_sessionID = 1
        config.data = qs.stringify(config.data)
      }

      return config
    }
  }
})

type SearchParams = {
  sql: string
  params?: Record<string, any>
  sortby?: string
}

type RequestResponse<T> = {
  statusCode: '-1' | '0' | '1'
  data: T[]
  message: string
}

export const getAction = <T>(url: string, params: Record<string, any>) => {
  return request.request<RequestResponse<T>>({
    method: 'get',
    url,
    params
  })
}

export const postAction = <T>(url: string, data: Record<string, any>) => {
  return request.request<RequestResponse<T>>({
    method: 'post',
    url,
    data
  })
}

export const searchData = <T>(params: SearchParams) => {
  return postAction<T>('/SearchData', {
    p_Dbquery: params.sql,
    p_Where: params.params ? generateWhere(params.params) : '',
    p_sortby: params.sortby || ''
  })
}

export const saveData = (data: any[]) => {
  return postAction('/SaveDatas', {
    p_DataModel: JSON.stringify(data)
  })
}

export const searchObject = async <T>(params: SearchParams) => {
  try {
    const res = await searchData<T>(params)
    if (res.statusCode != '1') console.log(res.message)
    return res.data[0] || null
  } catch (e: any) {
    console.log(e.message)
    return null
  }
}

export const searchList = async <T>(params: SearchParams) => {
  try {
    const res = await searchData<T>(params)
    if (res.statusCode != '1') console.log(res.message)
    return res.data || []
  } catch (e: any) {
    console.log(e.message)
    return []
  }
}

export async function i18nKeyUploader(objectName: string, i18nData: I18nData) {
  // 根据objectName获取objectId
  const prjobject = await getPrjobject(objectName)
  // 如果获取到了objectId则获取明细，没有则报错
  if (!prjobject || !prjobject.OBJECTID) throw new Error(`未找到${objectName}对应的prjobject对象！`)
  // 获取翻译明细
  const prjobjitems = await getPrjobjectItem(prjobject.OBJECTID)
  // 比较差异
  const sc = i18nData[Locale.zh_cn]
  const newItems = Object.entries(sc).map(([key, value]) => {
    return {
      OBJECTID: prjobject.OBJECTID,
      ITEMNAME: key,
      CHSNAME: value,
      CHTNAME: i18nData[Locale.zh_hk][key]
    }
  })
  let maxItemId = Math.max(...prjobjitems.map((item) => item.ITEMID), 0)

  const diffItems = diffItem(
    newItems,
    prjobjitems,
    (a, b) => a.OBJECTID === b.OBJECTID && a.ITEMNAME === b.ITEMNAME
  )
  // 如果有差异则更新
  if (diffItems.length > 0) {
    const postList: any[] = []
    const dataModel = generateDataModel({
      tableName: 'PRJOBJITEM',
      user: 'WEB'
    })

    for (const item of diffItems) {
      const [newItem, oldItem] = item
      if (newItem && oldItem) newItem.ITEMID = oldItem.ITEMID
      const ITEMID = (oldItem || newItem!).ITEMID

      dataModel.setPKvalues({
        OBJECTID: prjobject.OBJECTID,
        ITEMID: ITEMID || ++maxItemId
      })

      dataModel.setColdatas(newItem, oldItem)

      if (dataModel.hasColdatas()) postList.push(dataModel.build())
    }

    if (postList.length > 0) {
      console.log(`开始上传 ${objectName} 的数据`)
      // console.log(JSON.stringify(postList, null, 2))
      try {
        const res = await saveData(postList)
        if (res.statusCode !== '1') {
          throw new Error(res.message)
        } else {
          console.log(`${objectName} 的数据上传完毕`)
        }
      } catch (e) {
        console.log(e)
        throw e
      }
    }
  }
}

type Prjobject = {
  OBJECTID: number
  CNAME: string
}

type PrjobjectItem = {
  OBJECTID: number
  ITEMID: number
  ITEMNAME: string
  ENGNAME: string
  CHSNAME: string
  CHTNAME: string
  LOCNAME: string
  ADDUSER: string
  ADDDTTM: string
  UPDUSER: string
  UPDDTTM: string
}

// 根据objectName获取objectId
async function getPrjobject(objectName: string) {
  const sql = `SELECT OBJECTID,CNAME FROM PRJOBJECT`
  return (await searchObject<Prjobject>({
    sql,
    params: {
      ENAME: objectName
    }
  })) as Prjobject | null
}

// 根据objectId获取翻译明细
async function getPrjobjectItem(objectId: number) {
  const sql = `SELECT OBJECTID,ITEMID,ITEMNAME,CHSNAME,CHTNAME,ADDUSER,ADDDTTM,UPDUSER,UPDDTTM FROM PRJOBJITEM`
  return searchList<PrjobjectItem>({
    sql,
    params: {
      OBJECTID: objectId
    },
    sortby: 'ORDER BY ITEMID'
  }) as unknown as PrjobjectItem[]
}
