import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'

// 빌드할 때마다 sw.js의 캐시 버전을 타임스탬프로 자동 갱신
const swVersionPlugin = {
  name: 'sw-version',
  closeBundle() {
    const path = './dist/sw.js'
    try {
      const sw = readFileSync(path, 'utf-8').replace(
        /miri-hankki-v\d+/,
        `miri-hankki-v${Date.now()}`,
      )
      writeFileSync(path, sw)
    } catch {}
  },
}

export default defineConfig({
  plugins: [react(), swVersionPlugin],
  base: '/miri-hankki/',
})
