export async function stringToBuffer(source: string): Promise<ArrayBuffer> {
    const blob = new Blob([source], {
        type: 'application/json; charset=utf-8',
    })
    return await blob.arrayBuffer()
}

export async function bufferToString(buffer: BufferSource): Promise<string> {
    const blob = new Blob([buffer], {
        type: 'application/json; charset=utf-8',
    })
    return blob.text()
}
