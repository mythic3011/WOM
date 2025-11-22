import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/__tests__/setup.js',
    },
    resolve: {
        alias: {
            '@config': path.resolve(__dirname, './src/config'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@services': path.resolve(__dirname, './src/services'),
            '@components': path.resolve(__dirname, './src/components'),
            '@common': path.resolve(__dirname, './src/common'),
            '@data': path.resolve(__dirname, './src/data'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@router': path.resolve(__dirname, './src/router'),
        },
    },
});
