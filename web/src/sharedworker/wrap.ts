import type {
    MessagePortFromWorkerData,
    MessagePortToWorkerData,
} from '@/sharedworker/data'
import { ConnectionMessageHandler, IConnection } from '@/connection/connection'

export function workerWrap(workerUrl: string) {
    const sharedWorker = new SharedWorker(workerUrl, {
        type: 'module',
        name: 'honeycomb-connection',
    })

    return class Socket implements IConnection {
        private readonly url: string
        private readonly portMessageHandler

        constructor(url: string, messageHandler: ConnectionMessageHandler) {
            this.url = url
            this.portMessageHandler = (
                evt: MessageEvent<MessagePortFromWorkerData>
            ) => {
                const { url, payload } = evt.data

                if (url === this.url) {
                    messageHandler(payload)
                }
            }
            sharedWorker.port.addEventListener(
                'message',
                this.portMessageHandler
            )
            sharedWorker.port.start()
            sharedWorker.port.postMessage({ url: this.url })
        }

        public send(
            message: string | ArrayBufferLike | Blob | ArrayBufferView
        ): void {
            const data: MessagePortToWorkerData = {
                url: this.url,
                payload: message,
            }

            if (
                // message instanceof SharedArrayBuffer ||
                message instanceof ArrayBuffer
            ) {
                sharedWorker.port.postMessage(data, {
                    transfer: [message],
                })
            } else {
                sharedWorker.port.postMessage(data)
            }
        }

        public close(): void {
            sharedWorker.port.removeEventListener(
                'message',
                this.portMessageHandler
            )
        }
    }
}
