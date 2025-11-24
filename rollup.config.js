import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [
    // UMD build (for browsers via <script> tag)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/logigo.js',
            format: 'umd',
            name: 'LogiGo',
            sourcemap: true
        },
        plugins: [resolve()]
    },
    // UMD minified build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/logigo.min.js',
            format: 'umd',
            name: 'LogiGo',
            sourcemap: true
        },
        plugins: [resolve(), terser()]
    },
    // ES Module build (for modern bundlers)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/logigo.esm.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [resolve()]
    }
];
