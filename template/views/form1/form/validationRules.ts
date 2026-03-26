import type {Rules} from 'async-validator'

export const formRules: Rules = {
    PLNSEQ: [{required: true, message: 'PLNSEQ不能为空'}],
    PLNNO: [{required: true, message: '询单单号不能为空'}],
    CORPNO: [{required: true, message: '公司不能为空'}],
    CLNT: [{required: true, message: '客户不能为空'}],
    JOBNO: [{required: true, message: '工序不能为空'}],
    EQMCAT: [{required: true, message: '针种不能为空'}],
    EQMMODEL: [{required: true, message: '电脑机不能为空'}],
    QTY: [{required: true, message: '询单数量不能为空'}],
    BEGFR: [{required: true, message: '预计开机不能为空'}],
    ENDTO: [{required: true, message: '预计货期不能为空'}],
    // ENDTO: [{
    //     validator: (rule, value, callback, source) => {
    //         if(source.)
    //     },
    // }]
}
