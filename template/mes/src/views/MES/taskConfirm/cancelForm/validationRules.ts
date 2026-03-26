import type { Rules } from 'async-validator'

export const formRules: Rules = {
  LSTSEQ: [{ required: true, message: 'LSTSEQ不能为空' }],
  MATCLASS: [{ required: true, message: 'MATCLASS不能为空' }],
  ITEMNO: [{ required: true, message: '编码不能为空' }],
  ITEMNAME: [{ required: true, message: '中文名称不能为空' }],
  DEPT: [{ required: true, message: '部門不能为空' }],
  TAXPRC: [{ required: true, message: '每份含税价不能为空' }],
  STFG: [{ required: true, message: '状态不能为空' }]
}

export const recipeEntryRules: Rules = {
  LSTSEQ: [{ required: true, message: 'LSTSEQ不能为空' }],
  BOMSEQ: [{ required: true, message: 'BOMSEQ不能为空' }],
  ITEMNO: [{ required: true, message: '配方编码不能为空' }],
  ITEMNAME: [{ required: true, message: '配方名称不能为空' }],
  QTY2: [
    { required: true, message: '用量不能为空' },
    {
      validator(rule, value, callback) {
        if (value <= 0) {
          callback(rule.message as string)
        } else {
          callback()
        }
      },
      message: '用量不能小于等于0'
    }
  ]
}
