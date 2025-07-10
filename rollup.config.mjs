import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { default as alias } from '@rollup/plugin-alias';
import { default as commonjs } from '@rollup/plugin-commonjs';
import { default as resolve } from '@rollup/plugin-node-resolve';
import { default as replace } from '@rollup/plugin-replace';
import { default as swc } from '@rollup/plugin-swc';
import { default as terser } from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';
import { default as copy } from 'rollup-plugin-copy';
import { default as postcss } from 'rollup-plugin-postcss';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
    {
        input: 'src/server/index.tsx',
        output: {
            file: 'dist/index.cjs',
            format: 'cjs',
        },
        plugins: [
            alias({
                entries: [{ find: '@', replacement: join(currentDir, 'src') }],
            }),
            swc(),
            commonjs(),
            terser(),
        ],
    },
    {
        input: 'src/client/index.tsx',
        output: {
            file: 'dist/static/index.js',
            format: 'cjs',
            name: 'index',
        },
        plugins: [
            alias({
                entries: [{ find: '@', replacement: join(currentDir, 'src') }],
            }),
            replace({
                preventAssignment: true,
                'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
            }),
            resolve({
                browser: true,
                preferBuiltins: false,
            }),
            swc(),
            commonjs(),
            terser(),
            copy({
                targets: [
                    {
                        dest: 'dist/static',
                        src: 'static/**/*',
                    },
                ],
                verbose: true,
            }),
        ],
    },
    {
        input: 'src/shared/styles/globals.css',
        output: {
            file: 'dist/static/styles.css',
        },
        plugins: [
            postcss({
                extract: true,
                minimize: process.env.NODE_ENV === 'production',
            }),
        ],
    },
]);
