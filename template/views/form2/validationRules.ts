import type {Rules} from 'async-validator'

export const formRules: Rules = {
    TSEQ: [{required: true, message: 'TSEQ不能为空'}],
    TMPLTY: [{required: true, message: '分组类型不能为空'}],
    TMPLNO: [{required: true, message: '分组编码不能为空'}],
    CNAME: [{required: true, message: '分组名称不能为空'}],
    REF1: [{required: true, message: '平台不能为空'}],
}

export const anchorEntriesRules: Rules = {
    TMPLTY: [{required: true, message: '达人分组类型不能为空'}],
    TMPLNO: [{required: true, message: '达人分组编码不能为空'}],
    DTLNO: [{required: true, message: '达人ID不能为空'}]
}
