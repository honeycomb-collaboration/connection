import { defineConfig } from 'vitest/config'
import { join, resolve } from 'path'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['cjs', 'es'],
            fileName: 'connection',
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
