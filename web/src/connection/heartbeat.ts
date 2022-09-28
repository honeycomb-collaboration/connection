import { HEARTBEAT_INTERVAL, HEARTBEAT_MESSAGE } from '@/constant/constant'
import { Logger } from '@/logger/logger'

export function Heartbeat(websocket: WebSocket): void {
    setTimeout(() => {
        const logger = new Logger('Heartbeat')
        if (websocket.readyState === WebSocket.OPEN) {
            logger?.debug('PING')
            websocket.send(HEARTBEAT_MESSAGE.PING)
            return Heartbeat(websocket)
        } else {
            logger?.info(
                'stop cause websocket readState not open',
                websocket.readyState
            )
        }
    }, Math.trunc(HEARTBEAT_INTERVAL * (0.5 + Math.random())))
}
