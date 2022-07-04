export enum ConnectionState {
    CONNECTING = 0, // CONNECTING  Socket has been created. The connection is not yet open.
    OPEN = 1, // OPEN  The connection is open and ready to communicate.
    CLOSING = 2, // CLOSING  The connection is in the process of closing.
    CLOSED = 3, // CLOSED  The connection is closed or couldn't be opened.
}

export type ConnectionEvent = 'open' | 'connecting' | 'reconnecting' | 'close'

export class Connection extends EventTarget {
    private static readonly INTERNAL_CLOSE = 'INTERNAL_CLOSE'
    private ws: WebSocket

    public get state(): ConnectionState {
        return this.ws.readyState as ConnectionState
    }

    constructor() {
        super()
        this.dispatch('connecting')
        this.ws = this.spawnWS()
    }

    private reconnectCount = 0

    private spawnWS(): WebSocket {
        const ws = new WebSocket(
            'wss://demo.piesocket.com/v3/channel_1?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self'
        )
        ws.onmessage = function (evt) {
            console.debug(evt)
        }
        ws.onerror = function (error) {
            console.error(error)
        }
        ws.onclose = (evt) => {
            if (evt.reason.startsWith(Connection.INTERNAL_CLOSE)) {
                console.debug(
                    'closing',
                    evt.reason.replace(Connection.INTERNAL_CLOSE, '')
                )
                this.dispatch('close')
                return
            }
            console.debug('close unintentionally', evt)
            this.reconnectCount++
            this.dispatch('reconnecting')
            this.spawnWS()
        }
        ws.onopen = (evt) => {
            console.log(evt)
            this.reconnectCount = 0
            this.dispatch('open')
        }
        this.ws = ws
        return ws
    }

    public close(code?: number, reason?: string): void {
        console.debug('close connection intentionally', { code, reason })
        this.ws.close(code, Connection.INTERNAL_CLOSE + reason)
    }

    public addEventListener(type: ConnectionEvent, callback: () => unknown) {
        super.addEventListener(type, callback)
    }

    private dispatch(eventType: ConnectionEvent): boolean {
        return super.dispatchEvent(new Event(eventType))
    }
}
