export enum ConnectionState {
    CONNECTING = 'CONNECTING', // CONNECTING  The connection is not yet open.
    OPEN = 'OPEN', // OPEN  The connection is open and ready to communicate.
    CLOSED = 'CLOSED', // CLOSED  The connection is closed or couldn't be opened.
}

export type ConnectionEvent = 'open' | 'connecting' | 'reconnecting' | 'close'

export class Connection extends EventTarget {
    private static readonly INTERNAL_CLOSE = 'INTERNAL_CLOSE'
    private ws: WebSocket

    public get state(): ConnectionState {
        if (this.ws.readyState === 0) {
            return ConnectionState.CONNECTING
        }
        if (this.ws.readyState === 1) {
            return ConnectionState.OPEN
        }
        if (this.ws.readyState === 2) {
            return ConnectionState.CLOSED
        }
        return ConnectionState.CLOSED
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

    public addEventListener(
        type: ConnectionEvent,
        callback: (event: Event) => unknown
    ) {
        super.addEventListener(type, callback)
    }

    private dispatch(eventType: ConnectionEvent): boolean {
        return super.dispatchEvent(new Event(eventType))
    }
}
