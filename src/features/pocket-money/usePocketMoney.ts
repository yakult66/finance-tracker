import { ref } from 'vue'
import { fetchApi } from '../../shared/api'
import { allocationsHistory } from '../salary-allocation/useSalaryAllocation'

export type PocketCategory = '餐費' | '交通' | '遠程交通' | '旅遊' | '娛樂' | '其他'

export const POCKET_CATEGORIES: PocketCategory[] = [
  '餐費',
  '交通',
  '遠程交通',
  '旅遊',
  '娛樂',
  '其他'
]

export interface PocketMoneyTransaction {
  id: string
  type: 'income' | 'expense'
  category: PocketCategory
  name: string
  amount: number
  date: string
  createdAt: number
}

export interface PocketMoneyMonthRecord {
  id: string
  year: number
  month: number
  allocatedAllowance: number
  transactions: PocketMoneyTransaction[]
  createdAt?: number
  updatedAt?: number
}

const STORAGE_KEY = 'finance_pocket_money'
const pocketMoneyRecords = ref<PocketMoneyMonthRecord[]>([])

// 初始載入與 MongoDB Atlas 同步
const loadPocketMoney = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      pocketMoneyRecords.value = JSON.parse(stored)
    }

    const remoteData = await fetchApi<PocketMoneyMonthRecord[]>('/api/pocket-money')
    if (remoteData !== null) {
      pocketMoneyRecords.value = remoteData
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData))
    }
  } catch (e) {
    console.error('零用金紀錄載入失敗:', e)
  }
}
loadPocketMoney()

// 取得特定年月薪資分配設定的「零用金」
export const getAllocatedAllowanceFromSalary = (year: number, month: number): number => {
  const record = allocationsHistory.value.find(a => {
    const rYear = new Date(a.payday).getFullYear()
    return rYear === year && Number(a.month) === month
  })
  return record ? Number(record.allowance || 0) : 0
}

// 獨立計算未花完零用金，避免與 useSalaryAllocation 產生循環呼叫
export const calculateUnspentAllowance = (
  yearOrRecord?: number | PocketMoneyMonthRecord | null,
  month?: number,
  fallbackAllocated = 0
): number => {
  let record: PocketMoneyMonthRecord | undefined
  let yr = 0
  let mo = 0

  if (typeof yearOrRecord === 'object' && yearOrRecord !== null) {
    record = yearOrRecord
    yr = record.year
    mo = record.month
  } else if (typeof yearOrRecord === 'number' && month) {
    yr = yearOrRecord
    mo = month
    record = pocketMoneyRecords.value.find(r => r.year === yr && r.month === mo)
  }

  // 自動連動從薪資分配取得最新零用金額度
  const salaryAllocated = yr && mo ? getAllocatedAllowanceFromSalary(yr, mo) : 0
  const allocated = salaryAllocated > 0 ? salaryAllocated : Number(record?.allocatedAllowance || fallbackAllocated)

  if (!record) return allocated

  const totalInc = record.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalExp = record.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  return (allocated + totalInc) - totalExp
}

export function usePocketMoney() {
  const getOrCreateMonthRecord = (year: number, month: number): PocketMoneyMonthRecord => {
    let rec = pocketMoneyRecords.value.find(r => r.year === year && r.month === month)
    const salaryAllocated = getAllocatedAllowanceFromSalary(year, month)

    if (!rec) {
      rec = {
        id: crypto.randomUUID(),
        year,
        month,
        allocatedAllowance: salaryAllocated,
        transactions: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      pocketMoneyRecords.value.push(rec)
      saveRecords()
    } else if (salaryAllocated > 0 && rec.allocatedAllowance !== salaryAllocated) {
      rec.allocatedAllowance = salaryAllocated
      saveRecords()
    }
    return rec
  }

  const saveRecords = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pocketMoneyRecords.value))
    await fetchApi('/api/pocket-money', {
      method: 'POST',
      body: JSON.stringify(pocketMoneyRecords.value)
    })
  }

  const addTransaction = (year: number, month: number, tx: Omit<PocketMoneyTransaction, 'id' | 'createdAt'>) => {
    const record = getOrCreateMonthRecord(year, month)
    const newTx: PocketMoneyTransaction = {
      ...tx,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    }
    record.transactions.unshift(newTx)
    record.updatedAt = Date.now()
    saveRecords()
  }

  const deleteTransaction = (year: number, month: number, txId: string) => {
    const record = pocketMoneyRecords.value.find(r => r.year === year && r.month === month)
    if (record) {
      record.transactions = record.transactions.filter(t => t.id !== txId)
      record.updatedAt = Date.now()
      saveRecords()
    }
  }

  const getCategoryStatistics = (transactions: PocketMoneyTransaction[]) => {
    const expenseTx = transactions.filter(t => t.type === 'expense')
    const totalExpense = expenseTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const stats = POCKET_CATEGORIES.map(category => {
      const amount = expenseTx
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      return {
        category,
        amount,
        percentage: Number(percentage.toFixed(1))
      }
    })

    return {
      totalExpense,
      stats
    }
  }

  return {
    pocketMoneyRecords,
    POCKET_CATEGORIES,
    getOrCreateMonthRecord,
    addTransaction,
    deleteTransaction,
    calculateUnspentAllowance,
    getCategoryStatistics,
    getAllocatedAllowanceFromSalary,
    saveRecords
  }
}
