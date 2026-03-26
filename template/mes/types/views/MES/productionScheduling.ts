export type productionItemVO = {
  JOBNO: number /*工序編碼*/
  JOBNAME: string //工序名稱
  JTQTY: number //机台数
  WKDATE: string //日期
  STFG: string //狀態編碼
  STFGNAME: string //狀態名稱
  WKHRS: number //工时数
}

export type productionOriginVO = {
  ORIGIN: string /*厂区编码*/
  ORIGINNAME: string /*厂区名称*/
  FTYNO: string /*工厂编码*/
  FTYNAME: string /*工厂名称*/
  WCSEQ: string /*产线编码*/
  WCNAME: string /*产线名称*/
  JTQTY: number /*机台人数*/
  WKDATE: string /*日期*/
  QTY: number /*计划*/
  WIP_QTY: number /*完工*/
  WKHRS: number /*工时数*/
}
