const CACHE_NAME = 'miri-hankki-v1780142303013'
const BASE_PATH = new URL(self.registration.scope).pathname

// Vite가 생성한 해시 기반 asset만 캐시 우선 — 나머지는 항상 네트워크 우선
function isHashedAsset(url) {
  return url.pathname.includes('/assets/') && /\.[a-f0-9]{8,}\.(js|css)$/.test(url.pathname)
}

const APP_SHELL = [
  BASE_PATH,
  `${BASE_PATH}manifest.webmanifest`,
  `${BASE_PATH}app-icon-192.png`,
  `${BASE_PATH}app-icon-512.png`,
  `${BASE_PATH}apple-touch-icon.png`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // 해시 asset → 캐시 우선 (파일명 자체가 버전이므로 안전)
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
      }),
    )
    return
  }

  // 그 외 모든 파일 (HTML, mp4, jpg 등) → 네트워크 우선
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match(BASE_PATH))),
  )
})
