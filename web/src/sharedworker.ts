import { Logger } from '@/logger/logger'
import { Connection } from '@/connection/connection'

const logger = new Logger('SharedWorkerGlobal')

// Url to MessagePort map, an url can be shared between multiple MessagePorts
const urlToPorts = new Map<string, Set<MessagePort>>()
// MessagePort to Connection map, a message port uses at most one connection, for now.
const portToConn = new WeakMap<MessagePort, Connection>()

/**
 * Initialize the connection to an url if necessary
 * @param url
 * @param port
 */
function initConnection(url: string, port: MessagePort) {
    const preConn = portToConn.get(port)
    if (preConn) {
        return preConn
    }
    const ports = urlToPorts.get(url)
    const conn = new Connection(url, (message: string) =>
        handleServerMessage(message, url)
    )
    if (ports) {
        ports.add(port)
    } else {
        urlToPorts.set(url, new Set([port]))
    }
    portToConn.set(port, conn)
}

/**
 * Handle message error event on MessagePort
 * @param port
 * @param messageEvent
 */
function onPortMessageError(port: MessagePort, messageEvent: MessageEvent) {
    logger.error('port error', port, messageEvent)
    port.close()
    const conn = portToConn.get(port)
    portToConn.delete(port)

    urlToPorts.forEach((portSet, url) => {
        if (!portSet.has(port)) {
            return
        }
        portSet.delete(port)
        if (portSet.size === 0) {
            urlToPorts.delete(url)
            conn?.close()
        }
    })
}

/**
 * Handle message from server
 * @param message
 * @param url
 */
function handleServerMessage(message: string, url: string) {
    logger.info('handle conn message', message, url)
    const ports = urlToPorts.get(url)
    ports?.forEach((port) => {
        port.postMessage(message)
    })
}

/**
 * Send message to server
 * @param port
 * @param message
 */
function sendMessage(port: MessagePort, message: string | ArrayBufferLike) {
    const conn = portToConn.get(port)
    if (conn) {
        conn.send(message)
    } else {
        logger.error('send before init', message)
    }
}

onconnect = function (evt) {
    logger.debug('onconnect', evt)
    for (const port of evt.ports) {
        port.onmessageerror = (evt) => onPortMessageError(port, evt)
        port.onmessage = function (messageEvent) {
            logger.debug('port message', port, messageEvent.data)
            if (messageEvent.data.t === 'init') {
                const url = messageEvent.data.d
                initConnection(url, port)
            } else {
                sendMessage(port, messageEvent.data.d)
            }
        }
    }
}
