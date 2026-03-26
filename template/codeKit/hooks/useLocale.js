import {i18n} from '@/service/vueI18n'
import {useLang} from '@/stores/modules/useLang'
import {setHtmlPageLang} from '@/service/vueI18n/helper'
import {mergeLocaleMessage} from '@/service/vueI18n/lazyLoader'

const setI18nLanguage = (locale) => {
    const localeStore = useLang()

    if (i18n.mode === 'legacy') {
        i18n.global.locale = locale
    } else {
        i18n.global.locale.value = locale
    }
    localeStore.setCurrentLocale({
        lang: locale
    })
    setHtmlPageLang(locale)
}

export const useLocale = () => {
    // Switching the language will change the locale of useI18n
    // And submit to configuration modification
    const changeLocale = async (locale) => {
        const globalI18n = i18n.global

        const langModule = await import(`../lang/lg/${locale}.js`)

        console.log(locale, langModule.default)
        const mergedLocaleMessage = mergeLocaleMessage(locale, langModule.default)
        globalI18n.setLocaleMessage(locale, mergedLocaleMessage)

        setI18nLanguage(locale)
    }

    return {
        changeLocale
    }
}
