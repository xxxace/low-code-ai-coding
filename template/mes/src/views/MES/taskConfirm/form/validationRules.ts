import type { Rules } from 'async-validator'
import { PSTASKJOB_EDIT_VO } from '$types/views/MES/editManager'
import dayjs from 'dayjs'

export const pstaskjobListRules: Rules = {
  PSSEQ: [{ required: true, message: 'PSSEQ不能为空' }],
  TSKSEQ: [{ required: true, message: 'TASKSEQ不能为空' }],
  JOBSEQ: [{ required: true, message: 'JOBSEQ不能为空' }],
  WCSEQ: [{ required: true, message: '产线不能为空' }],
  JOBNO: [{ required: true, message: '工序不能为空' }],
  BEGDT: [
    { required: true, message: '计划开工日期不能为空' },
    {
      validator(_rule, value, callback, row: PSTASKJOB_EDIT_VO) {
        if (value && row.ENDDT && dayjs(value).isAfter(dayjs(row.ENDDT))) {
          return callback('【计划开工日期】不能大于【计划完工日期】')
        }
        callback()
      }
    }
  ],
  ENDDT: [{ required: true, message: '计划完工日期不能为空' }],
  STFG: [{ required: true, message: '状态不能为空' }],
  STDT: [{ required: true, message: '状态日期不能为空' }],
  QTY: [
    {
      validator(_rule, _value, callback, row: PSTASKJOB_EDIT_VO) {
        const editQty = (row.QTY || 0) - (row.V_PRDQTY || 0)
        if (editQty < 0) {
          callback('调整数量不能小于0')
        } else if (editQty > row.HSQTY) {
          callback('调整数量不能大于可调整数量')
        } else {
          callback()
        }
      }
    }
  ]
}
