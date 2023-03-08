// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/lib.ts'),
      name: 'react-three-avatar',
      // the proper extensions will be added
      fileName: 'react-three-avatar',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['@react-three/drei', '@react-three/fiber', 'leva', 'react', 'react-dom', 'three', 'react/jsx-runtime'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          '@react-three/drei': 'ReactThreeDrei',
          '@react-three/fiber': 'ReactThreeFiber',
          'leva': 'Leva',
          'react': 'React',
          'react-dom': 'ReactDOM',
          'three': 'THREE',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
})
