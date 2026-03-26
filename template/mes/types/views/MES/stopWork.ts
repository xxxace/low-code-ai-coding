export type EXREQFormDTO = {
  REQSEQ: number //主键  序号从EXREQ$SEQ.NEXTVAL 取
  REQNO: string //单号同REQSEQ一样
  REQDATE: string //单据日期
  REQSTAFF: string //制单人 申请人
  FTYNO: string //工厂编码
  V_FTYNAME: string //工厂名称
  DEPTNO: string //部门编码
  V_DEPTNAME: string //部门名称
  JOBNO: string //工序编码
  V_JOBNAME: string //工序名称
  RMK: string //停工原因
  REF1: string //备用字段
  REF2: string //备用字段
  REF3: string //备用字段
  STFG: string //状态
  V_STFGNAME: string //状态名称
  STDT: string //状态日期
  STREASON: string //状态原因
  ADDUSER: string //制单人
  ADDDTTM: string //制单时间
  UPDUSER: string //修改人
  UPDDTTM: string //修改时间
}

export type EXREQLSTItemDTO = {
  REQSEQ: number //主表序号 关联EXREQ.REQSEQ
  LSTSEQ: number //子表序号
  WCSEQ: number //产线序号
  POSTNO: string //职位编码
  EMPNO: string //工号
  BEGDT: string //开始日期 要到时间
  ENDDT: string //结束日期 要到时间
  HRS: number //时数
  RMK: string //备用字段
  REF1: string //备用字段
  REF2: string //备用字段
  REF3: string //备用字段
  ADDUSER: string //制单人
  ADDDTTM: string //制单时间
  UPDUSER: string //修改人
  UPDDTTM: string //修改时间
}

export type PSTASKJOB_StopWorkDTO = {
  PSSEQ: number
  TSKSEQ: number
  JOBSEQ: number
  JOBNO: string //工序编码
  JOBNAME: string //工序名称
  TSKNO: string //任务号
  STYSEQ: number
  STYNO: string //款号
  V_STYNAME: string //款式名称
  ORDNO: string //批号
  PMNO: string //合约号
  STFG: string //状态编码
  STFGNAME: string //状态名称
  STDT: string //状态日期
  STREASON: string //状态原因
  STFGTYPE: string //状态类型
  V_STRENAME: string //状态类型名称
  V_STFGTYPE: string //状态类型
  STFGREQBY: string //状态申请人
  STFGREQDATE: string //状态申请日期
  APPROVALBY: string//状态批核人
  APPROVALDATE: string//状态批核日期
  MIN_WKDATE: string //计划开工日期
  MAX_WKDATE: string //计划完工日期
  QTY: number //计划数量
  RMK: string //备注
}

// export type PSTASKJOB_StopWorkDTO = {
//   PSSEQ: number
//   TSKSEQ: number
//   JOBSEQ: number
//   JOBNO: string //工序编码
//   V_JOBNAME: string //工序名称
//   TSKNO: string //任务号
//   STYSEQ: number
//   STYNO: string //款号
//   V_STYNAME: string //款式名称
//   ORDNO: string //批号
//   PMNO: string //合约号
//   STFG: string //状态编码
//   V_STFGNAME: string //状态名称
//   STDT: string //状态日期
//   STREASON: string //状态原因
//   STFGTYPE: string //状态类型
//   V_STFGTYPENAME: string //状态类型名称
//   V_STFGTYPE: string //状态类型
//   STFGREQBY: string //状态申请人
//   STFGREQDATE: string //状态申请日期
//   APPROVALBY: string//状态批核人
//   APPROVALDATE: string//状态批核日期
//   BEGDT: string //计划开工日期
//   ENDDT: string //计划完工日期
//   QTY: number //计划数量
//   RMK: string //备注
// }