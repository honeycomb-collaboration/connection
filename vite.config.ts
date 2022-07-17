import { defineConfig } from 'vitest/config'
import { join, resolve } from 'path'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            formats: ['cjs', 'es'],
            fileName: 'websocket',
        },
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
