import { parseURL, shortUUID } from './utils'

export type MsgMasterEvents = {
  disconnected?: () => void
  message?: (data: any) => void
  connected?: () => void
}

export type MsgMasterRequsetParams = {
  type: string
  host: string
  uuid: string
}

export default class MsgMasterManager {
  iframe: HTMLIFrameElement | null = null
  events: MsgMasterEvents = {}

  constructor(iframe: HTMLIFrameElement, events: MsgMasterEvents) {
    this.iframe = iframe
    this.events = events
    this.init()
  }

  init() {
    if (this.iframe) {
      this.iframe.onload = () => {
        setTimeout(() => {
          console.log('this.iframe.onload')
          this.iframe!.onload = null
          this.connect()
        }, 600)
      }
    } else {
      throw new Error('iframe is not loaded')
    }
  }

  connect() {
    if (!this.iframe) {
      throw new Error('iframe was not found')
    }

    const host = window.location.host
    const targetLocation = parseURL(this.iframe.src)
    const baseInfo = {
      host,
      uuid: shortUUID()
    }

    // 接收连接响应
    const connectHandler = (e) => {
      const data = e.data
      if (data && data.uuid === baseInfo.uuid) {
        if (data.action === 'connected') {
          this.events.connected && this.events.connected()
          return
        }

        if (data.action === 'getUserInfo') {
          e.source.postMessage(
            {
              action: 'getUserInfo',
              ...baseInfo
            },
            targetLocation.domain
          )
          return
        }

        if (data.action === 'message') {
          this.events.message && this.events.message(data)
          return
        }

        if (data.action === 'disconnect') {
          window.removeEventListener('message', connectHandler)
          this.events.disconnected && this.events.disconnected()
          return
        }
      }
    }

    window.addEventListener('message', connectHandler)

    // 发起连接
    const requestParams: MsgMasterRequsetParams = {
      type: 'parent-connect-request',
      ...baseInfo
    }

    this.iframe.contentWindow!.postMessage(requestParams, targetLocation.domain)
  }
}
