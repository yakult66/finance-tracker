/**
 * PWA 模組：處理 Service Worker 註冊、安裝提示 (A2HS) 與版本更新通知。
 * 狀態放在模組層級，讓所有元件共用同一份安裝／更新狀態。
 */
import { ref, computed } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(false)
const needRefresh = ref(false)
const showIosGuide = ref(false)

let registration: ServiceWorkerRegistration | null = null

const detectStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari 專屬旗標
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true

const detectIos = () => {
  const ua = window.navigator.userAgent
  const iOS = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ 的 UA 會偽裝成 Macintosh，改以觸控點數判斷
  const iPadOS = /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1
  return iOS || iPadOS
}

/** 於 app 啟動時呼叫一次：註冊事件監聽與 Service Worker */
export function setupPwa() {
  isInstalled.value = detectStandalone()

  window.addEventListener('beforeinstallprompt', event => {
    // 攔截瀏覽器預設的安裝橫幅，改由 App 內的按鈕觸發
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    isInstalled.value = true
  })

  window.matchMedia('(display-mode: standalone)').addEventListener('change', e => {
    isInstalled.value = e.matches
  })

  registerServiceWorker()
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  // 開發模式下不註冊，避免快取干擾 Vite HMR
  if (!import.meta.env.PROD) return

  const base = import.meta.env.BASE_URL

  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base })

      const watchWorker = (worker: ServiceWorker | null) => {
        if (!worker) return
        worker.addEventListener('statechange', () => {
          // 已有 controller 代表是「更新」而非首次安裝
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            needRefresh.value = true
          }
        })
      }

      if (registration.waiting && navigator.serviceWorker.controller) {
        needRefresh.value = true
      }

      // register() 回傳前就開始安裝的新版本不會觸發 updatefound，需另外接手
      watchWorker(registration.installing)

      registration.addEventListener('updatefound', () => {
        watchWorker(registration?.installing ?? null)
      })

      // 長時間開著的分頁也能定期檢查新版本
      setInterval(() => registration?.update().catch(() => {}), 60 * 60 * 1000)
    } catch (err) {
      console.warn('[PWA] Service Worker 註冊失敗:', err)
    }
  })

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

export function usePwa() {
  const isIos = detectIos()

  /** 可透過原生安裝流程安裝（Chrome / Edge / Android） */
  const canInstall = computed(() => deferredPrompt.value !== null && !isInstalled.value)
  /** iOS Safari 沒有安裝 API，只能顯示手動加入主畫面的教學 */
  const canShowIosGuide = computed(() => isIos && !isInstalled.value)
  const showInstallButton = computed(() => canInstall.value || canShowIosGuide.value)

  const install = async () => {
    if (canShowIosGuide.value && !canInstall.value) {
      showIosGuide.value = true
      return
    }

    const prompt = deferredPrompt.value
    if (!prompt) return

    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    // 提示只能使用一次，使用者取消後需等瀏覽器再次派發事件
    deferredPrompt.value = null
    if (outcome === 'accepted') {
      isInstalled.value = true
    }
  }

  const applyUpdate = () => {
    needRefresh.value = false
    if (registration?.waiting) {
      // SW 接手後會觸發 controllerchange，由該處統一重新載入頁面
      registration.waiting.postMessage('SKIP_WAITING')
    } else {
      window.location.reload()
    }
  }

  return {
    isInstalled,
    needRefresh,
    showIosGuide,
    isIos,
    canInstall,
    canShowIosGuide,
    showInstallButton,
    install,
    applyUpdate
  }
}
