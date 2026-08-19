import { computed } from 'vue'
import { persistedList, persistedNumber, nextId } from '../../shared/storage'
import { useCashFlow } from '../cash-flow/useCashFlow'
import type { Plan, TransactionRecord } from '../../types'

// 這個 feature 擁有目標金額、保費專戶與規劃快照。
// 累積資產要靠 cash-flow 的紀錄，所以向它拿。

const PLANS_KEY = 'finance_plans'
const GOAL_KEY = 'finance_goal'
const INITIAL_BALANCE_KEY = 'finance_first_goal_initial'
const TRANSACTIONS_KEY = 'finance_first_goal_transactions'

export const DEFAULT_GOAL = 1000000

const plans = persistedList<Plan>(PLANS_KEY)
const goal = persistedNumber(GOAL_KEY, DEFAULT_GOAL)
const initialBalance = persistedNumber(INITIAL_BALANCE_KEY, 0)
const transactions = persistedList<TransactionRecord>(TRANSACTIONS_KEY)

const { accumulatedPureSaving } = useCashFlow()

// 所有月份的「純存錢」 + 初始資金 + 單次存入 - 單次支出
const totalAssets = computed(() => {
  let sum = accumulatedPureSaving.value + initialBalance.value
  transactions.value.forEach((t) => {
    if (t.type === 'in') {
      sum += t.amount
    } else {
      sum -= t.amount
    }
  })
  return sum
})

const remainingToGoal = computed(() => Math.max(0, goal.value - totalAssets.value))

const progressPercentage = computed(() => {
  if (!goal.value) return '0.0'
  const p = (totalAssets.value / goal.value) * 100
  return Math.min(100, Math.max(0, p)).toFixed(1)
})

// 按下「儲存這份規劃」時產生的快照
function addPlan(snapshot: Omit<Plan, 'id' | 'createdAt'>): Plan {
  const plan: Plan = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    ...snapshot
  }
  plans.value.unshift(plan)
  return plan
}

function removePlan(id: string): void {
  const index = plans.value.findIndex((p) => p.id === id)
  if (index !== -1) plans.value.splice(index, 1)
}

function addTransaction(description: string, amount: number, date: string, type: 'in' | 'out') {
  transactions.value.unshift({
    id: nextId(),
    description: description.trim() || (type === 'in' ? '單次存入' : '單次支出'),
    amount: amount || 0,
    date: date || new Date().toISOString().split('T')[0],
    type
  })
}

function removeTransaction(id: string) {
  const idx = transactions.value.findIndex((i) => i.id === id)
  if (idx !== -1) transactions.value.splice(idx, 1)
}

export function useFirstGoal() {
  return {
    plans,
    goal,
    initialBalance,
    transactions,
    totalAssets,
    remainingToGoal,
    progressPercentage,
    addPlan,
    removePlan,
    addTransaction,
    removeTransaction,
    DEFAULT_GOAL
  }
}
