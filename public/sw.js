/**
 * Service Worker：提供離線瀏覽與安裝 (PWA) 能力
 * 快取策略：
 *   - /api/*        → 完全不快取（資料一律走網路，離線時由前端 LocalStorage 接手）
 *   - 導覽請求      → 網路優先，離線時回傳快取的 index.html
 *   - 其他靜態資源  → 快取優先並於背景更新 (stale-while-revalidate)
 */

const VERSION = 'v1'
const CACHE_NAME = `hakka-finance-${VERSION}`

// sw.js 位於部署根目錄，因此可推得 base path（GitHub Pages 為 /finance-tracker/）
const BASE = new URL('./', self.location.href).pathname

const APP_SHELL = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`,
  `${BASE}favicon.svg`,
  `${BASE}pwa-192.png`,
  `${BASE}pwa-512.png`,
  `${BASE}apple-touch-icon.png`
]

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        // 單一資源失敗不應讓整個安裝失敗
        await Promise.all(
          APP_SHELL.map(url => cache.add(url).catch(err => console.warn('[SW] 預先快取失敗:', url, err)))
        )
      } catch (err) {
        // 快取不可用（例如無痕模式或儲存空間不足）時仍讓 SW 安裝成功，僅失去離線能力
        console.warn('[SW] 預先快取略過:', err)
      }
    })()
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
      } catch (err) {
        console.warn('[SW] 清理舊快取失敗:', err)
      }
      await self.clients.claim()
    })()
  )
})

// 由前端按下「立即更新」時觸發，讓新版本 SW 直接接手
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

const isApiRequest = url => url.pathname.startsWith(`${BASE}api/`) || url.pathname.startsWith('/api/')

self.addEventListener('fetch', event => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 僅處理同源資源；API 一律直接走網路
  if (url.origin !== self.location.origin || isApiRequest(url)) return

  // 導覽請求：網路優先，離線時回退到快取的 index.html
  if (request.mode === 'navigate') {
    // 僅有首頁的回應可用來更新 app shell，避免其他路徑（例如 404 頁）覆蓋離線首頁
    const isAppShell = url.pathname === BASE || url.pathname === `${BASE}index.html`

    event.respondWith(
      fetch(request)
        .then(response => {
          if (isAppShell && response.ok) {
            const copy = response.clone()
            caches
              .open(CACHE_NAME)
              .then(cache => cache.put(`${BASE}index.html`, copy))
              .catch(() => {})
          }
          return response
        })
        .catch(async () => {
          try {
            const cache = await caches.open(CACHE_NAME)
            const cached = (await cache.match(`${BASE}index.html`)) || (await cache.match(BASE))
            if (cached) return cached
          } catch (err) {
            console.warn('[SW] 讀取離線頁面失敗:', err)
          }
          return Response.error()
        })
    )
    return
  }

  // 靜態資源：快取優先，並於背景取得最新版本
  event.respondWith(
    (async () => {
      let cache = null
      try {
        cache = await caches.open(CACHE_NAME)
      } catch (err) {
        // 快取不可用時直接走網路，不影響瀏覽
        return fetch(request)
      }

      const cached = await cache.match(request).catch(() => null)

      const network = fetch(request)
        .then(response => {
          if (response && response.ok && response.type === 'basic') {
            cache.put(request, response.clone()).catch(() => {})
          }
          return response
        })
        .catch(() => null)

      return cached || (await network) || Response.error()
    })()
  )
})
