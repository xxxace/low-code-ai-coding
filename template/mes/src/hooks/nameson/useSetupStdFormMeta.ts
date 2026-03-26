import { useNamesonUserStore } from '@/store/modules/ns-user'
import { getCurrentInstance } from 'vue'
import { StdFormStore } from '@/components/StdForm/types/store'

export function useSetupStdFormMeta(stdForm: StdFormStore) {
  const instance = getCurrentInstance()
  if (instance) {
    const objectName = instance.type?.objectName
    const nsUserStore = useNamesonUserStore()
    const prjobjItem = nsUserStore.getPrjobjItem(objectName)

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

    stdForm.meta.objectName = objectName
  }
}
