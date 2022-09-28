import { workerWrap } from '@/workerWrap/wrap'
import type { ConnectionEvent, ConnectionState } from './connection/connection'
import { Connection } from './connection/connection'

export { workerWrap, Connection }
export type { ConnectionEvent, ConnectionState }
