import { useNamesonUserStore } from '@/store/modules/ns-user'
import { postAction, searchObject } from '.'
import type { UserLoginType } from '../login/types'

export type Prjuserobject = {
  ENAME: string
  ISADD: 'Y' | 'N'
  ISAUD: 'Y' | 'N'
  ISDEL: 'Y' | 'N'
  ISQRY: 'Y' | 'N'
  ISUPD: 'Y' | 'N'
  ISFREQUENTLYUSED: 'Y' | 'N' | null
  OBJECTID: number
  OBJNAME: string
  OBJTY: string
  PARENTID: null | number
  REPORTURL: string
  URL: string
}

export const Logon_JS = (data: UserLoginType) => {
  return postAction<number>('Logon_JS', {
    pUser: data.username,
    pPwd: data.password,
    pDBPwd: data.password,
    pPriv: true,
    pID: 1
  })
}
export const Logon_JS2 = (data: UserLoginType) => {
  return postAction<number>('Logon_JS2', {
    pUser: data.username,
    pPwd: data.password,
    pDBPwd: data.password,
    pPriv: true,
    pID: 1
  })
}

export const SearchPrjuserobject = async () => {
  const res = await postAction<Prjuserobject[]>('SearchPrjuserobject')

  if (res.statusCode === '1') {
    return res.data
  } else {
    throw new Error(res.message)
  }
}

export type UserInfoOA = {
  USERNO: string
  EMPNO: string
  SESSIONID: number
  ISMANAGER: 'Y' | 'N' | null
}
export const CheckUserOA = async (param: { loginid: string }) => {
  return await postAction<UserInfoOA>('CheckUser_OA', param)
}

export type Prjobject = {
  OBJECTID: number
  CNAME: string
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

export async function getObjectId(objectName: string) {
  const prjobj = useNamesonUserStore().permissionList.find((item) => item.ENAME === objectName)
  if (prjobj) return prjobj.OBJECTID
  const prjobject = await getPrjobject(objectName)
  return prjobject?.OBJECTID
}
