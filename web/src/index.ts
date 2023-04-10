import { workerWrap } from '@/sharedworker/wrap'
import { Connection } from './connection/connection'
import type {
    IConnection,
    ConnectionMessageHandler,
} from './connection/connection'

export { workerWrap, Connection }
export type { IConnection, ConnectionMessageHandler }
