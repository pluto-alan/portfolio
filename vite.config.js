import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 线上部署走站点根路径（/）：/studio 后台、/media 图片都能正确解析。
  // 若需要「双击 dist/index.html 就能开」的离线包，用 VITE_BASE_PATH=./ npm run build
  base: process.env.VITE_BASE_PATH || '/',
})
