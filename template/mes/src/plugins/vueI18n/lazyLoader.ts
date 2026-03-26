import { PrjobjItem, searchPrjobjitem } from '@/api/nameson'
import { i18n } from './index'
import { getObjectId } from '@/api/nameson/auth'
import { ElMessageBox } from 'element-plus'

export const i18nRemoteMap = new Map<LocaleType, any>()

export const localFiledMap = {
  'zh-CN': 'CHSNAME',
  'zh-CNT': 'CHTNAME',
  en: 'ENGNAME',
  vnm: 'LOCNAME'
}

export function convertPrjobjitemToLocaleMap(prjobjitems: PrjobjItem[]) {
  const localeMap = Object.keys(localFiledMap).reduce((map, key) => {
    map[key] = {}
    return map
  }, {}) as Record<LocaleType, any>

  prjobjitems.forEach((item) => {
    Object.keys(localFiledMap).forEach((locale) => {
      localeMap[locale][item.ITEMNAME] = item[localFiledMap[locale]]
    })
  })

  return localeMap
}

export function updateRemoteLocale(localeMap: Record<LocaleType, any>) {
  Object.keys(localeMap).forEach((locale: LocaleType) => {
    const newMap = localeMap[locale]
    const oldMap = i18nRemoteMap.get(locale) || {}
    Object.assign(oldMap, newMap)
    i18nRemoteMap.set(locale, oldMap)
  })
}

export function setRemoteLocale(ename: string, prjobjitems: PrjobjItem[]) {
  const localeMap = convertPrjobjitemToLocaleMap(prjobjitems)

  Object.keys(localeMap).forEach((locale) => {
    localeMap[locale] = { [ename]: localeMap[locale] }
  })

  updateRemoteLocale(localeMap)
}

export function updateLocaleMessage(locale?: LocaleType) {
  if (!locale) locale = (i18n.global.locale as any).value as LocaleType
  const newMessage = i18nRemoteMap.get(locale) || {}
  const currMessage = i18n.global.getLocaleMessage(locale) as any
  Object.assign(currMessage, newMessage)

  i18n.global.setLocaleMessage(locale, currMessage)
}

export function mergeLocaleMessage(locale: LocaleType, message: any) {
  const newMessage = i18nRemoteMap.get(locale) || {}
  Object.assign(message, newMessage)
  return message
}

export async function loadMessageByObjectName(objectName: string) {
  const objectId = await getObjectId(objectName)
  if (!objectId) {
    return ElMessageBox.alert('未找到对象ID', 'Error', {
      type: 'error'
    })
  }

  const prjobjItems = await searchPrjobjitem({ p_Objectid: objectId })
  prjobjItems && setRemoteLocale(objectName, prjobjItems)

  updateLocaleMessage()
}
