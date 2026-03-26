export type WorkLineVO = {
  WCSEQ: number //产线序号
  CNAME: number //产线名称
  V_ORIGINNAME: number //工业区名称
  V_FTYNAME: number //工厂名称
}

export type ViewOnlyVO = {
  searchText: string
  PSSEQ: number
  TSKSEQ: number
  TSKNO: string //任务号
  STYSEQ: number
  STYNO: string //款号
  V_STYNAME: string //款式名称
  V_ORDNO: string //批号
  V_PMNO: string //合约号
  V_ORIGINNAME: string //工业区
  V_FTYNAME: string //工厂
}

export type PSTASKJOB_VO = {
  PSSEQ: number
  TSKSEQ: number
  JOBSEQ: number
  JOBNO: string //工序编码
  V_JOBNAME: string //工序名称
  TSKNO: string //任务号
  STYSEQ: number
  STYNO: string //款号
  V_STYNAME: string //款式名称
  V_ORDNO: string //批号
  V_PMNO: string //合约号
  STFG: string //状态编码
  STDT: string //状态日期
  V_STFGNAME: string //状态名称
  CLNAME: string //颜色
  V_ORIGINNAME: string //工业区
  V_FTYNAME: string //工厂
  WCSEQ: number //产线序号
  V_WCNAME: string //产线名称
  BEGDT: string //计划开工日期
  ENDDT: string //计划完工日期
  QTY: number //计划数量
  UNIT: string //单位
  V_PRDQTY: number //已完成数量
  HSQTY: number //可调整数量
  RMK: string //备注
}

export type PSTASKJOB_EDIT_VO = PSTASKJOB_VO & {
  EDIT_QTY: number
  parentId: number
  children?: PSTASKJOB_EDIT_VO[]
}
