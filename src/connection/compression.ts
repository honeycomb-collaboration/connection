import { gzip, ungzip } from 'pako'

export function compress(data: string | Uint8Array | ArrayBuffer): Uint8Array {
    return gzip(data)
}

export function decompress(data: Uint8Array | ArrayBuffer): Uint8Array {
    return ungzip(data)
}
