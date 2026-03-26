import type { Rules } from 'async-validator'

export const formRules: Rules = {
  PSSEQ: [{ required: true, message: 'PSSEQ不能为空' }],
  TSKSEQ: [{ required: true, message: 'TASKSEQ不能为空' }],
  STYSEQ: [{ required: true, message: '款号不能为空' }],
  FTYSEQ: [{ required: true, message: '工厂不能为空' }]
}

export const pstaskordRules: Rules = {
  PSSEQ: [{ required: true, message: 'PSSEQ不能为空' }],
  TSKSEQ: [{ required: true, message: 'TASKSEQ不能为空' }],
  LSTSEQ: [{ required: true, message: 'LSTSEQ不能为空' }],
  ORDTY: [{ required: true, message: '单类不能为空' }],
  BILLID: [{ required: true, message: '合约号不能为空' }]
}

export const pstaskjobListRules: Rules = {
  PSSEQ: [{ required: true, message: 'PSSEQ不能为空' }],
  TSKSEQ: [{ required: true, message: 'TASKSEQ不能为空' }],
  JOBSEQ: [{ required: true, message: 'JOBSEQ不能为空' }],
  JOBNO: [{ required: true, message: '工序不能为空' }],
  STFG: [{ required: true, message: '状态不能为空' }],
  STDT: [{ required: true, message: '状态日期不能为空' }]
}

export const pstaskclListRules: Rules = {
  PSSEQ: [{ required: true, message: 'PSSEQ不能为空' }],
  TSKSEQ: [{ required: true, message: 'TASKSEQ不能为空' }],
  CLSEQ: [{ required: true, message: 'CLSEQ不能为空' }],
  SORTBY: [{ required: true, message: 'SORTBY不能为空' }],
  QTY: [{ required: true, message: '数量不能为空' }]
}
