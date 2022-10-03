import { bufferToString, stringToBuffer } from '@/utils/buffer'
import type { MessagePortData } from '@/workerWrap/data'

export function workerWrap(workerUrl: string) {
    const sharedWorker = new SharedWorker(workerUrl, {
        type: 'module',
        name: 'honeycomb-connection',
    })

    return class Socket {
        private readonly url: string
        private readonly portMessageHandler

        constructor(url: string, messageHandler: (message: string) => unknown) {
            this.url = url
            this.portMessageHandler = (evt: MessageEvent<MessagePortData>) => {
                const { url, payload } = evt.data

                if (url === this.url) {
                    bufferToString(payload).then((str) => {
                        messageHandler(str)
                    })
                }
            }
            sharedWorker.port.addEventListener(
                'message',
                this.portMessageHandler
            )
            sharedWorker.port.start()
        }

        public sendBuffer(buf: ArrayBufferLike): void {
            const data: MessagePortData = { url: this.url, payload: buf }
            sharedWorker.port.postMessage(data, { transfer: [data.payload] })
        }

        public sendBufferView(bufView: ArrayBufferView): void {
            const buf = bufView.buffer
            this.sendBuffer(buf)
        }

        public sendBlob(blob: Blob): void {
            blob.arrayBuffer().then((buf) => {
                this.sendBuffer(buf)
            })
        }

        public send(message: string): void {
            stringToBuffer(message).then((buf) => {
                this.sendBuffer(buf)
            })
        }

        public close(): void {
            sharedWorker.port.removeEventListener(
                'message',
                this.portMessageHandler
            )
        }
    }
}
