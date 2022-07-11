import { Logger } from '@/logger'
import { Connection } from '@/connection'

const logger = new Logger('SharedWorkerGlobal')

const urlToConn = new Map<string, Connection>()
const portToConn = new WeakMap<MessagePort, Connection>()

function onerror(port: MessagePort, messageEvent: MessageEvent) {
    logger.error('port error', port, messageEvent)
    port.close()
    const conn = portToConn.get(port)
    portToConn.delete(port)
    if (conn && Object.values(portToConn).every((_conn) => _conn !== conn)) {
        urlToConn.forEach((_conn, url) => {
            if (conn === _conn) {
                urlToConn.delete(url)
            }
        })
    }
}

onconnect = function (evt) {
    logger.debug('onconnect', evt)
    for (const port of evt.ports) {
        port.onmessageerror = (evt) => onerror(port, evt)
        port.onmessage = function (messageEvent) {
            logger.debug('port message', port, messageEvent.data)
            if (
                messageEvent.data.t === 'init' &&
                !urlToConn.has(messageEvent.data.d)
            ) {
                const conn = new Connection(messageEvent.data.d)
                urlToConn.set(messageEvent.data.d, conn)
                portToConn.set(port, conn)
            } else {
                const conn = portToConn.get(port)
                conn?.send(messageEvent.data.d)
            }
        }
    }
    logger.debug(urlToConn, portToConn)
}
