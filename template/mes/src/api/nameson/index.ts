import request from '@/utils/request'
import { generateWhere } from '@nameson/sqlutils'
import type { RequestResponse } from '@/utils/axios/types'
import { ElMessage as message } from 'element-plus'

type SearchParams = {
  sql: string
  params?: Record<string, any>
  sortby?: string
}

export const getAction = <T>(url: string, params: Record<string, any>) => {
  return request.request<RequestResponse<T>>({
    method: 'get',
    url,
    params
  })
}

export const postAction = <T>(url: string, data?: Record<string, any>) => {
  return request.request<RequestResponse<T>>({
    method: 'post',
    url,
    data: data || {}
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

export type SearchNewParams = {
  objectId: number
  tabseq: number
  params: Record<string, any> | undefined
}
export const searchData_new = <T>(params: SearchNewParams) => {
  return postAction<T>('/SearchData_new', {
    p_objectid: params.objectId,
    p_tabseq: params.tabseq,
    p_Where: params.params ? generateWhere(params.params) : ''
  })
}

export const searchObject = async <T>(params: SearchParams) => {
  try {
    const res = await searchData<T[]>(params)
    if (res.statusCode != '1' && res.message.indexOf('数据为空') === -1)
      message.warning(res.message)
    return res.data[0] || null
  } catch (e: any) {
    message.error(e.message)
    return null
  }
}

export const searchList = async <T>(params: SearchParams) => {
  try {
    const res = await searchData<T>(params)
    if (res.statusCode != '1' && res.message.indexOf('数据为空') === -1)
      message.warning(res.message)
    return res.data || []
  } catch (e: any) {
    message.error(e.message)
    return []
  }
}

export const fetchPrimaryKey = async (tableName: string, count?: number) => {
  const res = await searchData<{ PK: number }[]>({
    sql: `SELECT ${tableName}$SEQ.NEXTVAL PK
              FROM DUAL CONNECT BY LEVEL <= ${count || 1}`
  })

  if (res.statusCode !== '1' || res.data.length < 1) {
    throw Error(res.message)
  }

  return res.data.map((item) => item.PK)
}

export const fetchBillNo = async (
  pOBJECTID: number,
  p_BillRowModel: { COLNAME: string; COLDATA: string; ISDATETIME: 'Y' | 'N' }[]
) => {
  try {
    const res = await postAction<{ BILLNO: string }[]>('/GetBillCodeValue', {
      pOBJECTID,
      p_BillRowModel: JSON.stringify(p_BillRowModel)
    })

    if (res.statusCode !== '1') {
      message.warning(res.message)
    } else {
      return res.data[0].BILLNO
    }
  } catch (e: any) {
    message.error(e.message)
  }
}

export type SearchPrjobjitemParams = {
  p_Objectid: number
}

export type PrjobjItem = {
  CHSNAME: string // 中文名称
  CHTNAME: string // 繁体中文名称
  COLWIDTH: number // 列宽
  CTIPTEXT: string // 中文提示文本
  DECIMALLENG: number // 小数位数
  ENGNAME: string // 英文名称
  ETIPTEXT: string // 英文提示文本
  ISAMOUNT: 'N' | 'Y' // 是否为金额
  ISEDIT: 'N' | 'Y' // 是否可编辑
  ISLOCK: string // 锁定状态
  ISNOC: 'y' | 'n' // 是否为非货币字段
  ISNUMBER: 'N' | 'Y' // 是否为数字字段
  ITEMID: number // 项目ID
  ITEMNAME: string // 项目名称
  ITEMTYPE: string // 项目类型
  LOCNAME: string // 位置名称
  LTIPTEXT: string // 中文提示文本
  OBJECTID: number // 对象ID
  VISIBLE: boolean // 是否可见
}
export const searchPrjobjitem = async (params: SearchPrjobjitemParams) => {
  try {
    const res = await postAction<PrjobjItem[]>('/SearchPrjobjitem', params)
    // console.log('res', res)
    if (res.statusCode != '1' && res.message.indexOf('数据为空') === -1)
      message.warning(res.message)
    return res.data || []
  } catch (e: any) {
    console.log('err', e)
    message.error(e.message)
    return null
  }
}

export const SearchDatafy_new = (params) => {
  return postAction('/SearchDatafy_new', {
    p_objectid: params.objectId,
    p_tabseq: params.tabseq,
    p_Where: params.params ? generateWhere(params.params) : '',
    pPagecur: params.pageNo,
    pPagesize: params.pageSize
  })
}
