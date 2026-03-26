import {RefManagerArray} from '../../../hooks/useRefManager'
import {useStdForm} from '../composeble/useStdForm'
import {ElMessageBox} from 'element-plus'
import {StdFormRelation} from '../types/stdForm'
import {ColdataModel, generateDataModel} from '@nameson/sqlutils'
import {useUserStore} from '@/stores/modules/user'
import {fillDataModel} from './submitHandler'
import {saveData} from '@/api/nameson'
import {StdFormAction} from '../types/store'

function convertToDeleteColdatas(relation: StdFormRelation<any>) {
    const manager = relation.manager
    if (!manager) throw new Error('No manager found')
    const deleteValue =
        manager.type === 'object' ? manager.value : (manager as RefManagerArray<any>).records

    const userStore = useUserStore()
    const dataModel = generateDataModel({
        tableName: relation.table.tableName,
        user: (userStore.userInfo as any).p_user
    })

    const indexColumns = relation.table.columns.filter((col) => !!col.key)

    return fillDataModel(dataModel, indexColumns, {
        id: relation.id,
        newValue: manager.type === 'object' ? null : [],
        oldValue: deleteValue
    })
}

export const deleteRegister = () => {
    const stdForm = useStdForm()

    stdForm.onBeforeDelete(() => true)

    stdForm.onDelete(async () => {
        const relationNodeStack = [stdForm.relationRegister.root]
        const postList: ColdataModel[] = []

        while (relationNodeStack.length > 0) {
            const node = relationNodeStack.shift()
            if (!node?.relation) throw new Error('No relation found')
            const deleteList = convertToDeleteColdatas(node.relation)
            postList.push(...deleteList)

            if (node.children) {
                relationNodeStack.push(...node.children)
            }
        }

        postList.reverse()
        // console.log(postList)

        if (postList.length) {
            const res = await saveData(postList)
            if (res.statusCode != '1') {
                throw new Error(res.message)
            }
        } else {
            throw new Error('没有数据可以删除！')
        }
    })

    stdForm.onAfterDelete(() => {
    })

    stdForm.registerDelete(async () => {
        const isContinue = await stdForm.emits.beforeDelete() as any
        if (!isContinue) return
        if (isContinue instanceof Array && isContinue[0] === false) return
        stdForm.loading = true
        try {
            await stdForm.emits.delete()
            stdForm.emits.afterDelete()
            await stdForm.reset()
        } catch (err: any) {
            console.log(err)
            ElMessageBox.alert(`删除错误：${err.message || JSON.stringify(err)}`, 'Error', {
                type: 'error'
            })
        }
        stdForm.loading = false
    })
}
