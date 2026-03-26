import {generateDataModel} from '@nameson/sqlutils'
import {useStdForm} from '../composeble/useStdForm'
import {useUserStore} from '@/stores/modules/user'
import {fillDataModel} from './submitHandler'
import dayjs from 'dayjs'
import {saveData} from '@/api/nameson'
import {ElMessageBox} from 'element-plus'
import {ChangeStatusParams} from '../types/store'

export const changeStatusRegister = () => {
    const userStore = useUserStore()
    const stdForm = useStdForm()

    stdForm.onBeforeChangeStatus(() => true)

    stdForm.onChangeStatus(async (params: ChangeStatusParams) => {
        // status === OrderStatus.Approved
        const {relationRegister} = stdForm
        const relationRoot = relationRegister.root
        const relation = relationRegister.getNestedProperty(relationRoot!, 'relation')
        const manager = relationRegister.getNestedProperty(relation, 'manager')

        const dataModel = generateDataModel({
            tableName: relation.table.tableName,
            user: (userStore.userInfo as any).USERNO
        })

        dataModel.setKeyTypeMap({
            DATE: ['STDT']
        })

        const indexColumns = relation.table.columns.filter((col) => !!col.key)

        const primaryValue = indexColumns.reduce((prev, col) => {
            prev[col.field] = manager.value[col.field]
            return prev
        }, {})

        const postList = fillDataModel(dataModel, indexColumns, {
            id: relation.id,
            newValue: {
                ...primaryValue,
                STFG: params.status,
                STREASON: params.message,
                STDT: dayjs().format('YYYY-MM-DD HH:mm:ss')
            },
            oldValue: {
                ...primaryValue,
                STFG: manager.value.STFG,
                STREASON: manager.value.STREASON,
                STDT: manager.value.STDT
            }
        })

        if (postList.length) {
            const res = await saveData(postList)
            if (res.statusCode != '1') {
                throw new Error(res.message)
            }
        } else {
            throw new Error('没有数据可以变更状态！')
        }
    })

    stdForm.onAfterChangeStatus(() => {
    })

    stdForm.registerChangeStatus(async (params: ChangeStatusParams) => {
        const isContinue = await stdForm.emits.beforeChangeStatus() as any
        if (!isContinue) return

        stdForm.loading = true
        try {
            await stdForm.emits.changeStatus(params)
            stdForm.emits.afterChangeStatus()
            const {relationRegister} = stdForm
            const root = relationRegister.root
            const primaryKeyCol = relationRegister.getPrimaryKey(root!.relation)
            const manager = relationRegister.getNestedProperty(root!.relation, 'manager')
            stdForm.init(manager.value[primaryKeyCol!.field])
        } catch (e: any) {
            console.log(e)
            ElMessageBox.alert(`变更错误：${e.message || JSON.stringify(e)}`, 'Error', {
                type: 'error'
            })
        }
        stdForm.loading = false
    })
}
