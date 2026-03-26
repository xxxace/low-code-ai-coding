import type { Rules } from 'async-validator'

export const formRules: Rules = {
  REQSEQ: [{ required: true, message: 'REQSEQ不能为空' }],
  REQNO: [{ required: true, message: '单号不能为空' }],
  FTYNO: [{ required: true, message: '工厂不能为空' }],
  DEPTNO: [{ required: true, message: '部门不能为空' }],
  JOBNO: [{ required: true, message: '工序不能为空' }],
  RMK: [{ required: true, message: '停工原因不能为空' }]
}

export const leaveListRules: Rules = {
  REQSEQ: [{ required: true, message: 'REQSEQ不能为空' }],
  LSTSEQ: [{ required: true, message: 'LSTSEQ不能为空' }],
  EMPNO: [{ required: true, message: '工号不能为空' }],
  BEGDT: [{ required: true, message: '放假起始不能为空' }],
  ENDDT: [{ required: true, message: '放假结束不能为空' }]
}
