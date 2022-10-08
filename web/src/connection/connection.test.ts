import { describe, expect, it } from 'vitest'
import { Connection } from '@/connection/connection'

describe('Connection', function () {
    it('basic', async () =>
        new Promise<void>(function (resolve) {
            const con = new Connection(
                'ws://localhost:9898/v1/ws',
                (message) => {
                    console.debug(message)
                }
            )
            expect(con).toBeInstanceOf(Connection)
        }))
})
