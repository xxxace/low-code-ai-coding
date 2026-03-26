export type ViewOnlyVO = {
  searchText: string //查询文本
  PMSEQ: number //合约序号
  PMNO: string //合约号
  V_PMQTY: number //合约数量
  BEGDT: string //開始日期
  ENDDT: string //完成日期
  insertQty: number //插单数量
  STYSEQ: number //款式ID
  STYNO: string //款号
  DELYDATE: string //交货日期
  WCSEQ: number //产线
  WCNAME: string //产线名称
  V_FTYNAME: string //工厂名称
}

export type PMOrderVO = {
  PMSEQ: number //合约序号
  PMNO: string //合约号
  STYSEQ: number //款式序号
  STYNO: string //款号
  DELYDATE: string //交期
  V_PMQTY: number //合约数量
  V_FTYNAME: string //工厂名称
}

export type FactoryVO = {
  PMSEQ: number // 合约序号
  FTYSEQ: number // 工厂序号
  FTYTY: string // 工厂类型
  FTYNO: string // 工厂编码
  V_FTYNAME: string // 工厂名称
  V_FTYTYNAME: string // 工厂类型名称
}

export type JOBVO = {
  JOBNO: string // 工序编码
  CNAME: string // 工序名称
}

export type ColorGroupVO = {
  PMSEQ: number
  CUTSEQ: number //分隔號
  CLSEQ: number //颜色序号
  CLNAME: string //顏色名稱
  QTY: number //數量
  FRNUM: number //牌號始
  TONUM: number //牌號止
  TKTQTY: number //牌數
}

//排产任务表,存储工厂在一个计划周期内,接受到的生产任务
export type PSTASK_DTO = {
  PSSEQ: number //主界面的PSSEQ
  TSKSEQ: number
  STYSEQ: number //款式序号
  QTY: number //插单数量
  UNIT: string //数量单位 默认PCS
  FTYSEQ: number //工厂序号
  FTYTY: string //工厂类型前整后整缝挑厂
  FTYNO: string //工厂序号
  RMK: string //插单备注
  ADDUSER: string
  ADDDTTM: string
  UPDUSER: string
  UPDDTTM: string
}

export type PSTASKORD_DTO = {
  PSSEQ: number
  TSKSEQ: number
  LSTSEQ: number //1
  ORDTY: string //单据类型 预单：PLORD 旬单：IQYORD 生产单：MO 合约：PM
  BILLID: number //單號ID 存PM.PMSEQ
  BILLNO: string //單號 存PM.PMNO
  PMSEQ: number //存PM.PMSEQ
  CLNTDTTO: string //交货日期
  QTY: number //插单数量
  UNIT: string //存PCS
  ADDUSER: string
  ADDDTTM: string
  UPDUSER: string
  UPDDTTM: string
}
//生产任务表工序清单
export type PSTASKJOB_DTO = {
  PSSEQ: number
  TSKSEQ: number
  JOBSEQ: number
  JOBNO: string //工序编码
  WCSEQ: number //产线
  BEGDT: string //開始日期
  ENDDT: string //完成日期
  QTY: number //插单数量
  UNIT: string //单位 PCS
  STFG: string //状态  EX_P:表示计划  EX_S:表示排产即已经派工  SELECT * FROM BSCODE WHERE  BSGP='EXSTFG' ORDER BY SORTBY
  STDT: string
  ADDUSER: string
  ADDDTTM: string
  UPDUSER: string
  UPDDTTM: string
}

export type PSTASKCL_DTO = {
  PSSEQ: number
  TSKSEQ: number
  CLSEQ: number //序号
  SORTBY: number //同CLSEQ一样
  CUTSEQ: number //分隔號
  CLNAME: string //顏色名稱
  QTY: number //数量
  FRNUM: number //牌號始
  TONUM: number //牌號止
  TKTQTY: number //牌數
  ADDUSER: string
  ADDDTTM: string
  UPDUSER: string
  UPDDTTM: string
}
