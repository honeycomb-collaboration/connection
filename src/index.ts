const sharedWorker = new SharedWorker(
    new URL('./sharedworker/sharedworker.ts', import.meta.url),
    {
        type: 'module',
        name: 'honeycomb-websocket',
    }
)

export class Socket {
    constructor(url: string, onMessage: (message: string) => unknown) {
        sharedWorker.port.postMessage({ t: 'init', d: url })
        sharedWorker.port.onmessage = (evt) => {
            onMessage(evt.data)
        }
    }

    // public sendBuffer(buf: ArrayBuffer): void {
    //     sharedWorker.port.postMessage({ t: 'buffer-message', d: buf }, [buf])
    // }

    public send(message: string): void {
        sharedWorker.port.postMessage({ t: 'string-message', d: message })
    }
}
