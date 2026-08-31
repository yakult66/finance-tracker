/**
 * API 通訊模組：處理前端與 Express/MongoDB 後端 API 之通訊
 * 當連線失敗或伺服器離線時，彈性相容於 LocalStorage。
 */

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`)
    }
    return await res.json()
  } catch (err) {
    console.warn(`[MongoDB API Sync Warning] ${endpoint} 連線失敗，使用本地 LocalStorage:`, err)
    return null
  }
}
