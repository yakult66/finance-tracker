import { ref, computed } from 'vue'
import { fetchApi } from '../../shared/api'
import { allocationsHistory } from '../salary-allocation/useSalaryAllocation'

export interface EntertainmentTransaction {
  id: string
  type: 'deposit' | 'expense'
  name: string
  amount: number
  date: string
  createdAt: number
}

export interface EntertainmentFundData {
  id: string
  targetAmount?: number
  transactions: EntertainmentTransaction[]
}

const STORAGE_KEY = 'finance_entertainment_fund'

const fundData = ref<EntertainmentFundData>({
  id: 'default_entertainment_fund',
  transactions: []
})

// 初始載入與 MongoDB 同步
const loadData = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      fundData.value = JSON.parse(stored)
    }

    const remote = await fetchApi<EntertainmentFundData>('/api/entertainment-fund')
    if (remote) {
      fundData.value = remote
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
    }
  } catch (e) {
    console.error('娛樂基金資料載入失敗:', e)
  }
}
loadData()

export function useEntertainmentFund() {
  const saveData = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fundData.value))
    await fetchApi('/api/entertainment-fund', {
      method: 'POST',
      body: JSON.stringify(fundData.value)
    })
  }

  // 1. 薪資分配累積金額 (消費基金累積總計)
  const accumulatedFromSalary = computed(() => {
    return allocationsHistory.value.reduce((sum, item) => sum + (Number(item.consumerFund) || 0), 0)
  })

  // 2. 臨時增額總計
  const totalDeposits = computed(() => {
    return fundData.value.transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  // 3. 臨時支出總計
  const totalExpenses = computed(() => {
    return fundData.value.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  // 4. 臨時調整淨額
  const netAdjustments = computed(() => totalDeposits.value - totalExpenses.value)

  // 5. 娛樂基金目前總額 = 薪資分配累積金額 + 臨時增額 - 臨時支出
  const currentBalance = computed(() => accumulatedFromSalary.value + netAdjustments.value)

  // 新增臨時調整項目 (增額 / 支出)
  const addTransaction = (type: 'deposit' | 'expense', name: string, amount: number, date: string) => {
    const newTx: EntertainmentTransaction = {
      id: crypto.randomUUID(),
      type,
      name,
      amount,
      date,
      createdAt: Date.now()
    }
    fundData.value.transactions.unshift(newTx)
    saveData()
  }

  // 刪除臨時調整項目
  const deleteTransaction = (id: string) => {
    fundData.value.transactions = fundData.value.transactions.filter(t => t.id !== id)
    saveData()
  }

  return {
    fundData,
    accumulatedFromSalary,
    totalDeposits,
    totalExpenses,
    netAdjustments,
    currentBalance,
    addTransaction,
    deleteTransaction
  }
}
