import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

function cssStub() {
  return {
    name: 'css-stub',
    resolveId(source) {
      if (source.endsWith('.css')) {
        return source;
      }
      return null;
    },
    load(id) {
      if (id.endsWith('.css')) {
        return '';
      }
      return null;
    }
  };
}

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      inlineDynamicImports: true
    }
  ],
  plugins: [
    peerDepsExternal(),
    cssStub(),
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' })
  ],
  external: ['react', 'react-dom', '@xyflow/react']
};
