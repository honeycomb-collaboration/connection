import { defineConfig } from 'vitest/config'
import { join } from 'path'

export default defineConfig({
    build: {
        lib: {
            entry: {
                sharedworker: 'src/sharedworker.ts',
                index: 'src/index.ts',
            },
        },
        sourcemap: true,
    },
    resolve: {
        alias: [
            {
                find: /^@\//,
                replacement: join(__dirname, 'src/'),
            },
        ],
    },
    test: {
        environment: 'jsdom',
    },
})
