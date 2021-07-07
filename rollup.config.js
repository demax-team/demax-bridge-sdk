import { uglify } from 'rollup-plugin-uglify';
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
import pkg from './package.json';
// import builtins from 'rollup-plugin-node-builtins';
export default {
  // entry: 'ng2-App/Bootstrapper/Components/main-aot.js',
  input: './src/entry.js',
  output: {
    file: './dist/abc.js',
    // format: 'cjs',
    format: 'umd',
    name: 'file',
    // globals: {
    //   'async_hooks': 'async_hooks'
    // }
  },
  runtimeHelpers: false,
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    resolve(
// {
//           // 将自定义选项传递给解析插件
//           customResolveOptions: {
//             moduleDirectory: 'node_modules'
//           }
//         }
    ),
    // commonjs(),
    terser(),
    json(),
    uglify(),
    // builtins(),
    // resolve({
    //   browser: true,
    //   dedupe: ['svelte']
    // }),

    commonjs({
      include: ['node_modules/**'],
      sourceMap: false
    }),
  ],
  // onwarn: function (warning) {
  //   if (warning.code === 'THIS_IS_UNDEFINED') {
  //     return;
  //   }
  //   console.error(warning.message);
  // },
};
