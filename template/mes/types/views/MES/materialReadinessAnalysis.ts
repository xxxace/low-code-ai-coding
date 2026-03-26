export type ReadinessEntryVO = {
  ORDSEQ: number
  ORDNO: string /*批号*/
  STYNO: string /*款号*/
  IMGSEQ: number /*公仔图*/
  V_ORIGIN: string /*产地*/
  V_CLNT: string /*客户*/
  V_CORPNO: string /*公司*/
  V_CLNTFTYNO: string /*工厂*/
  V_STKOG: string /*仓库*/
  V_CLNTDTTO: string /*客货期*/
  QTY: number /*数量*/
  V_PRI: number /*排产优先级*/
  V_PQTY: number /*排产数*/
  V_QT1: number /*齐套率1*/
  V_QT2: number /*齐套率2*/
}

export type ColorGroupVO = {
  ORDSEQ: number
  ITMSEQ: number
  CLSEQ: number
  SEQ: number /*序号*/
  ORDNO: string
  V_CL: string /*顏色組*/
  WKDATE: string /*開機日期*/
  QTY: number /*訂單數*/
  PQTY: number /*已排數*/
  QQTY: number /*欠數*/
  QTRATE: number /*齐套率*/
}

export type ColorEntryVO = {
  ORDNO: string
  ORDSEQ: number
  ITMSEQ: number
  MCSEQ: number
  CLSEQ: number
  MATSEQ: number
  MATID: number
  SPECID: number
  V_CL: string /*顏色組*/
  V_MTCH: string /*排色*/
  YRNCNT: number /*支數*/
  V_MATNAME: string /*成份*/
  SPECNO: string /*色号*/
  V_SPECNAME: string /*色名*/
  QTY: number /*数量*/
  STDWT: number /*用量*/
  V_STDUNIT: string /*单位*/
  WST: number /*损耗*/
  V_OWNQTY: number /*需求数*/
  REQDTTM: string /*需求日期*/
  YRSQTY: number /*预留数*/
  OSQTY: number /*发料数*/
  QTRATE: number /*齐套率*/
  V_SQTY: number /*欠数*/
  WHQTY: number /*可利用库存数*/
  WHRSQTY: number /*可借调数*/
  WHORDNO: string /*可借调批号*/
}

export type AvailableInventoryEntryVO = {
  ORDSEQ: number
  ITMSEQ: number
  MATID: number
  SPECID: number
  MATBHID: number
  STKNAME: string /*倉庫*/
  VAT: string /*缸號*/
  SPECNO: string /*色號*/
  QTY: number /*庫存數*/
  CORPNAME: string /*歸屬公司*/
  V_ISIMPORT: string /*進口*/
  ORDNO: string /*批號*/
  WHDATE: string /*入庫日期*/
  MSCBILLRMK: string /*入庫備註*/
}

export type SameBatchnoVO = {
  VAT: string /*缸號*/
  ORDNO: string /*批號*/
  V_OWNQTYORDSEQ: number /*需求数*/
  V_REQDTTM: string /*需求日期*/
  YRSQTYORDSEQ: number /*预留数*/
  YOSQTYORDSEQ: number /*发料数*/
  QTRATEORDSEQ: number /*齐套率*/
  V_SQTYORDSEQ: number /*欠数*/
  WHDATE: string /*入庫日期*/
  RMK: string /*入庫備註*/
}

export type TotalRequirementVO = {
  ORDSEQ: number
  ITMSEQ: number
  MATID: number /*物料ID*/
  SPECID: number /*色号ID*/
  V_MATUSE: string /*部位*/
  V_OWNQTY: number /*需求数*/
  V_OWRATE: number /*占比*/
}

export type WoolRedinessEntryVO = {
  MATID: number
  SPECID: number
  MATNO: string /*毛料编码*/
  V_MATNAME: string /*成份*/
  SPECNO: string /*色号*/
  CSPEC: string /*色名*/
  V_OWNQTY: number /*需求数*/
  V_POQTY: number /*采购数*/
  V_ZTQTY: number /*在途数*/
  V_BLINQTY: number /*虚仓入库数*/
  V_YLQTY: number /*预留数*/
  V_BLOUTQTY: number /*虚仓发料数*/
  V_QSQTY: number /*欠料数*/
  V_BLQTY: number /*虚仓可用数*/
}

export type WoolColorGroupVO = {
  ORDNO: string /*批号*/
  ORDSEQ: number
  ITMSEQ: number
  MCSEQ: number
  CLSEQ: number
  MATSEQ: number
  MATID: number
  SPECID: number
  V_CL: string /*顏色組*/
  V_MTCH: string /*排色*/
  YRNCNT: string /*支數*/
  V_MATNAME: string /*成份*/
  SPECNO: string /*色号*/
  V_SPECNAME: string /*色名*/
  QTY: number /*数量*/
  STDWT: number /*用量*/
  V_STDUNIT: string /*单位*/
  WST: number /*损耗*/
  V_OWNQTY: number /*需求数*/
  REQDTTM: string /*需求日期*/
  YRSQTY: number /*预留数*/
  OSQTY: number /*发料数*/
  QTRATE: number /*齐套率*/
  V_SQTY: number /*欠数*/
  WHQTY: number /*可利用库存数*/
  WHRSQTY: number /*可借调数*/
  WHORDNO: string /*可借调批号*/
  V_JMRATE: number /*计毛比重*/
  V_PRQTY: number /*申购数*/
}

export type WoolPurchaseEntryVO = {
  POSEQ: number
  MATID: number
  SPECID: number
  PONO: string /*采购单*/
  DELYDATE: string /*合同交期*/
  QTY: number /*采购数量*/
  V_QSQTY /*欠数=采购数量-交货数量*/
  DELYDATE2: string /*供应商复期*/
  V_WQTY: number /*交货数量*/
  V_ORDNO: string /*批号*/
  RMK: string /*备注*/
}

export type WoolInventoryEntryVO = {
  SCBILLNO: string /*采购单*/
  MATID: number
  SPECID: number
  MATBHID: number
  VAT: string /*缸号*/
  WHNO: string /*收货单*/
  WHDATE: string /*入库日期*/
  QTY: number /*数量*/
  RMK: string /*入库备注*/
  FIRST_RSQTY: number /*预留*/
  V_PLQTY: number /*发料*/
  V_PO_ORDNO: string /*领料批号*/
}

export type RegisterDateVO = {
  JOBNO: string /*工序*/
  V_DATE: string /*登记日期*/
}