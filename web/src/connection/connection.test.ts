import { describe, expect, it } from 'vitest'
import { Connection, ConnectionState } from '@/connection/connection'

describe('Connection', function () {
    it('basic', async () =>
        new Promise<void>(function (resolve) {
            const con = new Connection('ws://localhost:9898/ws', (message) => {
                console.debug(message)
            })
            expect(con).toBeInstanceOf(Connection)
            con.addEventListener('open', () => {
                expect(con.state).not.toEqual(ConnectionState.CONNECTING)
                resolve()
            })
        }))
})
