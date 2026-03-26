/*
 * @Author: 匹诺曹 1164698177@qq.com
 * @Date: 2025-07-28 10:51:03
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-28 11:01:45
 * @FilePath: \77_MES-APS\src\typings\rateOfProgress.d.ts
 * @Description: 工单进度
 */
declare namespace RateOfProgress {

  /** 权限列表 */
  namespace PermissionList {

    interface IPermissionListItem {
      ENAME: string,
      ISADD: string,
      ISAUD: string,
      ISDEL: string,
      ISFREQUENTLYUSED: string | null,
      ISQRY: string,
      ISUPD: string,
      MAPTYPE: string,
      OBJECTID: number,
      OBJNAME: string,
      OBJTY: string,
      PARENTID: number | null,
      REPORTURL: string | null,
      URL: string
    }
  }
}