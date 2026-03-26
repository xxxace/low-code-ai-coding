import { useStdForm } from '../composeble/useStdForm'
import { ElMessageBox } from 'element-plus'
import { StdFormRelation, StdFormValueChanges } from '../types/stdForm'
import {
  collectSubmitDataHandler,
  validateSubmissionHandler,
  checkChangedHandler,
  submitHandler,
  InvalidtedFieldInfo,
  backupRestore,
  collectBackupDatas
} from './submitHandler'
import { useModelTable } from './model'

const columns = [
  {
    field: 'id',
    title: '表名',
    width: 120
  },
  {
    field: 'message',
    title: '错误信息'
  },
  {
    field: 'field',
    title: '字段名',
    width: 90
  },
  {
    field: 'fieldValue',
    title: '字段值',
    width: 80
  },
  {
    field: 'index',
    title: '行数',
    width: 60,
    formatter: ({ cellValue }) => cellValue + 1
  }
]

export function submitRegister() {
  const stdForm = useStdForm()

  stdForm.onBeforeSubmit(() => true)

  stdForm.onCollectSubmitData((relations: StdFormRelation<any>[]) =>
    collectSubmitDataHandler(relations)
  )

  stdForm.onValidateSubmission((valueChanges: StdFormValueChanges) =>
    validateSubmissionHandler(stdForm, valueChanges)
  )

  stdForm.onCheckChanged((valueChanges: StdFormValueChanges) =>
    checkChangedHandler(stdForm, valueChanges)
  )

  stdForm.onCustomValidate(() => true)

  stdForm.onSubmit((valueChanges: StdFormValueChanges) => submitHandler(stdForm, valueChanges))

  stdForm.onAfterSubmit(() => {})

  stdForm.registerSubmit(async () => {
    let backupDatas: StdFormValueChanges = []
    try {
      stdForm.loading = true
      const relations = stdForm.relationRegister.relations
      //收集备份数据
      backupDatas = await collectBackupDatas(relations)

      const isContinue = await stdForm.emits.beforeSubmit()
      console.log('isContinue', isContinue)
      if (!isContinue || !isContinue[0]) throw new Error(`[silent info]: not continue submit`)

      const submitData = await stdForm.emits.collectSubmitData(relations)
      const valueChanges = submitData[0] as StdFormValueChanges
      console.log('submitData', submitData)
      // [{oldValue: '', newValue: ''}]
      const isValidated = await stdForm.emits.validateSubmission(valueChanges)
      console.log('isValidated', isValidated)
      if ((isValidated[0] as InvalidtedFieldInfo[]).length > 0) {
        useModelTable({
          title: '校验失败',
          columns: columns,
          data: isValidated[0] as InvalidtedFieldInfo[]
        })
        throw new Error(`[silent info]: validateSubmission failed`)
      }

      const isChanged = await stdForm.emits.checkChanged(valueChanges)
      console.log('isChanged', isChanged)
      if (!isChanged[0]) return true
      const isPass = await stdForm.emits.customValidate()
      if (!isPass[0]) throw new Error(`[silent info]: customValidate failed`)
      console.log('submit 1')
      await stdForm.emits.submit(valueChanges)
      console.log('submit 2')
      console.log('afterSubmit 1')
      await stdForm.emits.afterSubmit()
      console.log('afterSubmit 2')
      console.log('init 1')
      const mainFormRelation = relations[0]
      const primaryKeyCol = stdForm.relationRegister.getPrimaryKeyList(mainFormRelation)
      // 因为主表可能是多对多
      if (primaryKeyCol && primaryKeyCol.length > 0) {
        const queryParams = primaryKeyCol.reduce((query, primaryKeyCol) => {
          query[primaryKeyCol.field] = mainFormRelation.manager?.value[primaryKeyCol.field]
          return query
        }, {})
        await stdForm.init(queryParams)
      }
      return true
    } catch (e: any) {
      console.log(e)
      try {
        backupRestore(stdForm, backupDatas)
      } catch (e: any) {
        ElMessageBox.alert(`Backup restore error: ${e.message || JSON.stringify(e)}`, 'Error', {
          type: 'error'
        })
      }
      // 异常回滚
      if (!e.message || e.message.indexOf('[silent info]:') === -1) {
        ElMessageBox.alert(`${e.message || JSON.stringify(e)}`, 'Error', {
          type: 'error'
        })
      }

      return false
    } finally {
      stdForm.loading = false
    }
  })
}
