export type StatisticsVO = {
  NUM1: number
  NUM2: number
  PSQTY: number
  WIPQTY: number
  PCT1: number
  PCT2: number
  PCT3: number
  PCT4: number
  PCT5: number
  PCT6: number
}

export type TaskDetailVO = {
  PSSEQ: number
  TSKSEQ: number
  LSTSEQ: number
  JOBSEQ: number //主鍵
  ORDSEQ: number //批號ORORDSEQ
  PMSEQ: number //合約PM.PMSEQ
  TSKNO: string //計劃號
  PRI: string //系统優先級
  PRIREV: string //優先級
  YRWEEK: string //計劃周期
  STYNO: string //款號
  PMNO: string //合約號
  JOBNO: string //工序編碼
  JOBNAME: string //工序名稱
  WCSEQ: number //產線編碼
  WCNAME: string //產線名稱
  TEAMNAME: string //線長/帶班長
  PCT: number //負荷%
  QTY: number //計劃數量
  WIPQTY: number //累計收貨數量
  PRD_PCT: number //生產進度%
  PSQTY_W: number //本周目標數量
  WIPQTY_W: number //本周完工數量
  ACT_PCT: number //實際生產速度分鐘/件
  STD_PCT: number //標準生產速度分鐘/件
  WKNUM: number //機臺/人數
  WKNUM_STR: string //機臺號 要從實際收發那邊取機臺號清單
  MIN_WKDATE: string //計劃開始日期
  MAX_WKDATE: string //計劃實際完工日期
  STFG: string //狀態編碼
  STFGNAME: string //狀態名稱
  RMK: string
}

export type ColorGroupVO = {
  PMSEQ: number
  CUTSEQ: number //分隔號
  CLSEQ: number //颜色序号
  CLNAME: string //顏色名稱
  QTY: number //數量
  FRNUM: string //牌號始
  TONUM: string //牌號止
  TKTQTY: number //牌數
}

export type ColorBlendingVO = {
  VAT: string //缸号
  QTY: string //需求數量
  FLQTY: string //發料數
  CLQTY: string //存料數
  QLQTY: string //欠料數
}

export type WorkOrderVO = {
  PSSEQ: number
  TSKSEQ: number
  DSSEQ: number //主鍵
  WKDATE: string //日期
  WCSEQ: number //產線編碼
  WCNAME: string //產線名稱
  WKNUM: number //機臺數
  QTY: number //計劃數量
  STFG: string //狀態
  WIPQTY: number //收貨數量
  PCT: number //進度%
}
