export type WorkOrderVO = {
  PSSEQ: number
  PSTY: number
  TSKSEQ: number
  ORDSEQ: number
  WCSEQ: number //主键关联
  TSKNO: number//计划号
  PSNO: string //工单号
  WKDATE: string //排产日期
  STAFF: string //签收人
  PSDT: string //签收日期
  ORDNO: string //批号
  STYNO: string //款号(没有从2020系统中同步过来的为空)
  V_DEPTNAME: string //部门
  V_WCNAME: string //产线
  WCBOOS: string //线长
  BLK_SPG: number //负荷
  V_CLCNAME: string //颜色组
  BRAND_RANGE: string //牌号范围
  MACFPNUM: number //机台/人数
  MACNUM: string // 机台号
  QTY: number //今日目标数
  V_TDOVQTY: number //今日完工
  V_TDOVPAQTY: number //今日完工进度
  V_NEQTY: number //持单数
  V_ALLOVQTY: number //积累完工
  V_ALLOVPAQTY: number //总完成进度
  V_PDEY: number //生产效率
  V_STDEY: number //标准效率
  V_LOSRATIO: number //损耗比例
  V_OKRATIO: number //良品率
  V_REWORKQTY: number //返工数量
  SOP: string //SOP(链接)
  STFG: string //状态
  V_STFGNAME: string //状态名称
}

export type MaterialDetailVO = {
  PSSEQ: number
  TSKSEQ: number
  JOBSEQ: number
  MATSEQ: number
  MATID: number
  SPECID: number
  V_MATNO: string //物料编码
  V_MATNAME: string //物料名称
  V_SPECNO: string //色号
  V_CNAME: string //色名
  V_VAT: string //缸号
  V_INQTY: number //收料数
  QTY: number //需求数
  OSQTY: number //发料数
  WST: number //耗用数
  V_OTQTY: number //剩余数
  V_PST: number //消耗比例
}

export type ProcessDetailVO = {
  PSSEQ: number
  TSKSEQ: number
  JOBTY: string
  WCSEQ: number
  ORDSEQ: number
  PMSEQ: number
  JOBNO: string //工序编码
  V_JOBCNAME: string //工序名称
  JOBSEQ: number //制造序号
  STDHRS: number //标准工时
  V_PS_WKNUM: number //机台数
}
