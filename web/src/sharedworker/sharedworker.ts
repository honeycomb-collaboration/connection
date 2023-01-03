import { Logger } from '@/logger/logger'
import { Connection } from '@/connection/connection'
import type {
    MessagePortFromWorkerData,
    MessagePortToWorkerData,
} from '@/sharedworker/data'

const logger = new Logger('SharedWorkerGlobal')

const urlToPorts = new Map<string, Set<MessagePort>>()
const urlToConn = new Map<string, Connection>()

/**
 * Initialize the connection to an url if necessary
 * @param url
 * @param port
 */
function initConnection(url: string, port: MessagePort): Connection {
    let conn: Connection
    const preConn = urlToConn.get(url)
    if (preConn) {
        conn = preConn
    } else {
        conn = new Connection(url, (message: ArrayBufferLike) =>
            handleServerMessage(message, url)
        )
        urlToConn.set(url, conn)
    }
    const ports = urlToPorts.get(url)
    if (ports) {
        ports.add(port)
    } else {
        urlToPorts.set(url, new Set([port]))
    }
    return conn
}

/**
 * Handle message error event on MessagePort
 * @param port
 * @param messageEvent
 */
function onPortMessageError(port: MessagePort, messageEvent: MessageEvent) {
    logger.error('port error', port, messageEvent)
    port.close()

    urlToPorts.forEach((portSet, url) => {
        if (!portSet.has(port)) {
            return
        }
        portSet.delete(port)
        if (portSet.size === 0) {
            urlToPorts.delete(url)
            const conn = urlToConn.get(url)
            conn?.close()
            urlToConn.delete(url)
        }
    })
}

/**
 * Handle message from server
 * @param message
 * @param url
 */
function handleServerMessage(message: ArrayBufferLike, url: string) {
    logger.info('handle conn message', message, url)
    const mpd: MessagePortFromWorkerData = { url, payload: message }
    const ports = urlToPorts.get(url)
    ports?.forEach((port) => {
        port.postMessage(mpd)
    })
}

onconnect = function (evt) {
    logger.debug('onconnect', evt)
    for (const port of evt.ports) {
        port.onmessageerror = (evt) => onPortMessageError(port, evt)
        port.onmessage = function (
            messageEvent: MessageEvent<MessagePortToWorkerData>
        ) {
            logger.debug('port message', port, messageEvent.data)
            const { url, payload } = messageEvent.data
            const conn = initConnection(url, port)
            conn.send(payload)
        }
    }
}
