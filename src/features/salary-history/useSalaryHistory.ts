import { ref } from 'vue'
import type { SalaryAllocation } from '../salary-allocation/interfaces'

const STORAGE_KEY = 'finance_salary_allocation'
const allocationsHistory = ref<SalaryAllocation[]>([])

// 初始載入與無痛資料轉移 (Migration)
const loadHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 如果是舊版單一物件，轉成陣列
      if (!Array.isArray(parsed) && parsed.month !== undefined) {
        allocationsHistory.value = [parsed]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allocationsHistory.value))
      } else if (Array.isArray(parsed)) {
        allocationsHistory.value = parsed
      }
    }
  } catch (e) {
    console.error('歷史紀錄載入失敗:', e)
  }
}
loadHistory()

export function useSalaryHistory() {
  const saveToHistory = (dataToSave: SalaryAllocation) => {
    const year = new Date(dataToSave.payday).getFullYear()
    const existingIndex = allocationsHistory.value.findIndex(a => 
      new Date(a.payday).getFullYear() === year && a.month === dataToSave.month
    )
    
    if (existingIndex !== -1) {
      // 更新現有月份紀錄
      allocationsHistory.value[existingIndex] = dataToSave
    } else {
      // 新增全新月份紀錄
      dataToSave.id = crypto.randomUUID()
      allocationsHistory.value.push(dataToSave)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allocationsHistory.value))
  }

  const findRecord = (year: number, month: number) => {
    return allocationsHistory.value.find(a => 
      new Date(a.payday).getFullYear() === year && a.month === month
    )
  }

  return {
    allocationsHistory,
    saveToHistory,
    findRecord
  }
}
