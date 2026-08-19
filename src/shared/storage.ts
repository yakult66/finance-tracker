import { ref, watch } from 'vue'
import type { Ref } from 'vue'

// localStorage 讀寫與 id 產生，所有 feature 共用這一份，
// 各自的 key 與資料形狀仍由該 feature 自己決定。

export function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  try {
    const parsed = JSON.parse(raw) as T | null
    return parsed === null ? fallback : parsed
  } catch {
    return fallback
  }
}

interface PersistedRefOptions<T> {
  revive?: (stored: T) => T
  immediate?: boolean
}

// 建一個會自動寫回 localStorage 的 ref
// immediate: true 會把初始值立刻寫回去，用在帶種子資料的情況
export function persistedRef<T>(
  key: string,
  fallback: T,
  { revive, immediate = false }: PersistedRefOptions<T> = {}
): Ref<T> {
  const stored = load<T>(key, fallback)
  const initial = revive ? revive(stored) : stored
  const state = ref(initial) as Ref<T>
  watch(state, (v) => localStorage.setItem(key, JSON.stringify(v)), {
    deep: true,
    immediate
  })
  return state
}

interface PersistedListOptions<T> {
  fallback?: T[]
  revive?: (list: T[]) => T[]
}

// 陣列型資料：讀到不是陣列時退回空陣列，避免壞掉的資料炸掉畫面
export function persistedList<T>(
  key: string,
  { fallback = [], revive }: PersistedListOptions<T> = {}
): Ref<T[]> {
  return persistedRef<T[]>(key, fallback, {
    revive: (stored) => {
      const list = Array.isArray(stored) ? (stored as T[]) : fallback
      return revive ? revive(list) : list
    }
  })
}

export function persistedNumber(key: string, fallback: number): Ref<number> {
  const state = ref(Number(load<number | string>(key, fallback)) || 0)
  watch(state, (v) => localStorage.setItem(key, String(v)))
  return state
}

let seq = 0
export const nextId = (): string => `${Date.now().toString(36)}-${seq++}`
