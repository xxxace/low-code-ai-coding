import {parseURL} from "./utils";
import {toRaw} from 'vue';

const shortUUID = () => Math.random().toString(36).slice(2, 10);

export default class MsgMasterManager {
    iframe = null;
    events = {};
    userInfo = {};

    constructor(iframe, events) {
        this.iframe = iframe;
        this.events = events;
        this.init()
    }

    init() {
        if (this.iframe) {
            this.iframe.onload = () => {
                setTimeout(() => {
                    this.iframe.onload = null;
                    this.connect()
                }, 600)
            }
        } else {
            throw new Error('iframe is not loaded');
        }
    }

    connect() {
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
                    e.source.postMessage({
                        action: 'getUserInfo',
                        ...baseInfo,
                        data: toRaw(this.userInfo)
                    }, targetLocation.domain)
                    return
                }

                if (data.action === 'message') {
                    this.events.message && this.events.message(data)
                }

                if (data.action === 'disconnect') {
                    window.removeEventListener('message', connectHandler, this.events)
                    this.events.disconnected && this.events.disconnected()
                    return
                }
            }
        }

        window.addEventListener('message', connectHandler)

        // 发起连接
        const requestParams = {
            type: 'parent-connect-request',
            ...baseInfo
        }

        this.iframe.contentWindow.postMessage(requestParams, targetLocation.domain)
    }

    setUserInfo(data) {
        this.userInfo = data
    }
}
