import {useUserStore} from '@/stores/modules/user'
import {useStdForm} from '../composeble/useStdForm'

export const printRegister = () => {
    const stdForm = useStdForm()
    const userStore = useUserStore()
    stdForm.onCreateURLParams(() => {
        throw new Error('未设置onCreateURLParams！')
    })

    stdForm.registerPrint(async (params: any) => {
        if (!params || Object.keys(params).length === 0) {
            throw new Error('参数为空！')
        }

        let reportURL = stdForm.meta.reportUrl

        if (userStore.userInfo) {
            const {p_user, sessionID} = userStore.userInfo as any
            Object.assign(params, {
                p_user: p_user,
                p_session: sessionID
            })
        }

        Object.keys(params).forEach((key) => {
            if (params[key] !== null && params[key] !== undefined) {
                reportURL += `${reportURL.includes('?') ? '&' : '?'}${key}=${params[key]}`
            }
        })

        window.open(reportURL)
    })
}
