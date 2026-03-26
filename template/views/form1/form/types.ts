export type InquiryOrderVO = {
    PLNSEQ: number
    PLNNO: string //询单单号
    PLNMTH: string //询单年月
    BLTY: string //单类
    CORPNO: string //公司
    V_CORPNAME: string //公司名称
    CLNT: string //客户
    V_CLNTNAME: string //客户名称
    JOBNO: string //工序
    V_JOBNAME:string //工序名称
    CLNTSTYNO: string //客款号
    STYNO: string //款号
    WKHRS: number //织工
    WKHRS_FP: number //缝工
    WKHRS_TZ: number //挑工
    REPLYDT:string //复单期限
    BEGFR:string //预计开机
    ENDTO:string //预计货期
    EQMCAT:string //针种
    EQMMODEL:string //电脑机
    FTYNO:string //工厂
    V_FTYNAME:string //工厂名称
    QTY:number //询单数量
    STAFF:string //营业
    TEAM:string //队伍
    RMK:string //备注
    STFG:string //状态
    V_STFGNAME:string //状态名称
    STDT:string //状态日期
    STREASON:string //状态原因
    ADDUSER:string
    ADDDTTM:string
    UPDUSER:string
    UPDDTTM:string
}
