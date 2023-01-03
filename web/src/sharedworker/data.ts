export interface MessagePortToWorkerData {
    url: string
    payload: string | ArrayBufferLike | Blob | ArrayBufferView
}

export interface MessagePortFromWorkerData {
    url: string
    payload: ArrayBufferLike
}
