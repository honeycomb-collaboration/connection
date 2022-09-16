import { Logger } from '@/logger/logger'
import { Connection } from '@/connection/connection'

const logger = new Logger('SharedWorkerGlobal')

const urlToPorts = new Map<string, Set<MessagePort>>()
const portToConn = new WeakMap<MessagePort, Connection>()

function getConnection(url: string, port: MessagePort): Connection {
    const preConn = portToConn.get(port)
    if (preConn) {
        return preConn
    }
    const ports = urlToPorts.get(url)
    const conn = new Connection(url, (message: string) =>
        handleConnMessage(message, url)
    )
    if (ports) {
        ports.add(port)
    } else {
        urlToPorts.set(url, new Set([port]))
    }
    portToConn.set(port, conn)
    return conn
}

function onerror(port: MessagePort, messageEvent: MessageEvent) {
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

function handleConnMessage(message: string, url: string) {
    logger.info('handle conn message', message, url)
    const ports = urlToPorts.get(url)
    ports?.forEach((port) => {
        port.postMessage(message)
    })
}

onconnect = function (evt) {
    logger.debug('onconnect', evt)
    for (const port of evt.ports) {
        port.onmessageerror = (evt) => onerror(port, evt)
        port.onmessage = function (messageEvent) {
            logger.debug('port message', port, messageEvent.data)
            if (messageEvent.data.t === 'init') {
                const url = messageEvent.data.d
                const ports = urlToPorts.get(url)
                const conn = portToConn.get(ports?.values().next().value)
                if (!conn) {
                    const conn = new Connection(url, (message: string) =>
                        handleConnMessage(message, url)
                    )
                    if (ports) {
                        ports.add(port)
                    } else {
                        urlToPorts.set(url, new Set([port]))
                    }
                    portToConn.set(port, conn)
                } else {
                    ports?.add(port)
                    portToConn.set(port, conn)
                }
            } else {
                const conn = portToConn.get(port)
                if (conn) {
                    conn.send(messageEvent.data.d)
                } else {
                    logger.error('send before init', messageEvent.data)
                }
            }
        }
    }
    logger.debug(urlToPorts, portToConn)
}
