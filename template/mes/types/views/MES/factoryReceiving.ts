export type WarehouseInfoVO = {
    STKID: number;
    // 仓库名称
    STKNAME: string;
    SPID: number;
    // 仓库名称
    SPNAME: string;
    // 收料数
    INQTY: number;
    // 领用数
    OUTQTY: number;
    // 结余数
    QTY: number;
}

export type ReceivingMaterialVO = {
    MATID: number;
    SPECID: number;
    MATBHID: number;
    STKID: number;
    SPID: number;
    ORDSEQ: number;
    // 批号
    ORDNO: string;
    // 款号
    STYNO: string;
    // 毛料编码
    MATNO: string;
    // 毛料名称
    MATNAME: string;
    // 色号
    SPECNO: string;
    // 色名
    SPECNAME: string;
    // 缸号
    VAT: string;
    // 仓库名称
    STKNAME: string;
    // 仓位名称
    STKPLCNAME: string;
    // 收料数
    INQTY: number;
    // 领用数
    OUTQTY: number;
    // 结余数
    STKQTY: number;
}
