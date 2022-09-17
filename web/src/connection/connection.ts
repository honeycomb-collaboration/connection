import { Logger } from '@/logger/logger'
import { Heartbeat } from '@/connection/heartbeat'
import { bufferToString } from '@/utils/buffer'

export enum ConnectionState {
    CONNECTING = 'CONNECTING', // CONNECTING  The connection is not yet open.
    OPEN = 'OPEN', // OPEN  The connection is open and ready to communicate.
    CLOSED = 'CLOSED', // CLOSED  The connection is closed or couldn't be opened.
}

export type ConnectionEvent = 'open' | 'connecting' | 'reconnecting' | 'close'

export class Connection extends EventTarget {
    private static readonly INTERNAL_CLOSE = 'INTERNAL_CLOSE'
    private static logger = new Logger('Connection')
    private ws: WebSocket
    #state: ConnectionState = ConnectionState.CONNECTING

    public get state(): ConnectionState {
        return this.#state
    }

    constructor(
        url: string | URL,
        messageHandler: (message: string) => unknown
    ) {
        super()
        this.dispatch('connecting')
        this.ws = this.spawnWS(url, messageHandler)
    }

    private reconnectCount = 0

    private spawnWS(
        url: string | URL,
        messageHandler: (message: string) => unknown
    ): WebSocket {
        Connection.logger.debug('spawn WebSocket')
        const logger = new Logger('WebSocket')
        this.#state = ConnectionState.CONNECTING
        const ws = new WebSocket(url)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = async function (evt) {
            if (evt.data.byteLength === 0) {
                logger.debug('PONG')
                return
            }
            logger.debug('message', evt, evt.data)
            messageHandler(await bufferToString(evt.data.buffer))
        }
        ws.onerror = function (error) {
            logger.error('error', error)
        }
        ws.onclose = (evt) => {
            if (evt.reason.startsWith(Connection.INTERNAL_CLOSE)) {
                return
            }
            logger.debug('close unintentionally', evt)
            this.reconnectCount++
            this.dispatch('reconnecting')
            this.spawnWS(url, messageHandler)
        }
        ws.onopen = (evt) => {
            logger.debug('open', evt)
            this.reconnectCount = 0
            this.dispatch('open')
            return Heartbeat(ws)
        }
        this.ws = ws
        return ws
    }

    public send(data: string | ArrayBufferLike): void {
        Connection.logger.debug('send', data)
        this.ws.send(data)
    }

    public close(code?: number, reason?: string): void {
        Connection.logger.info('close intentionally', {
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
        Connection.logger.debug('addEventListener', type, callback)
        super.addEventListener(type, callback)
    }

    private dispatch(eventType: ConnectionEvent): boolean {
        Connection.logger.debug('event', eventType)
        return super.dispatchEvent(new Event(eventType))
    }
}
