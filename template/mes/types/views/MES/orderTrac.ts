export type OrderVO = {
  ORDSEQ: number
  ORDNO: string
  CLNT: string
  CLNTNAME: string
  EQMCAT: string
  EQMMOD: string
  ORDQTY: number
}

export type OrderColorVO = {
  ORDSEQ: number
  CLSEQ: number
  ORDNO: string
  CCL: string
  ECL: string
  ORDQTY: number
}

export type OrderColorItemVO = {
  ORDSEQ: number
  CLSEQ: number
  ORDNO: string
  CCL: string
  ECL: string
  ORDQTY: number
}

export type ProcessingContractVO = {
  ORDSEQ: number
  CLSEQ: number
  PMSEQ: number
  PMNO: string
  PMDT: string
  STFG: string
  // 牌数
  TKTQTYS: number
  // 数量
  PMQTY: number
  // 待产数量
  UNRECQTY: number
  // 在产数量
  HSRECQTY: number
  // 完工数量
  FINISHQTY: number
}

export type ProcessJobVO = {
  ORDSEQ: number
  CLSEQ: number
  PMSEQ: number
  PMNO: string
  PMDT: string
  STFG: string
  // 工序编号
  JOBNO: string
  // 工序名称
  CNAME: string
  // 上一个工序
  LAST_JOBNO: string
  // 持单=上一工序完成的数量
  CD_QTY: number
  // 待产=持单数量-已经发的数量
  DC_QTY: number
  // 在产=当前工序已经发的数量-当前工序已经收的数量
  ZC_QTY: number
  // 已生产数量
  YSC_QTY: number
  // 开始时间
  BETDT: string
  // 结束时间
  ENDDT: string
  // 状态
  STFGNAME: string
  // 最小牌仔数量
  MIN_TKTSEQ: number
  // 最大牌仔数量
  MAX_TKTSEQ: number
  // 最小标签数量
  MIN_LABSEQ: number
  // 最大标签数量
  MAX_LABSEQ: number
}

export type RFIDItemVO = {
  ORDSEQ: number
  CLSEQ: number
  PMSEQ: number
  PMNO: string
  PMDT: string
  STFG: string
  // 工序编号
  JOBNO: string
  // 牌号
  TKTSEQ: number
  // 件号
  LABSEQ: number
  // 员工
  STAFF: string
  //
  DTIME: string
  //
  RTIME: string
  // 收货件数
  RQTY: number
  // 次品件数
  BADQTY: number
  // 生产时间（小时）
  WKHRS: string
  // 生产效率=生产时间（小时）/总生产件数=即一件用时多长时间
  WKRATE: string
}

