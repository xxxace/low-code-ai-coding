import type { MsgMasterRequsetParams } from './MsgMasterManager'

export type MsgSlaverRequestParams = {
  action: string
  host: string
  uuid: string
  data: any
}

export default class MsgSlaverManager {
  parentWindow: Window | null = null
  parentData: MsgMasterRequsetParams = {
    type: '',
    host: '',
    uuid: ''
  }

  constructor() {
    this.init()
  }

  init() {
    this.connect()
  }

  connect() {
    const connectHanlder = (e) => {
      const data = e.data
      if (data && data.type === 'parent-connect-request') {
        this.parentData = data
        e.source.postMessage({
          action: 'connected'
        })
        this.parentWindow = e.source
        window.removeEventListener('message', connectHanlder)
      }
    }
    window.addEventListener('message', connectHanlder)
  }

  disconnect() {
    return this.request('disconnect')
  }

  getUserInfo() {
    return this.request('getUserInfo')
  }

  request(action: string, data?: any) {
    return new Promise((resolve, reject) => {
      try {
        const requestParams: MsgSlaverRequestParams = {
          action,
          host: this.parentData.host,
          uuid: this.parentData.uuid,
          data
        }

        const requestHandler = (e) => {
          const data = e.data
          if (data && data.uuid === requestParams.uuid && data.action === action) {
            resolve(data)
            window.removeEventListener('message', requestHandler)
          }
        }
        window.addEventListener('message', requestHandler)
        this.sendMessage(requestParams)
      } catch (e) {
        reject(e)
      }
    })
  }

  sendMessage(data: MsgSlaverRequestParams) {
    if (!this.parentWindow) {
      throw new Error('No parent Window')
    }

    this.parentWindow.postMessage(data, '*')
  }
}
