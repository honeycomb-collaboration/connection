const sharedWorker = new SharedWorker(
    new URL('./sharedworker.ts', import.meta.url),
    {
        type: 'module',
        name: 'honeycomb-websocket',
    }
)

export class Connection {
    constructor(url: string) {
        sharedWorker.port.postMessage({ t: 'init', d: url })
    }
}
