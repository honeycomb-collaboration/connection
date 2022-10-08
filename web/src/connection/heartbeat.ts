import { HEARTBEAT_INTERVAL, HEARTBEAT_MESSAGE } from '@/constant/constant'
import { Logger } from '@/logger/logger'

export class Heartbeat {
    static logger = new Logger('Heartbeat')
    private heartbeatTimer = -1

    public start(websocket: WebSocket) {
        Heartbeat.logger.debug('heartbeat start')
        this.schedulePing(websocket)
    }

    public reset(websocket: WebSocket, reason?: string) {
        Heartbeat.logger.debug('reset cause', reason)
        clearTimeout(this.heartbeatTimer)
        this.schedulePing(websocket)
    }

    private schedulePing(websocket: WebSocket) {
        this.heartbeatTimer = self.setTimeout(() => {
            if (websocket.readyState === WebSocket.OPEN) {
                if (websocket.bufferedAmount === 0) {
                    Heartbeat.logger.debug('PING')
                    websocket.send(HEARTBEAT_MESSAGE.PING)
                } else {
                    Heartbeat.logger.debug(
                        'delayed cause there are application data to be sent'
                    )
                }
                return this.schedulePing(websocket)
            } else {
                Heartbeat.logger.info(
                    'stop cause websocket readState not open',
                    websocket.readyState
                )
            }
        }, Math.trunc(HEARTBEAT_INTERVAL * (0.5 + Math.random())))
    }
}
