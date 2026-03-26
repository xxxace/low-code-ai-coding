export type JobSummaryVO = {
  FINISHQTY: number
  PM_QTY: number
  PRDQTY: number
  PRDRATE: number
}


export type JobEntryItemVO = {
  JOBNO:string
  // 工序名称
  CNAME:string
  // 工厂名称
  FTYNAME:string
  // 产线名称
  WCNAME:string
  // 批号
  ORDNO:string
  // 合约
  PMNO:string
  // 颜色
  CLNAME:string
  // 状态
  STFGNAME:string
  // 总件数
  PMQTY:string
  // 持单=上一工序完成的数量
  CD_QTY:string
  // 待产=持单数量-已经发的数量
  DC_QTY:string
  // --在产=当前工序已经发的数量-当前工序已经收的数量
  ZC_QTY:string
  // 已生产数量
  YSC_QTY:string
  // 估计用时
  STD_WKHRS:number
  // 完成用时
  WKHRS:number
  // 在制品累计停留时间
  PRD_WKHRS:number
  // 标准效率%
  STD_PCT:number
  // 实际效率%
  ACT_PCT:number
}