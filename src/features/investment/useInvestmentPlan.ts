import { ref, computed } from 'vue'
import { fetchApi } from '../../shared/api'
import { allocationsHistory } from '../salary-allocation/useSalaryAllocation'

export interface InvestmentTransaction {
  id: string
  type: 'deposit' | 'expense'
  name: string
  amount: number
  date: string
  createdAt: number
}

export interface InvestmentPlanData {
  id: string
  targetAmount: number
  transactions: InvestmentTransaction[]
}

const STORAGE_KEY = 'finance_investment_plan'

const planData = ref<InvestmentPlanData>({
  id: 'default_investment_plan',
  targetAmount: 0,
  transactions: []
})

// 初始載入與 MongoDB 同步
const loadData = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      planData.value = JSON.parse(stored)
    }

    const remote = await fetchApi<InvestmentPlanData>('/api/investment-plan')
    if (remote) {
      planData.value = remote
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
    }
  } catch (e) {
    console.error('投資規劃資料載入失敗:', e)
  }
}
loadData()

export function useInvestmentPlan() {
  const saveData = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planData.value))
    await fetchApi('/api/investment-plan', {
      method: 'POST',
      body: JSON.stringify(planData.value)
    })
  }

  // 1. 薪資分配累積投資金額
  const accumulatedFromSalary = computed(() => {
    return allocationsHistory.value.reduce((sum, item) => sum + (Number(item.investment) || 0), 0)
  })

  // 2. 臨時增額總計
  const totalDeposits = computed(() => {
    return planData.value.transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  // 3. 臨時支出總計
  const totalExpenses = computed(() => {
    return planData.value.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  // 4. 臨時調整淨額
  const netAdjustments = computed(() => totalDeposits.value - totalExpenses.value)

  // 5. 目前累積本金 = 薪資分配累積金額 + 臨時增額 - 臨時支出
  const currentPrincipal = computed(() => accumulatedFromSalary.value + netAdjustments.value)

  // 6. 目標金額
  const targetAmount = computed(() => Number(planData.value.targetAmount || 0))

  // 7. 目標達成進度 %
  const progressPercentage = computed(() => {
    if (targetAmount.value <= 0) return 0
    const pct = (currentPrincipal.value / targetAmount.value) * 100
    return Number(pct.toFixed(1))
  })

  // 更新目標金額
  const setTargetAmount = (amount: number) => {
    planData.value.targetAmount = Number(amount || 0)
    saveData()
  }

  // 新增臨時調整項目 (增額 / 支出)
  const addTransaction = (type: 'deposit' | 'expense', name: string, amount: number, date: string) => {
    const newTx: InvestmentTransaction = {
      id: crypto.randomUUID(),
      type,
      name,
      amount,
      date,
      createdAt: Date.now()
    }
    planData.value.transactions.unshift(newTx)
    saveData()
  }

  // 刪除臨時調整項目
  const deleteTransaction = (id: string) => {
    planData.value.transactions = planData.value.transactions.filter(t => t.id !== id)
    saveData()
  }

  return {
    planData,
    accumulatedFromSalary,
    totalDeposits,
    totalExpenses,
    netAdjustments,
    currentPrincipal,
    targetAmount,
    progressPercentage,
    setTargetAmount,
    addTransaction,
    deleteTransaction
  }
}
