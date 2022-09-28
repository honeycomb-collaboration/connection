import { defineConfig } from 'vitest/config'
import { join, resolve } from 'path'

export default defineConfig((env) => ({
    build: {
        lib:
            env.mode === 'sharedworker'
                ? {
                      entry: resolve(__dirname, 'src/sharedworker.ts'),
                      formats: ['cjs', 'es'],
                      fileName: 'sharedworker',
                  }
                : {
                      entry: resolve(__dirname, 'src/index.ts'),
                      formats: ['cjs', 'es'],
                      fileName: 'index',
                  },
        sourcemap: true,
        emptyOutDir: env.mode !== 'sharedworker',
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
}))
