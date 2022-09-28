export function workerWrap(workerUrl: string) {
    const sharedWorker = new SharedWorker(workerUrl, {
        type: 'module',
        name: 'honeycomb-connection',
    })

    return class Socket {
        constructor(url: string, messageHandler: (message: string) => unknown) {
            sharedWorker.port.postMessage({ t: 'init', d: url })
            sharedWorker.port.onmessage = (evt) => {
                messageHandler(evt.data)
            }
        }

        public sendBuffer(buf: ArrayBufferLike): void {
            sharedWorker.port.postMessage(
                { t: 'buffer-message', d: buf },
                { transfer: [buf] }
            )
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
            sharedWorker.port.postMessage({ t: 'string-message', d: message })
        }
    }
}
