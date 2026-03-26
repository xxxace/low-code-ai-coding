import {useUserStore} from '@/stores/modules/user'
import {getCurrentInstance} from 'vue'
import {StdFormStore} from '../components/StdForm/types/store'

export function useSetupStdFormMeta(stdForm: StdFormStore) {
    const instance = getCurrentInstance()
    if (instance) {
        const objectName = (instance.type as any).objectName
        const nsUserStore = useUserStore()
        const prjobjItem = nsUserStore.getPermObject(objectName)

        if (prjobjItem) {
            stdForm.meta.objectId = prjobjItem.OBJECTID
            stdForm.meta.objectType = prjobjItem.OBJTY
            stdForm.meta.objectParentId = prjobjItem.PARENTID
            stdForm.meta.reportUrl = prjobjItem.REPORTURL
            stdForm.meta.ISADD = prjobjItem.ISADD
            stdForm.meta.ISAUD = prjobjItem.ISAUD
            stdForm.meta.ISDEL = prjobjItem.ISDEL
            stdForm.meta.ISQRY = prjobjItem.ISQRY
            stdForm.meta.ISUPD = prjobjItem.ISUPD
            stdForm.meta.ISFREQUENTLYUSED = prjobjItem.ISFREQUENTLYUSED
        }
        console.log(  stdForm.meta)
        stdForm.meta.objectName = objectName
    }
}
