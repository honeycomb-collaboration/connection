import { Logger } from '@/logger/logger'
import { Heartbeat } from '@/connection/heartbeat'

export interface IConnection {
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void

    close(code?: number, reason?: string): void
}

export interface ConnectionMessageHandler {
    (message: ArrayBufferLike): unknown
}

export class Connection implements IConnection {
    private static readonly INTERNAL_CLOSE = 'INTERNAL_CLOSE'
    private static readonly logger = new Logger('Connection')
    private readonly heartbeat: Heartbeat = new Heartbeat()
    private ws: WebSocket
    private reconnectCount = 0

    constructor(url: string | URL, messageHandler: ConnectionMessageHandler) {
        this.ws = this.spawnWS(url, messageHandler)
    }

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        Connection.logger.debug('send', data)
        this.ws.send(data)
        this.heartbeat.reset(this.ws, 'just sent some data')
    }

    public close(code?: number, reason?: string): void {
        Connection.logger.info('close intentionally', {
            code,
            reason,
        })
        this.ws.close(code, Connection.INTERNAL_CLOSE + reason)
    }

    private spawnWS(
        url: string | URL,
        messageHandler: (message: ArrayBufferLike) => unknown
    ): WebSocket {
        Connection.logger.debug('spawn WebSocket')
        const logger = new Logger('WebSocket')
        const ws = new WebSocket(url)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = function (evt) {
            if (evt.data.byteLength === 0) {
                logger.debug('PONG')
                return
            }
            logger.debug('message', evt, evt.data)
            messageHandler(evt.data)
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
            this.spawnWS(url, messageHandler)
        }
        ws.onopen = (evt) => {
            logger.debug('open', evt)
            this.reconnectCount = 0
            this.heartbeat.start(ws)
        }
        this.ws = ws
        return ws
    }
}
