import { ref, watch } from 'vue'

// localStorage 讀寫與 id 產生，所有 feature 共用這一份，
// 各自的 key 與資料形狀仍由該 feature 自己決定。

export function load(key, fallback) {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed === null ? fallback : parsed
  } catch {
    return fallback
  }
}

// 建一個會自動寫回 localStorage 的 ref
// immediate: true 會把初始值立刻寫回去，用在帶種子資料的情況
export function persistedRef(key, fallback, { revive, immediate = false } = {}) {
  const stored = load(key, fallback)
  const initial = revive ? revive(stored) : stored
  const state = ref(initial)
  watch(state, (v) => localStorage.setItem(key, JSON.stringify(v)), {
    deep: true,
    immediate
  })
  return state
}

// 陣列型資料：讀到不是陣列時退回空陣列，避免壞掉的資料炸掉畫面
export function persistedList(key, { fallback = [], revive } = {}) {
  return persistedRef(key, fallback, {
    revive: (stored) => {
      const list = Array.isArray(stored) ? stored : fallback
      return revive ? revive(list) : list
    }
  })
}

export function persistedNumber(key, fallback) {
  const state = ref(Number(load(key, fallback)) || 0)
  watch(state, (v) => localStorage.setItem(key, String(v)))
  return state
}

let seq = 0
export const nextId = () => `${Date.now().toString(36)}-${seq++}`
