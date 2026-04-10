import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/supabase': {
        target: 'https://htmgxlltejrgppquqwbn.supabase.co',
        changeOrigin: true,
        secure: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/supabase/, ''),
      },
    },
  },
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: 'dist',
  },
})
