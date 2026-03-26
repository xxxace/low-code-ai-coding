import type { Rules } from 'async-validator'
// import { PSTASKJOB_EDIT_VO } from '$types/views/MES/editManager'
// import dayjs from 'dayjs'

export const pstaskjobRules: Rules = {
  PSSEQ: [{ required: true, message: 'PSSEQ不能为空' }],
  TSKSEQ: [{ required: true, message: 'TASKSEQ不能为空' }],
  JOBSEQ: [{ required: true, message: 'JOBSEQ不能为空' }],
  JOBNO: [{ required: true, message: '工序不能为空' }],
  // BEGDT: [
  //   { required: true, message: '开工日期不能为空' },
  //   {
  //     validator(_rule, value, callback, row: PSTASKJOB_EDIT_VO) {
  //       if (value && row.ENDDT && dayjs(value).isAfter(dayjs(row.ENDDT))) {
  //         return callback('【开工日期】不能大于【完工日期】')
  //       }
  //       callback()
  //     }
  //   }
  // ],
  // ENDDT: [{ required: true, message: '完工日期不能为空' }],
  STFG: [{ required: true, message: '状态不能为空' }],
  STDT: [{ required: true, message: '状态日期不能为空' }],
  STFGTYPE: [{ required: true, message: '状态类型不能为空' }],
  STREASON: [{ required: true, message: '状态原因不能为空' }],
  QTY: [{ required: true, message: '状态日期不能为空' }]
}
