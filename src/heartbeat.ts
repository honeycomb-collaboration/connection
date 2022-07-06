import { HEARTBEAT_MESSAGE } from '@/constant'
import { DevelopLogger } from '@/logger'

export function Heartbeat(websocket: WebSocket, logger?: DevelopLogger): void {
    window.setTimeout(() => {
        if (websocket.readyState === WebSocket.OPEN) {
            logger?.debug('Heartbeat', 'PING', HEARTBEAT_MESSAGE.PING)
            websocket.send(HEARTBEAT_MESSAGE.PING)
            return Heartbeat(websocket, logger)
        } else {
            logger?.info(
                'Heartbeat',
                'stop cause websocket readState not open',
                websocket.readyState
            )
        }
    })
}
