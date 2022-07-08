import { DevelopLogger } from '@/logger'
import { Heartbeat } from '@/heartbeat'
import { compress, decompress } from '@/compression'

export enum ConnectionState {
    CONNECTING = 'CONNECTING', // CONNECTING  The connection is not yet open.
    OPEN = 'OPEN', // OPEN  The connection is open and ready to communicate.
    CLOSED = 'CLOSED', // CLOSED  The connection is closed or couldn't be opened.
}

export type ConnectionEvent = 'open' | 'connecting' | 'reconnecting' | 'close'

export class Connection extends EventTarget {
    private static readonly INTERNAL_CLOSE = 'INTERNAL_CLOSE'
    private static logger = new DevelopLogger()
    private ws: WebSocket
    #state: ConnectionState = ConnectionState.CONNECTING

    public get state(): ConnectionState {
        return this.#state
    }

    constructor() {
        super()
        this.dispatch('connecting')
        this.ws = this.spawnWS()
    }

    private reconnectCount = 0

    private spawnWS(): WebSocket {
        Connection.logger.debug('Connection', 'spawn WebSocket')
        this.#state = ConnectionState.CONNECTING
        const ws = new WebSocket(
            'wss://demo.piesocket.com/v3/channel_1?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self'
        )
        ws.binaryType = 'arraybuffer'
        ws.onmessage = function (evt) {
            const decompressed = decompress(evt.data)
            Connection.logger.debug('WebSocket', 'message', evt, decompressed)
        }
        ws.onerror = function (error) {
            Connection.logger.error('WebSocket', 'error', error)
        }
        ws.onclose = (evt) => {
            if (evt.reason.startsWith(Connection.INTERNAL_CLOSE)) {
                return
            }
            Connection.logger.debug('WebSocket', 'close unintentionally', evt)
            this.reconnectCount++
            this.dispatch('reconnecting')
            this.spawnWS()
        }
        ws.onopen = (evt) => {
            Connection.logger.debug('WebSocket', 'open', evt)
            this.reconnectCount = 0
            this.dispatch('open')
            return Heartbeat(ws, Connection.logger)
        }
        this.ws = ws
        return ws
    }

    public send(data: string | Uint8Array | ArrayBuffer): void {
        const compressed = compress(data)
        this.ws.send(compressed)
    }

    public close(code?: number, reason?: string): void {
        Connection.logger.info('Connection', 'close intentionally', {
            code,
            reason,
        })
        this.#state = ConnectionState.CLOSED
        this.dispatch('close')
        this.ws.close(code, Connection.INTERNAL_CLOSE + reason)
    }

    public addEventListener(
        type: ConnectionEvent,
        callback: (event: Event) => unknown
    ) {
        Connection.logger.debug(
            'Connection',
            'addEventListener',
            type,
            callback
        )
        super.addEventListener(type, callback)
    }

    private dispatch(eventType: ConnectionEvent): boolean {
        Connection.logger.debug('Connection', 'event', eventType)
        return super.dispatchEvent(new Event(eventType))
    }
}
